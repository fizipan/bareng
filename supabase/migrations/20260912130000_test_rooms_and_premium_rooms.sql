-- (1) Sesi uji (tes otomatis & pengembangan) ditandai rooms.test: tidak ikut
-- statistik maupun angka di landing, supaya data setelah rilis tetap bersih.
-- (2) Kuota gratis habis → tetap bisa bikin room sebagai sesi premium
-- (rooms.needs_premium): tombol Siap terkunci sampai salah satu membayar.

alter table public.rooms
  add column test boolean not null default false,
  add column needs_premium boolean not null default false;

drop function public.create_room();

create function public.create_room(p_test boolean default false, p_premium boolean default false)
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

revoke execute on function public.create_room(boolean, boolean) from public, anon;
grant execute on function public.create_room(boolean, boolean) to authenticated;

-- Siap terkunci untuk sesi premium yang belum dibayar.
create or replace function public.set_ready(p_room uuid, p_ready boolean)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare
  me public.participants := private.me(p_room);
  room public.rooms;
begin
  select * into room from public.rooms where id = p_room for update;
  if room.status <> 'lobby' then
    return;
  end if;
  if p_ready and room.needs_premium and room.tier <> 'premium' then
    raise exception 'premium_required' using errcode = 'P0001';
  end if;
  update public.participants set ready = p_ready where id = me.id;
  if p_ready and (select count(*) from public.participants where room_id = p_room and ready) = 2 then
    delete from public.frames where room_id = p_room;
    update public.participants set ready = false where room_id = p_room;
    update public.rooms
    set status = 'capturing',
        retake_queue = '{}',
        current_shot = private.make_shot(0, coalesce((room.current_shot ->> 'v')::int, 0) + 1, interval '0.8 seconds', null)
    where id = p_room;
    perform private.broadcast(p_room, private.event('started', me.id));
  else
    perform private.broadcast(p_room, private.event(case when p_ready then 'ready' else 'unready' end, me.id));
  end if;
end $$;

create or replace function private.room_state(p_room uuid)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', r.id,
    'code', r.code,
    'status', r.status,
    'tier', r.tier,
    'needs_premium', r.needs_premium,
    'template_id', r.template_id,
    'filter_id', r.filter_id,
    'current_shot', r.current_shot,
    'retake_queue', to_jsonb(r.retake_queue),
    'expires_at', private.epoch_ms(r.expires_at),
    'participants', coalesce((
      select jsonb_agg(jsonb_build_object('id', p.id, 'role', p.role, 'nickname', p.nickname, 'ready', p.ready) order by p.role)
      from public.participants p where p.room_id = r.id
    ), '[]'::jsonb),
    'frames', coalesce((
      select jsonb_agg(jsonb_build_object(
        'idx', f.idx, 'participant_id', f.participant_id, 'status', f.status, 'path', f.storage_path, 'v', f.shot_v
      ))
      from public.frames f where f.room_id = r.id
    ), '[]'::jsonb),
    'result', (
      select jsonb_build_object(
        'slug', s.slug,
        'created_at', private.epoch_ms(s.created_at),
        'image_path', s.image_path,
        'names', s.names,
        'expires_at', private.epoch_ms(s.expires_at)
      )
      from public.results s where s.room_id = r.id and s.deleted_at is null
      order by s.created_at desc limit 1
    )
  )
  from public.rooms r where r.id = p_room
$$;

-- Statistik: room demo & room uji tidak dicatat.
create or replace function private.log_event(p_name text, p_room uuid, p_participant uuid default null, p_props jsonb default null)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  if exists (select 1 from public.rooms where id = p_room and (demo or test)) then
    return;
  end if;
  insert into public.events (name, room_id, participant_id, props) values (p_name, p_room, p_participant, p_props);
end $$;

create or replace function private.on_room_created() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not (new.demo or new.test) then
    insert into public.events (name, room_id) values ('room_created', new.id);
  end if;
  return new;
end $$;

-- Angka di landing tanpa sesi uji.
create or replace function public.landing_stats()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    -- Orang di room yang masih hidup dan ada aktivitas 5 menit terakhir.
    'people_live', (
      select count(*)
      from public.participants p
      join public.rooms r on r.id = p.room_id
      where r.status in ('waiting', 'lobby', 'capturing', 'review')
        and not r.test
        and r.expires_at > now()
        and r.updated_at > now() - interval '5 minutes'
    ),
    'strips_today', (
      select count(*)
      from public.results s join public.rooms r on r.id = s.room_id
      where not r.test
        and s.created_at >= (date_trunc('day', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta')
    ),
    'strips_total', (select count(*) from public.results s join public.rooms r on r.id = s.room_id where not r.test),
    'last_strip_at', (
      select private.epoch_ms(max(s.created_at)) from public.results s join public.rooms r on r.id = s.room_id where not r.test
    )
  )
$$;
