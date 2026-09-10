-- Bareng: skema inti room, peserta, frame, hasil (M2).
-- Semua perubahan state lewat fungsi RPC security definer; tabel tidak bisa
-- ditulis langsung oleh client. Setiap perubahan dibroadcast ke channel
-- private `room:<id>` berisi snapshot state lengkap.

create extension if not exists pg_cron with schema pg_catalog;

create schema if not exists private;
revoke all on schema private from public;

-- ── Tipe & tabel ──────────────────────────────────────────────────────────
create type public.room_status as enum ('waiting', 'lobby', 'capturing', 'review', 'done', 'expired');
create type public.room_tier as enum ('free', 'premium');
create type public.participant_role as enum ('host', 'guest');

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null check (code ~ '^[A-Z0-9]{6}$'),
  host_id uuid not null references auth.users (id) on delete cascade,
  status public.room_status not null default 'waiting',
  tier public.room_tier not null default 'free',
  template_id text not null default 'film',
  filter_id text not null default 'none',
  current_shot jsonb,
  retake_queue smallint[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '15 minutes'
);
create unique index rooms_code_active_key on public.rooms (code) where status <> 'expired';
create index rooms_host_created_idx on public.rooms (host_id, created_at desc);
create index rooms_expiry_idx on public.rooms (expires_at) where status <> 'expired';

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.participant_role not null,
  nickname text check (char_length(nickname) between 1 and 24),
  ready boolean not null default false,
  joined_at timestamptz not null default now(),
  unique (room_id, user_id),
  -- Satu host + satu tamu = maksimal dua orang per room.
  unique (room_id, role)
);
create index participants_user_idx on public.participants (user_id);

create table public.frames (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  idx smallint not null check (idx between 0 and 3),
  participant_id uuid not null references public.participants (id) on delete cascade,
  status text not null default 'captured' check (status in ('captured', 'uploaded')),
  storage_path text,
  captured_at_est timestamptz,
  created_at timestamptz not null default now(),
  unique (room_id, idx, participant_id)
);

create table public.results (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  room_id uuid not null references public.rooms (id) on delete cascade,
  template_id text not null,
  filter_id text not null,
  names text,
  image_path text,
  watermark boolean not null default true,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  deleted_at timestamptz
);
create index results_room_idx on public.results (room_id, created_at desc);

create table public.templates (
  id text primary key,
  name text not null,
  tier public.room_tier not null,
  sort smallint not null,
  definition jsonb,
  active boolean not null default true
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  result_id uuid not null references public.results (id) on delete cascade,
  reason text check (char_length(reason) <= 500),
  created_at timestamptz not null default now()
);

-- ── RLS: default tertutup ────────────────────────────────────────────────
alter table public.rooms enable row level security;
alter table public.participants enable row level security;
alter table public.frames enable row level security;
alter table public.results enable row level security;
alter table public.templates enable row level security;
alter table public.reports enable row level security;

-- Peserta hanya bisa melihat baris dirinya sendiri (dipakai policy realtime).
create policy "peserta lihat baris sendiri" on public.participants
  for select to authenticated using (user_id = (select auth.uid()));

create policy "template aktif publik" on public.templates
  for select to anon, authenticated using (active);

-- ── Realtime: channel private room:<id> hanya untuk peserta room itu ─────
create policy "peserta terima pesan room" on realtime.messages
  for select to authenticated
  using (
    realtime.messages.extension in ('broadcast', 'presence')
    and exists (
      select 1 from public.participants p
      where p.user_id = (select auth.uid())
        and 'room:' || p.room_id::text = (select realtime.topic())
    )
  );

create policy "peserta kirim pesan room" on realtime.messages
  for insert to authenticated
  with check (
    realtime.messages.extension in ('broadcast', 'presence')
    and exists (
      select 1 from public.participants p
      where p.user_id = (select auth.uid())
        and 'room:' || p.room_id::text = (select realtime.topic())
    )
  );

-- ── Helper privat (tidak terekspos lewat API) ────────────────────────────
create function private.random_string(n int, alphabet text)
returns text language plpgsql volatile set search_path = '' as $$
declare
  bytes bytea := extensions.gen_random_bytes(n);
  out text := '';
begin
  for i in 0..n - 1 loop
    out := out || substr(alphabet, (get_byte(bytes, i) % length(alphabet)) + 1, 1);
  end loop;
  return out;
