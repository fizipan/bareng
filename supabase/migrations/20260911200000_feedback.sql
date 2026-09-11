-- Pusat bantuan: masukan & laporan bug dari form /bantuan. Hanya bisa ditulis
-- lewat submit_feedback() (dibatasi) dan dibaca /admin (service_role).

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('bug', 'masukan', 'pertanyaan', 'lainnya')),
  message text not null check (char_length(message) between 10 and 2000),
  email text check (email is null or char_length(email) <= 200),
  room_code text check (room_code is null or room_code ~ '^[A-Z0-9]{6}$'),
  page text check (page is null or char_length(page) <= 300),
  user_agent text check (user_agent is null or char_length(user_agent) <= 400),
  reporter uuid,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
alter table public.feedback enable row level security;
create index feedback_created_idx on public.feedback (created_at desc);

create function public.submit_feedback(
  p_kind text,
  p_message text,
  p_email text default null,
  p_room_code text default null,
  p_page text default null,
  p_user_agent text default null
)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  who uuid := auth.uid();
  new_id uuid;
  last_hour int;
begin
  -- Batas: 5 per jam per sesi, 100 per 10 menit untuk semua (anti banjir).
  if who is not null and (
    select count(*) from public.feedback where reporter = who and created_at > now() - interval '1 hour'
  ) >= 5 then
    return jsonb_build_object('ok', false, 'reason', 'limit');
  end if;
  if (select count(*) from public.feedback where created_at > now() - interval '10 minutes') >= 100 then
    return jsonb_build_object('ok', false, 'reason', 'busy');
  end if;

  insert into public.feedback (kind, message, email, room_code, page, user_agent, reporter)
  values (
    p_kind,
    btrim(p_message),
    nullif(btrim(lower(p_email)), ''),
    nullif(upper(btrim(p_room_code)), ''),
    left(p_page, 300),
    left(p_user_agent, 400),
    who
  )
  returning id into new_id;

  select count(*) into last_hour from public.feedback where created_at > now() - interval '1 hour';
  return jsonb_build_object('ok', true, 'id', new_id, 'last_hour', last_hour);
end $$;

-- Untuk /admin: yang belum selesai di atas.
create function public.admin_feedback_list()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(f order by f.resolved, f.created_at desc), '[]'::jsonb)
  from (
    select
      id, kind, message, email, room_code, page, user_agent,
      resolved_at is not null as resolved,
      private.epoch_ms(created_at) as created_at
    from public.feedback
    order by created_at desc
    limit 200
  ) f
$$;

create function public.admin_feedback_resolve(p_id uuid, p_resolved boolean)
returns void language sql volatile security definer set search_path = '' as $$
  update public.feedback set resolved_at = case when p_resolved then now() end where id = p_id
$$;

revoke execute on function public.submit_feedback(text, text, text, text, text, text) from public;
grant execute on function public.submit_feedback(text, text, text, text, text, text) to anon, authenticated;
revoke execute on function public.admin_feedback_list() from public, anon, authenticated;
revoke execute on function public.admin_feedback_resolve(uuid, boolean) from public, anon, authenticated;
grant execute on function public.admin_feedback_list() to service_role;
grant execute on function public.admin_feedback_resolve(uuid, boolean) to service_role;
