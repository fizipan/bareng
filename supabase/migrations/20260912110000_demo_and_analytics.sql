-- (1) Perangkat demo: sesi anonim milik tim Bareng yang didaftarkan dari
-- /admin. Room buatannya langsung premium, tanpa batas sesi gratis harian,
-- dan tidak ikut statistik.
-- (2) Analytics sendiri (M7): catatan teknis di tabel `events`, tanpa pihak
-- ketiga dan tanpa data pribadi (tanpa user id, IP, atau user agent). Kejadian
-- server dicatat trigger; kejadian di HP lewat RPC `track` (hanya peserta).

-- ── Perangkat demo ───────────────────────────────────────────────────────
create table private.demo_devices (
  user_id uuid primary key references auth.users (id) on delete cascade,
  label text check (label is null or char_length(label) <= 80),
  created_at timestamptz not null default now()
);

alter table public.rooms add column demo boolean not null default false;

create or replace function public.create_room()
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
  is_demo := exists (select 1 from private.demo_devices where user_id = uid);
  -- Batas gratis (PRD): 3 sesi per hari (WIB) per perangkat; yang dihitung
  -- sesi gratis yang sampai jadi photostrip, sebagai pembuat room maupun tamu.
  if not is_demo and (
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
      insert into public.rooms (code, host_id, tier, demo)
      values (new_code, uid, case when is_demo then 'premium'::public.room_tier else 'free'::public.room_tier end, is_demo)
      returning * into room;
      exit;
    exception when unique_violation then
      if attempt = 10 then raise; end if;
    end;
  end loop;
  insert into public.participants (room_id, user_id, role) values (room.id, uid, 'host');
  return jsonb_build_object('room_id', room.id, 'code', room.code);
end $$;

create function public.admin_demo_devices()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(d order by d.created_at desc), '[]'::jsonb)
  from (
    select
      dd.user_id, dd.label, private.epoch_ms(dd.created_at) as created_at,
      (select count(*) from public.rooms r where r.host_id = dd.user_id and r.demo) as rooms,
      (select private.epoch_ms(max(r.created_at)) from public.rooms r where r.host_id = dd.user_id and r.demo) as last_room_at
    from private.demo_devices dd
  ) d
$$;

create function public.admin_demo_set(p_user uuid, p_label text, p_on boolean)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  if p_on then
    insert into private.demo_devices (user_id, label) values (p_user, nullif(left(btrim(p_label), 80), ''))
    on conflict (user_id) do update set label = excluded.label;
  else
    delete from private.demo_devices where user_id = p_user;
  end if;
end $$;

-- ── Analytics ────────────────────────────────────────────────────────────
-- room_id/participant_id sengaja tanpa foreign key: catatan tetap ada setelah
-- room dibersihkan, supaya statistik jangka panjang tidak ikut hilang.
create table public.events (
  id bigint generated always as identity primary key,
  name text not null check (name ~ '^[a-z_]{2,40}$'),
  room_id uuid,
  participant_id uuid,
  props jsonb check (props is null or pg_column_size(props) <= 1024),
  created_at timestamptz not null default now()
);
create index events_name_created_idx on public.events (name, created_at desc);
create index events_room_idx on public.events (room_id);
create index events_participant_created_idx on public.events (participant_id, created_at desc);
alter table public.events enable row level security;

create function private.log_event(p_name text, p_room uuid, p_participant uuid default null, p_props jsonb default null)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  if exists (select 1 from public.rooms where id = p_room and demo) then
    return;
  end if;
  insert into public.events (name, room_id, participant_id, props) values (p_name, p_room, p_participant, p_props);
end $$;

create function private.on_room_created() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not new.demo then
    insert into public.events (name, room_id) values ('room_created', new.id);
  end if;
  return new;
end $$;
create trigger rooms_track_created after insert on public.rooms
  for each row execute function private.on_room_created();

create function private.on_guest_joined() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.role = 'guest' then
    perform private.log_event('guest_joined', new.room_id, new.id);
  end if;
  return new;
end $$;
create trigger participants_track_guest after insert on public.participants
  for each row execute function private.on_guest_joined();

-- Photostrip jadi: sekalian catat selisih waktu jepret dua HP per frame (ms),
-- ukuran utama R3 (target < 150 ms).
create function private.on_result_created() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  drift jsonb;
begin
  select coalesce(jsonb_agg(round(abs(extract(epoch from (a.captured_at_est - b.captured_at_est)) * 1000)) order by a.idx), '[]'::jsonb)
  into drift
  from public.frames a
  join public.frames b on b.room_id = a.room_id and b.idx = a.idx and a.participant_id < b.participant_id
  where a.room_id = new.room_id and a.captured_at_est is not null and b.captured_at_est is not null;
  perform private.log_event('capture_done', new.room_id, null, jsonb_build_object('drift', drift));
  return new;
end $$;
create trigger results_track_created after insert on public.results
  for each row execute function private.on_result_created();

create function private.on_payment_paid() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform private.log_event('payment_success', new.room_id, new.participant_id, jsonb_build_object('amount', new.amount, 'provider', new.provider));
  return new;
end $$;
create trigger payments_track_paid after update of status on public.payments
  for each row when (new.status = 'paid' and old.status is distinct from 'paid')
  execute function private.on_payment_paid();

