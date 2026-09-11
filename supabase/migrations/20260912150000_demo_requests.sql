-- Akses demo lewat permintaan: orang minta dari HP-nya sendiri (halaman
-- /demo), admin menyetujui di /admin → Demo. Yang disetujui = perangkat itu
-- (sesi anonimnya), bukan akun. Akses bisa berjangka waktu.

alter table private.demo_devices add column expires_at timestamptz;

create table private.demo_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  contact text check (contact is null or char_length(contact) <= 80),
  note text check (note is null or char_length(note) <= 300),
  meta jsonb check (meta is null or pg_column_size(meta) <= 4096),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
-- Satu permintaan menunggu per perangkat.
create unique index demo_requests_pending_key on private.demo_requests (user_id) where status = 'pending';
create index demo_requests_created_idx on private.demo_requests (created_at desc);

-- Perangkat demo yang masih berlaku (dipakai create_room & status halaman /demo).
create function private.demo_active(p_user uuid)
returns boolean language sql stable set search_path = '' as $$
  select exists (
    select 1 from private.demo_devices
    where user_id = p_user and (expires_at is null or expires_at > now())
  )
$$;

create or replace function public.create_room(p_test boolean default false, p_premium boolean default false)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  is_demo boolean;
  new_code text;
  room public.rooms;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;
  -- Batas wajar anti-spam: 30 room per jam per perangkat.
  if (select count(*) from public.rooms where host_id = uid and created_at > now() - interval '1 hour') >= 30 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  is_demo := private.demo_active(uid);
  -- Batas gratis (PRD): 3 sesi per hari (WIB) per perangkat; yang dihitung
  -- sesi gratis yang sampai jadi photostrip, sebagai pembuat room maupun tamu.
  -- Memilih sesi premium (p_premium) melewati batas ini: room-nya harus
  -- dibayar dulu sebelum mulai.
  if not is_demo and not coalesce(p_premium, false) and (
    select count(distinct r.id) from public.rooms r
    join public.participants p on p.room_id = r.id and p.user_id = uid
    where r.tier = 'free'
      and r.created_at >= (date_trunc('day', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta')
      and exists (select 1 from public.results s where s.room_id = r.id)
  ) >= 3 then
    raise exception 'daily_limit' using errcode = 'P0001';
  end if;
  for attempt in 1..10 loop
    new_code := private.random_string(6, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789');
    begin
      insert into public.rooms (code, host_id, tier, demo, test, needs_premium)
      values (
        new_code, uid,
        case when is_demo then 'premium'::public.room_tier else 'free'::public.room_tier end,
        is_demo, coalesce(p_test, false), coalesce(p_premium, false) and not is_demo
      )
      returning * into room;
      exit;
    exception when unique_violation then
      if attempt = 10 then raise; end if;
    end;
  end loop;
  insert into public.participants (room_id, user_id, role) values (room.id, uid, 'host');
  return jsonb_build_object('room_id', room.id, 'code', room.code);
end $$;

-- Kirim permintaan akses demo dari perangkat ini.
create function public.request_demo(p_name text, p_contact text default null, p_note text default null, p_meta jsonb default null)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;
  if private.demo_active(uid) then
    return jsonb_build_object('ok', true, 'status', 'approved');
  end if;
  if exists (select 1 from private.demo_requests where user_id = uid and status = 'pending') then
    return jsonb_build_object('ok', true, 'status', 'pending');
  end if;
  -- Anti banjir: 3 permintaan per perangkat, 60 untuk semua per jam.
  if (select count(*) from private.demo_requests where user_id = uid and created_at > now() - interval '24 hours') >= 3
    or (select count(*) from private.demo_requests where created_at > now() - interval '1 hour') >= 60 then
    return jsonb_build_object('ok', false, 'reason', 'limit');
  end if;
  insert into private.demo_requests (user_id, name, contact, note, meta)
  values (
    uid,
    btrim(p_name),
    nullif(btrim(p_contact), ''),
    nullif(btrim(p_note), ''),
    case when jsonb_typeof(p_meta) = 'object' then p_meta end
  );
  return jsonb_build_object('ok', true, 'status', 'pending');
end $$;

-- Status perangkat ini untuk halaman /demo.
create function public.demo_status()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  d private.demo_devices;
  r private.demo_requests;
begin
  if uid is null then
    return jsonb_build_object('status', 'none');
  end if;
  select * into d from private.demo_devices where user_id = uid;
  if found and (d.expires_at is null or d.expires_at > now()) then
    return jsonb_build_object('status', 'approved', 'until', private.epoch_ms(d.expires_at));
  end if;
  select * into r from private.demo_requests where user_id = uid order by created_at desc limit 1;
  if not found then
    return jsonb_build_object('status', 'none');
  end if;
  return jsonb_build_object('status', case when r.status = 'approved' then 'expired' else r.status end, 'at', private.epoch_ms(r.created_at));
end $$;

create function public.admin_demo_requests()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(q order by q.status = 'pending' desc, q.created_at desc), '[]'::jsonb)
  from (
    select
      r.id, r.name, r.contact, r.note, r.meta, r.status,
      private.epoch_ms(r.created_at) as created_at,
      private.epoch_ms(r.decided_at) as decided_at
    from private.demo_requests r
    where r.status = 'pending' or r.decided_at > now() - interval '30 days'
    order by r.created_at desc
    limit 100
  ) q
$$;

-- Setujui (dengan masa berlaku, null = selamanya) atau tolak.
create function public.admin_demo_decide(p_id uuid, p_approve boolean, p_days integer default null)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare
  req private.demo_requests;
begin
  select * into req from private.demo_requests where id = p_id for update;
  if not found or req.status <> 'pending' then
    return;
  end if;
  update private.demo_requests set status = case when p_approve then 'approved' else 'rejected' end, decided_at = now()
  where id = req.id;
  if p_approve then
    insert into private.demo_devices (user_id, label, expires_at)
    values (
      req.user_id,
      left(req.name || coalesce(' · ' || (req.meta ->> 'model'), coalesce(' · ' || (req.meta ->> 'browser'), '')), 80),
      case when p_days is null then null else now() + make_interval(days => p_days) end
    )
    on conflict (user_id) do update set label = excluded.label, expires_at = excluded.expires_at;
  end if;
end $$;

create or replace function public.admin_demo_devices()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(d order by d.created_at desc), '[]'::jsonb)
  from (
    select
      dd.user_id, dd.label,
      private.epoch_ms(dd.created_at) as created_at,
      private.epoch_ms(dd.expires_at) as expires_at,
      (select count(*) from public.rooms r where r.host_id = dd.user_id and r.demo) as rooms,
      (select private.epoch_ms(max(r.created_at)) from public.rooms r where r.host_id = dd.user_id and r.demo) as last_room_at
    from private.demo_devices dd
  ) d
$$;

revoke execute on function public.request_demo(text, text, text, jsonb) from public, anon;
revoke execute on function public.demo_status() from public, anon;
grant execute on function public.request_demo(text, text, text, jsonb) to authenticated;
grant execute on function public.demo_status() to authenticated;
revoke execute on function public.admin_demo_requests() from public, anon, authenticated;
revoke execute on function public.admin_demo_decide(uuid, boolean, integer) from public, anon, authenticated;
grant execute on function public.admin_demo_requests() to service_role;
grant execute on function public.admin_demo_decide(uuid, boolean, integer) to service_role;