end $$;

create function private.epoch_ms(ts timestamptz)
returns double precision language sql immutable set search_path = '' as $$
  select extract(epoch from ts) * 1000
$$;

-- Jadwal satu foto: prompt → hitung mundur 3 dtk → capture. Waktu dari jam
-- server; client menjadwalkan UI dengan koreksi selisih jamnya sendiri.
create function private.make_shot(p_idx int, p_version int, p_delay interval, p_prev_prompt text)
returns jsonb language plpgsql volatile set search_path = '' as $$
declare
  prompts text[] := array[
    'Hadap kiri', 'Peace ✌️', 'Pura-pura kaget', 'Pegang muka', 'Tutup satu mata', 'Tunjuk dia',
    'Ketawa lebar', 'Muka datar', 'Tangan di dagu', 'Lompat kecil', 'Hadap kanan', 'Bikin hati pakai tangan 🫶',
    'Gaya foto KTP', 'Senyum tanpa gigi', 'Lihat ke atas', 'Pura-pura bisik', 'Jempol dua 👍', 'Muka ngambek',
    'Tahan tawa', 'Kedip ke kamera', 'Pose model majalah', 'Pura-pura nangis', 'Tangan di pipi', 'Gaya superhero',
    'Pegang kepala', 'Julurkan lidah', 'Lihat ke samping', 'Tepuk tangan', 'Gaya salaman', 'Pose bebas'
  ];
  t0 timestamptz := clock_timestamp() + p_delay;
  pick text;
begin
  loop
    pick := prompts[1 + floor(random() * array_length(prompts, 1))::int];
    exit when pick is distinct from p_prev_prompt;
  end loop;
  return jsonb_build_object(
    'idx', p_idx,
    'v', p_version,
    'prompt', pick,
    'prompt_at', private.epoch_ms(t0),
    'countdown_at', private.epoch_ms(t0 + interval '1.6 seconds'),
    'capture_at', private.epoch_ms(t0 + interval '4.6 seconds')
  );
end $$;

-- Snapshot state yang dikirim ke client (tanpa user_id peserta).
create function private.room_state(p_room uuid)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', r.id,
    'code', r.code,
    'status', r.status,
    'tier', r.tier,
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
      select jsonb_agg(jsonb_build_object('idx', f.idx, 'participant_id', f.participant_id, 'status', f.status, 'path', f.storage_path))
      from public.frames f where f.room_id = r.id
    ), '[]'::jsonb),
    'result', (
      select jsonb_build_object('slug', s.slug, 'created_at', private.epoch_ms(s.created_at))
      from public.results s where s.room_id = r.id and s.deleted_at is null
      order by s.created_at desc limit 1
    )
  )
  from public.rooms r where r.id = p_room
$$;

create function private.broadcast(p_room uuid, p_event jsonb)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  update public.rooms set updated_at = now() where id = p_room;
  perform realtime.send(
    jsonb_build_object('state', private.room_state(p_room), 'event', p_event),
    'room_state',
    'room:' || p_room::text,
    true
  );
end $$;

-- Peserta pemanggil untuk room tertentu; gagal kalau bukan anggota.
create function private.me(p_room uuid)
returns public.participants language plpgsql stable set search_path = '' as $$
declare
  p public.participants;
begin
  select * into p from public.participants where room_id = p_room and user_id = auth.uid();
  if not found then
    raise exception 'not_participant' using errcode = 'P0001';
  end if;
  return p;
end $$;

create function private.event(p_type text, p_by uuid, p_extra jsonb default '{}'::jsonb)
returns jsonb language sql immutable set search_path = '' as $$
  select jsonb_build_object('type', p_type, 'by', p_by) || p_extra
$$;

-- ── RPC publik ───────────────────────────────────────────────────────────
-- Jam server untuk sinkron hitung mundur (dipanggil tanpa login juga).
create function public.server_now()
returns double precision language sql volatile set search_path = '' as $$
  select extract(epoch from clock_timestamp()) * 1000
$$;