-- Kejadian di HP (kamera, video, unduh, bagikan, paywall, ulang foto). Diam
-- kalau bukan peserta, nama tidak dikenal, room demo, atau terlalu sering.
create function public.track(p_room uuid, p_name text, p_props jsonb default null)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare
  me public.participants;
begin
  if p_name not in ('camera_granted', 'camera_denied', 'rtc_connected', 'rtc_failed', 'result_viewed', 'download', 'share', 'paywall_viewed', 'retake') then
    return;
  end if;
  select * into me from public.participants where room_id = p_room and user_id = auth.uid();
  if not found then
    return;
  end if;
  if (select count(*) from public.events where participant_id = me.id and created_at > now() - interval '10 minutes') >= 60 then
    return;
  end if;
  perform private.log_event(
    p_name, p_room, me.id,
    case when jsonb_typeof(p_props) = 'object' and pg_column_size(p_props) <= 512 then p_props end
  );
end $$;

-- Ringkasan untuk tab Statistik di /admin: funnel room yang dibuat dalam
-- rentang ini, kualitas video, selisih jepret, pembayaran, dan sesi per hari.
create function public.admin_stats(p_days integer default 7)
returns jsonb language sql stable security definer set search_path = '' as $$
  with win as (
    select now() - make_interval(days => greatest(1, least(coalesce(p_days, 7), 90))) as since
  ),
  cohort as (
    select e.room_id, e.created_at from public.events e, win
    where e.name = 'room_created' and e.created_at >= win.since
  ),
  ev as (
    select e.* from public.events e where e.room_id in (select room_id from cohort)
  ),
  drift as (
    select d::numeric as ms
    from public.events e, win, jsonb_array_elements_text(e.props -> 'drift') d
    where e.name = 'capture_done' and e.created_at >= win.since
  ),
  rtc as (
    select (e.props ->> 'ms')::numeric as ms, (e.props ->> 'relay')::boolean as relay
    from public.events e, win
    where e.name = 'rtc_connected' and e.created_at >= win.since and e.props ? 'ms'
  ),
  paid as (
    select (e.props ->> 'amount')::numeric as amount
    from public.events e, win where e.name = 'payment_success' and e.created_at >= win.since
  ),
  days as (
    select generate_series(
      date_trunc('day', (select since from win) at time zone 'Asia/Jakarta') + interval '1 day',
      date_trunc('day', now() at time zone 'Asia/Jakarta'),
      interval '1 day'
    ) as day
  )
  select jsonb_build_object(
    'days', greatest(1, least(coalesce(p_days, 7), 90)),
    'funnel', jsonb_build_object(
      'rooms', (select count(*) from cohort),
      'guest', (select count(distinct room_id) from ev where name = 'guest_joined'),
      'camera', (select count(*) from (select room_id from ev where name = 'camera_granted' group by room_id having count(distinct participant_id) >= 2) x),
      'connected', (select count(distinct room_id) from ev where name = 'rtc_connected'),
      'captured', (select count(distinct room_id) from ev where name = 'capture_done'),
      'saved', (select count(distinct room_id) from ev where name in ('download', 'share')),
      'paywall', (select count(distinct room_id) from ev where name = 'paywall_viewed'),
      'paid', (select count(distinct room_id) from ev where name = 'payment_success')
    ),
    'drift', jsonb_build_object(
      'n', (select count(*) from drift),
      'p50', (select round(percentile_cont(0.5) within group (order by ms)) from drift),
      'p95', (select round(percentile_cont(0.95) within group (order by ms)) from drift),
      'under150', (select round(100.0 * count(*) filter (where ms < 150) / nullif(count(*), 0)) from drift)
    ),
    'rtc', jsonb_build_object(
      'connected', (select count(*) from rtc),
      'failed', (select count(*) from public.events e, win where e.name = 'rtc_failed' and e.created_at >= win.since),
      'p50_ms', (select round(percentile_cont(0.5) within group (order by ms)) from rtc),
      'relay_pct', (select round(100.0 * count(*) filter (where relay) / nullif(count(*), 0)) from rtc)
    ),
    'payments', jsonb_build_object(
      'count', (select count(*) from paid),
      'total', (select coalesce(sum(amount), 0) from paid)
    ),
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'day', to_char(d.day, 'YYYY-MM-DD'),
        'rooms', (select count(*) from cohort c where date_trunc('day', c.created_at at time zone 'Asia/Jakarta') = d.day),
        'captured', (select count(*) from public.events e where e.name = 'capture_done' and date_trunc('day', e.created_at at time zone 'Asia/Jakarta') = d.day)
      ) order by d.day), '[]'::jsonb)
      from days d
    )
  )
$$;

revoke execute on function public.track(uuid, text, jsonb) from public, anon;
grant execute on function public.track(uuid, text, jsonb) to authenticated;
revoke execute on function public.admin_stats(integer) from public, anon, authenticated;
revoke execute on function public.admin_demo_devices() from public, anon, authenticated;
revoke execute on function public.admin_demo_set(uuid, text, boolean) from public, anon, authenticated;
grant execute on function public.admin_stats(integer) to service_role;
grant execute on function public.admin_demo_devices() to service_role;
grant execute on function public.admin_demo_set(uuid, text, boolean) to service_role;
