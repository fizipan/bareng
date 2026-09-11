-- Masukan: info perangkat lengkap (meta) & tanda "kemungkinan spam" (honeypot
-- terisi — disimpan, bukan dibuang, supaya kiriman asli yang kena autofill
-- tidak hilang).

alter table public.feedback
  add column meta jsonb check (meta is null or pg_column_size(meta) <= 4096),
  add column suspect boolean not null default false;

drop function public.submit_feedback(text, text, text, text, text, text);

create function public.submit_feedback(
  p_kind text,
  p_message text,
  p_email text default null,
  p_room_code text default null,
  p_page text default null,
  p_user_agent text default null,
  p_meta jsonb default null,
  p_suspect boolean default false
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

  insert into public.feedback (kind, message, email, room_code, page, user_agent, reporter, meta, suspect)
  values (
    p_kind,
    btrim(p_message),
    nullif(btrim(lower(p_email)), ''),
    nullif(upper(btrim(p_room_code)), ''),
    left(p_page, 300),
    left(p_user_agent, 400),
    who,
    case when jsonb_typeof(p_meta) = 'object' then p_meta end,
    coalesce(p_suspect, false)
  )
  returning id into new_id;

  select count(*) into last_hour from public.feedback where created_at > now() - interval '1 hour';
  return jsonb_build_object('ok', true, 'id', new_id, 'last_hour', last_hour);
end $$;

create or replace function public.admin_feedback_list()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(f order by f.resolved, f.created_at desc), '[]'::jsonb)
  from (
    select
      id, kind, message, email, room_code, page, user_agent, meta, suspect,
      resolved_at is not null as resolved,
      private.epoch_ms(created_at) as created_at
    from public.feedback
    order by created_at desc
    limit 200
  ) f
$$;

revoke execute on function public.submit_feedback(text, text, text, text, text, text, jsonb, boolean) from public;
grant execute on function public.submit_feedback(text, text, text, text, text, text, jsonb, boolean) to anon, authenticated;