create function public.create_room()
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
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
  for attempt in 1..10 loop
    new_code := private.random_string(6, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789');
    begin
      insert into public.rooms (code, host_id) values (new_code, uid) returning * into room;
      exit;
    exception when unique_violation then
      if attempt = 10 then raise; end if;
    end;
  end loop;
  insert into public.participants (room_id, user_id, role) values (room.id, uid, 'host');
  return jsonb_build_object('room_id', room.id, 'code', room.code);
end $$;

create function public.join_room(p_code text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  room public.rooms;
  p public.participants;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;
  select * into room from public.rooms
  where code = upper(trim(p_code)) and status <> 'expired'
  for update;
  if not found then
    if exists (select 1 from public.rooms where code = upper(trim(p_code))) then
      raise exception 'room_expired' using errcode = 'P0001';
    end if;
    raise exception 'room_not_found' using errcode = 'P0001';
  end if;
  if room.expires_at < now() then
    update public.rooms set status = 'expired' where id = room.id;
    perform private.broadcast(room.id, private.event('expired', null));
    raise exception 'room_expired' using errcode = 'P0001';
  end if;

  select * into p from public.participants where room_id = room.id and user_id = uid;
  if found then
    return jsonb_build_object('room_id', room.id, 'participant_id', p.id, 'role', p.role);
  end if;

  if exists (select 1 from public.participants where room_id = room.id and role = 'guest') then
    raise exception 'room_full' using errcode = 'P0001';
  end if;

  insert into public.participants (room_id, user_id, role) values (room.id, uid, 'guest') returning * into p;
  update public.rooms
  set status = case when status = 'waiting' then 'lobby'::public.room_status else status end,
      expires_at = greatest(expires_at, now() + interval '60 minutes')
  where id = room.id;
  perform private.broadcast(room.id, private.event('joined', p.id));
  return jsonb_build_object('room_id', room.id, 'participant_id', p.id, 'role', p.role);
end $$;

create function public.get_room(p_room uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.me(p_room);
  return private.room_state(p_room);
end $$;

create function public.set_nickname(p_room uuid, p_nickname text)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare
  me public.participants := private.me(p_room);
  clean text := nullif(left(trim(p_nickname), 24), '');
begin
  update public.participants set nickname = clean where id = me.id;
  perform private.broadcast(p_room, private.event('nickname', me.id));
end $$;

create function public.set_template(p_room uuid, p_template text)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare
  me public.participants := private.me(p_room);
  room public.rooms;
  t public.templates;
begin
  select * into room from public.rooms where id = p_room for update;
  select * into t from public.templates where id = p_template and active;
  if not found then
    raise exception 'template_not_found' using errcode = 'P0001';
  end if;
  if t.tier = 'premium' and room.tier <> 'premium' then
    raise exception 'premium_required' using errcode = 'P0001';
  end if;
  if room.template_id = t.id then
    return;
  end if;
  update public.rooms set template_id = t.id where id = p_room;
  perform private.broadcast(p_room, private.event('template', me.id, jsonb_build_object('template_id', t.id)));
end $$;

create function public.set_filter(p_room uuid, p_filter text)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare
  me public.participants := private.me(p_room);
begin
  if p_filter not in ('none', 'grain', 'bw', 'vhs') then
    raise exception 'filter_not_found' using errcode = 'P0001';
  end if;
  update public.rooms set filter_id = p_filter where id = p_room and filter_id <> p_filter;
  if found then
    perform private.broadcast(p_room, private.event('filter', me.id, jsonb_build_object('filter_id', p_filter)));
  end if;
end $$;

-- Dua-duanya siap → server memulai sesi dan menjadwalkan foto pertama.
create function public.set_ready(p_room uuid, p_ready boolean)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare
  me public.participants := private.me(p_room);
  room public.rooms;
begin
  select * into room from public.rooms where id = p_room for update;
  if room.status <> 'lobby' then
    return;
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

-- Lewati prompt: hitung mundur dimulai 0,5 dtk lagi (cukup untuk broadcast sampai).
create function public.skip_prompt(p_room uuid, p_version int)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare
  me public.participants := private.me(p_room);
  room public.rooms;
  shot jsonb;
  cd timestamptz;
begin
  select * into room from public.rooms where id = p_room for update;
  shot := room.current_shot;
  if room.status <> 'capturing' or shot is null or (shot ->> 'v')::int <> p_version then
    return;
  end if;
  if private.epoch_ms(clock_timestamp()) >= (shot ->> 'countdown_at')::double precision then
    return;
  end if;
  cd := clock_timestamp() + interval '0.5 seconds';
  update public.rooms
  set current_shot = shot || jsonb_build_object(
    'v', p_version + 1,
    'countdown_at', private.epoch_ms(cd),
    'capture_at', private.epoch_ms(cd + interval '3 seconds')
  )
  where id = p_room;
  perform private.broadcast(p_room, private.event('skip', me.id));
end $$;

-- Laporan "sudah motret" dari tiap HP. Kalau keduanya sudah, jadwalkan foto
-- berikutnya (atau antrean ulang), atau pindah ke review.
create function public.frame_captured(p_room uuid, p_idx smallint, p_version int, p_captured_at double precision)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare
  me public.participants := private.me(p_room);
  room public.rooms;
  shot jsonb;
  queue smallint[];
  next_idx int;
begin
  select * into room from public.rooms where id = p_room for update;
  shot := room.current_shot;
  if room.status <> 'capturing' or shot is null or (shot ->> 'idx')::int <> p_idx then
    return;
  end if;

  insert into public.frames (room_id, idx, participant_id, captured_at_est)
  values (p_room, p_idx, me.id, to_timestamp(p_captured_at / 1000))
  on conflict (room_id, idx, participant_id) do nothing;

  if (select count(*) from public.frames where room_id = p_room and idx = p_idx) < 2 then
    return;
  end if;

  queue := array_remove(room.retake_queue, p_idx);
  if cardinality(room.retake_queue) > 0 then
    next_idx := case when cardinality(queue) > 0 then queue[1] else null end;
  elsif p_idx < 3 then
    next_idx := p_idx + 1;
  else
    next_idx := null;
  end if;

  if next_idx is null then
    update public.rooms set status = 'review', current_shot = null, retake_queue = '{}' where id = p_room;
    perform private.broadcast(p_room, private.event('review', me.id));
  else
    update public.rooms
    set retake_queue = queue,
        current_shot = private.make_shot(next_idx, (shot ->> 'v')::int + 1, interval '0.9 seconds', shot ->> 'prompt')
    where id = p_room;
    perform private.broadcast(p_room, private.event('captured', me.id, jsonb_build_object('idx', p_idx)));
  end if;
end $$;

create function public.request_retake(p_room uuid, p_indices smallint[])
returns void language plpgsql volatile security definer set search_path = '' as $$
declare
  me public.participants := private.me(p_room);
  room public.rooms;
  queue smallint[];
begin
  select * into room from public.rooms where id = p_room for update;
  if room.status <> 'review' then
    return;
  end if;
  select array_agg(distinct i order by i) into queue from unnest(p_indices) as i where i between 0 and 3;
  if queue is null then
    raise exception 'invalid_indices' using errcode = 'P0001';
  end if;
  delete from public.frames where room_id = p_room and idx = any (queue);
  update public.rooms
  set status = 'capturing',
      retake_queue = queue,
      current_shot = private.make_shot(queue[1], coalesce((room.current_shot ->> 'v')::int, 0) + 1, interval '0.8 seconds', null)
  where id = p_room;
  perform private.broadcast(p_room, private.event('retake', me.id, jsonb_build_object('indices', to_jsonb(queue))));
end $$;

create function public.finish_session(p_room uuid)
returns text language plpgsql volatile security definer set search_path = '' as $$
declare
  me public.participants := private.me(p_room);
  room public.rooms;
  new_slug text;
  host_name text;
  guest_name text;
begin
  select * into room from public.rooms where id = p_room for update;
  if room.status = 'done' then
    select slug into new_slug from public.results
    where room_id = p_room and deleted_at is null order by created_at desc limit 1;
    return new_slug;
  end if;
  if room.status <> 'review' then
    raise exception 'not_ready' using errcode = 'P0001';
  end if;
  select nickname into host_name from public.participants where room_id = p_room and role = 'host';
  select nickname into guest_name from public.participants where room_id = p_room and role = 'guest';
  new_slug := private.random_string(10, '23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ');
  insert into public.results (slug, room_id, template_id, filter_id, names, watermark, expires_at)
  values (
    new_slug, p_room, room.template_id, room.filter_id,
    case when host_name is not null and guest_name is not null then host_name || ' & ' || guest_name end,
    room.tier = 'free',
    case when room.tier = 'free' then now() + interval '7 days' end
  );
  update public.rooms set status = 'done' where id = p_room;
  perform private.broadcast(p_room, private.event('done', me.id, jsonb_build_object('slug', new_slug)));
  return new_slug;
end $$;

create function public.leave_room(p_room uuid)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare
  me public.participants := private.me(p_room);
  room public.rooms;
begin
  select * into room from public.rooms where id = p_room for update;
  if me.role = 'host' then
    update public.rooms set status = 'expired' where id = p_room;
    perform private.broadcast(p_room, private.event('left', me.id));
  elsif room.status = 'lobby' then
    delete from public.participants where id = me.id;
    update public.participants set ready = false where room_id = p_room;
    update public.rooms set status = 'waiting' where id = p_room;
    perform private.broadcast(p_room, private.event('left', me.id));
  end if;
end $$;

-- SEMENTARA (M6 menggantinya dengan pembayaran + webhook): upgrade room tanpa bayar.
create function public.mock_upgrade(p_room uuid)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare
  me public.participants := private.me(p_room);
begin
  update public.rooms set tier = 'premium' where id = p_room and tier <> 'premium';
  update public.results set watermark = false, expires_at = null where room_id = p_room;
  perform private.broadcast(p_room, private.event('upgraded', me.id));
end $$;

create function public.get_public_result(p_slug text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'slug', s.slug,
    'template_id', s.template_id,
    'filter_id', s.filter_id,
    'names', s.names,
    'watermark', s.watermark,
    'created_at', private.epoch_ms(s.created_at)
  )
  from public.results s
  where s.slug = p_slug and s.deleted_at is null and (s.expires_at is null or s.expires_at > now())
$$;

create function public.delete_result(p_slug text)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare
  res public.results;
  me public.participants;
begin
  select * into res from public.results where slug = p_slug and deleted_at is null;
  if not found then
    return;
  end if;
  me := private.me(res.room_id);
  update public.results set deleted_at = now() where id = res.id;
  perform private.broadcast(res.room_id, private.event('deleted', me.id));
end $$;

create function public.report_result(p_slug text, p_reason text default null)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare
  res_id uuid;
begin
  select id into res_id from public.results where slug = p_slug;
  if res_id is not null then
    insert into public.reports (result_id, reason) values (res_id, left(p_reason, 500));
  end if;
end $$;

-- ── Kedaluwarsa otomatis (idle 15 mnt, aktif 60 mnt) ────────────────────
create function private.expire_rooms()
returns void language plpgsql volatile security definer set search_path = '' as $$
declare
  r record;
begin
  for r in
    update public.rooms set status = 'expired'
    where status <> 'expired' and expires_at < now()
    returning id
  loop
    perform private.broadcast(r.id, private.event('expired', null));
  end loop;
end $$;

select cron.schedule('bareng-expire-rooms', '* * * * *', $$select private.expire_rooms()$$);

-- ── Hak akses fungsi ─────────────────────────────────────────────────────
revoke execute on all functions in schema public from public, anon, authenticated;
revoke execute on all functions in schema private from public, anon, authenticated;

grant execute on function
  public.create_room(),
  public.join_room(text),
  public.get_room(uuid),
  public.set_nickname(uuid, text),
  public.set_template(uuid, text),
  public.set_filter(uuid, text),
  public.set_ready(uuid, boolean),
  public.skip_prompt(uuid, int),
  public.frame_captured(uuid, smallint, int, double precision),
  public.request_retake(uuid, smallint[]),
  public.finish_session(uuid),
  public.leave_room(uuid),
  public.mock_upgrade(uuid),
  public.delete_result(text)
to authenticated;

grant execute on function
  public.server_now(),
  public.get_public_result(text),
  public.report_result(text, text)
to anon, authenticated;

-- ── Seed template (definisi JSON lengkap ada di kode; di sini daftar & tier) ─
insert into public.templates (id, name, tier, sort) values
  ('film', 'Film klasik', 'free', 1),
  ('polaroid', 'Polaroid ganda', 'free', 2),
  ('kotak', 'Grid kotak', 'free', 3),
  ('y2k', 'Y2K neon', 'premium', 4),
  ('kodak', 'Kodak 400', 'premium', 5),
  ('valentine', 'Valentine', 'premium', 6);
