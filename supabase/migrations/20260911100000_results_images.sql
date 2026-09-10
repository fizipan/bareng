-- M5: photostrip jadi (komposit) di bucket publik `results`, gambar pratinjau
-- link, dan pembersihan otomatis file hasil yang dihapus/kedaluwarsa.

alter table public.results add column purged_at timestamptz;
alter table public.rooms add column purged_at timestamptz;

-- ── Storage: bucket publik `results` ─────────────────────────────────────
-- Path: <room_id>/<slug>/<template>-<filter>-<free|premium>.jpg, plus
-- "-og.jpg" untuk pratinjau link. Slug 10 karakter acak = kunci akses, sama
-- seperti halaman /p/<slug>. Foto mentah tetap di bucket privat `frames`.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('results', 'results', true, 10485760, array['image/jpeg'])
on conflict (id) do nothing;

create policy "peserta unggah photostrip" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'results'
    and exists (
      select 1 from public.participants p
      where p.user_id = (select auth.uid())
        and p.room_id::text = (storage.foldername(name))[1]
    )
  );

-- Nama file untuk pengaturan hasil saat ini (template, filter, gratis/premium).
create function private.result_key(r public.results)
returns text language sql immutable set search_path = '' as $$
  select r.template_id || '-' || r.filter_id || '-' || case when r.watermark then 'free' else 'premium' end
$$;

-- ── Snapshot: hasil membawa path gambar & nama berdua ────────────────────
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

-- ── Gambar hasil sudah terunggah ─────────────────────────────────────────
-- Hanya diterima kalau cocok dengan pengaturan hasil saat ini (bukan render
-- lama sebelum ganti template / upgrade).
create function public.set_result_image(p_slug text, p_path text)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare
  res public.results;
  me public.participants;
begin
  select * into res from public.results where slug = p_slug and deleted_at is null for update;
  if not found then
    raise exception 'result_not_found' using errcode = 'P0001';
  end if;
  me := private.me(res.room_id);
  if p_path is distinct from res.room_id::text || '/' || res.slug || '/' || private.result_key(res) || '.jpg' then
    raise exception 'stale_render' using errcode = 'P0001';
  end if;
  if not exists (select 1 from storage.objects where bucket_id = 'results' and name = p_path) then
    raise exception 'not_uploaded' using errcode = 'P0001';
  end if;
  if res.image_path is distinct from p_path then
    update public.results set image_path = p_path where id = res.id;
    perform private.broadcast(res.room_id, private.event('result_image', me.id));
  end if;
end $$;

-- ── Ganti template di layar hasil ikut mengubah hasilnya ─────────────────
create or replace function public.set_template(p_room uuid, p_template text)
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
  if room.status = 'done' then
    update public.results set template_id = t.id where room_id = p_room and deleted_at is null;
  end if;
  perform private.broadcast(p_room, private.event('template', me.id, jsonb_build_object('template_id', t.id)));
end $$;

-- ── Halaman publik ───────────────────────────────────────────────────────
create or replace function public.get_public_result(p_slug text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'slug', s.slug,
    'template_id', s.template_id,
    'filter_id', s.filter_id,
    'names', s.names,
    'watermark', s.watermark,
    'image_path', s.image_path,
    'created_at', private.epoch_ms(s.created_at)
  )
  from public.results s
  where s.slug = p_slug and s.deleted_at is null and (s.expires_at is null or s.expires_at > now())
$$;

-- ── Room yang sudah selesai tidak kedaluwarsa ────────────────────────────
-- Sebelumnya layar hasil berubah jadi "kedaluwarsa" 60 menit setelah join.
-- Umur hasil diatur results.expires_at (7 hari gratis, premium selamanya).
create or replace function private.expire_rooms()
returns void language plpgsql volatile security definer set search_path = '' as $$
declare
  r record;
begin
  for r in
    update public.rooms set status = 'expired'
    where status not in ('expired', 'done') and expires_at < now()
    returning id
  loop
    perform private.broadcast(r.id, private.event('expired', null));
  end loop;
end $$;

-- ── Pembersihan (Edge Function `cleanup`, service role) ─────────────────
-- Token untuk panggilan terjadwal dari pg_cron; tidak pernah keluar dari DB.
create table private.secrets (name text primary key, value text not null);
insert into private.secrets (name, value)
values ('cleanup_token', encode(extensions.gen_random_bytes(24), 'hex'));

create function public.cleanup_token_ok(p_token text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from private.secrets where name = 'cleanup_token' and value = p_token)
$$;

-- File yang boleh dibuang: hasil yang dihapus/kedaluwarsa, lalu foto mentah
-- room yang semua hasilnya sudah mati atau room kedaluwarsa tanpa hasil.
create function public.cleanup_targets(p_slug text default null)
returns table (kind text, id uuid, bucket text, name text)
language sql stable security definer set search_path = '' as $$
  with dead_results as (
    select s.id, s.room_id, s.slug
    from public.results s
    where s.purged_at is null
      and (s.deleted_at is not null or (s.expires_at is not null and s.expires_at < now()))
      and (p_slug is null or s.slug = p_slug)
    limit 200
  ),
  dead_rooms as (
    select r.id
    from public.rooms r
    where r.purged_at is null
      and (p_slug is null or r.id in (select room_id from dead_results))
      and not exists (
        select 1 from public.results s
        where s.room_id = r.id and s.deleted_at is null and (s.expires_at is null or s.expires_at > now())
      )
      and (
        r.id in (select room_id from dead_results)
        or (r.status = 'expired' and r.updated_at < now() - interval '1 hour')
      )
    limit 200
  )
  select 'result', d.id, 'results', o.name
  from dead_results d
  left join storage.objects o on o.bucket_id = 'results' and o.name like d.room_id::text || '/' || d.slug || '/%'
  union all
  select 'room', r.id, 'frames', o.name
  from dead_rooms r
  left join storage.objects o on o.bucket_id = 'frames' and o.name like r.id::text || '/%'
$$;

create function public.cleanup_mark(p_results uuid[], p_rooms uuid[])
returns void language sql volatile security definer set search_path = '' as $$
  update public.results set purged_at = now(), image_path = null where id = any (p_results);
  update public.rooms set purged_at = now() where id = any (p_rooms);
$$;

-- ── Hak akses ────────────────────────────────────────────────────────────
revoke execute on function
  public.set_result_image(text, text),
  public.cleanup_token_ok(text),
  public.cleanup_targets(text),
  public.cleanup_mark(uuid[], uuid[])
from public, anon, authenticated;

grant execute on function public.set_result_image(text, text) to authenticated;
grant execute on function
  public.cleanup_token_ok(text),
  public.cleanup_targets(text),
  public.cleanup_mark(uuid[], uuid[])
to service_role;

-- ── Jadwal: tiap jam panggil Edge Function `cleanup` ─────────────────────
create extension if not exists pg_net;

select cron.schedule(
  'bareng-cleanup',
  '17 * * * *',
  $$
  select net.http_post(
    url := 'https://huvinsfddhgfqepazinc.supabase.co/functions/v1/cleanup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cleanup-token', (select value from private.secrets where name = 'cleanup_token')
    ),
    body := '{}'::jsonb
  )
  $$
);
