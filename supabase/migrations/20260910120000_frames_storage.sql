-- M4: foto asli per peserta di Storage, versi shot per frame, dan shot yang
-- terlewat (HP sempat putus / tab di belakang) diulang berdua supaya tetap
-- serentak.

alter table public.frames add column shot_v int not null default 0;

-- ── Storage: bucket privat `frames` ──────────────────────────────────────
-- Path: <room_id>/<participant_id>/<idx>-<v>.jpg (versi baru = path baru,
-- jadi tidak pernah menimpa file).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('frames', 'frames', false, 5242880, array['image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "peserta unggah foto sendiri" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'frames'
    and exists (
      select 1
      from public.participants p
      join public.rooms r on r.id = p.room_id
      where p.user_id = (select auth.uid())
        and p.room_id::text = (storage.foldername(name))[1]
        and p.id::text = (storage.foldername(name))[2]
        and r.status in ('capturing', 'review')
    )
  );

create policy "peserta lihat foto room" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'frames'
    and exists (
      select 1 from public.participants p
      where p.user_id = (select auth.uid())
        and p.room_id::text = (storage.foldername(name))[1]
    )
  );

-- ── Snapshot: frame membawa versi shot-nya ───────────────────────────────
create or replace function private.room_state(p_room uuid)
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
      select jsonb_agg(jsonb_build_object(
        'idx', f.idx, 'participant_id', f.participant_id, 'status', f.status, 'path', f.storage_path, 'v', f.shot_v
      ))
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

-- ── Laporan motret: hanya untuk shot versi terkini ──────────────────────
create or replace function public.frame_captured(p_room uuid, p_idx smallint, p_version int, p_captured_at double precision)
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
  if room.status <> 'capturing' or shot is null
     or (shot ->> 'idx')::int <> p_idx or (shot ->> 'v')::int <> p_version then
    return;
  end if;

  insert into public.frames (room_id, idx, participant_id, captured_at_est, shot_v)
  values (p_room, p_idx, me.id, to_timestamp(p_captured_at / 1000), p_version)
  on conflict (room_id, idx, participant_id) do nothing;

  if (select count(*) from public.frames where room_id = p_room and idx = p_idx) < 2 then
    perform private.broadcast(p_room, private.event('captured', me.id, jsonb_build_object('idx', p_idx)));
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

-- ── Foto sudah ada di Storage ────────────────────────────────────────────
create function public.frame_uploaded(p_room uuid, p_idx smallint, p_version int, p_path text)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare
  me public.participants := private.me(p_room);
begin
  if p_path is distinct from p_room::text || '/' || me.id::text || '/' || p_idx::text || '-' || p_version::text || '.jpg' then
    raise exception 'invalid_path' using errcode = 'P0001';
  end if;
  if not exists (select 1 from storage.objects where bucket_id = 'frames' and name = p_path) then
    raise exception 'not_uploaded' using errcode = 'P0001';
  end if;
  update public.frames
  set status = 'uploaded', storage_path = p_path
  where room_id = p_room and idx = p_idx and participant_id = me.id and shot_v = p_version and status <> 'uploaded';
  if found then
    perform private.broadcast(p_room, private.event('uploaded', me.id, jsonb_build_object('idx', p_idx)));
  end if;
end $$;

-- ── Shot terlewat: ulang urutan itu berdua ──────────────────────────────
create function public.resume_shot(p_room uuid, p_version int)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare
  me public.participants := private.me(p_room);
  room public.rooms;
  shot jsonb;
  shot_idx int;
begin
  select * into room from public.rooms where id = p_room for update;
  shot := room.current_shot;
  if room.status <> 'capturing' or shot is null or (shot ->> 'v')::int <> p_version then
    return;
  end if;
  -- Masih dalam toleransi: laporan HP lain mungkin sedang di jalan.
  if private.epoch_ms(clock_timestamp()) < (shot ->> 'capture_at')::double precision + 1000 then
    return;
  end if;
  shot_idx := (shot ->> 'idx')::int;
  delete from public.frames where room_id = p_room and idx = shot_idx;
  update public.rooms
  set current_shot = private.make_shot(shot_idx, p_version + 1, interval '1.2 seconds', shot ->> 'prompt')
  where id = p_room;
  perform private.broadcast(p_room, private.event('resumed', me.id, jsonb_build_object('idx', shot_idx)));
end $$;

-- ── Selesai hanya kalau 8 foto sudah terunggah ───────────────────────────
create or replace function public.finish_session(p_room uuid)
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
  if (select count(*) from public.frames where room_id = p_room and status = 'uploaded') < 8 then
    raise exception 'frames_pending' using errcode = 'P0001';
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

-- ── Hak akses fungsi baru ────────────────────────────────────────────────
revoke execute on function
  public.frame_uploaded(uuid, smallint, int, text),
  public.resume_shot(uuid, int)
from public, anon, authenticated;

grant execute on function
  public.frame_uploaded(uuid, smallint, int, text),
  public.resume_shot(uuid, int)
to authenticated;
