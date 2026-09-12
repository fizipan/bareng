-- Celah jendela penyamaran (incognito): sesi anonim baru = kuota gratis baru.
-- Pengaman biaya: batasi juga sesi gratis yang sampai jadi photostrip per
-- jaringan per hari. Yang disimpan hanya kode acak harian (HMAC alamat +
-- rahasia + tanggal), bukan alamat internetnya, dan kodenya berganti tiap
-- hari sehingga tidak bisa dipakai melacak orang antar hari.
-- Definisi create_room di sini adalah versi terkini (batas harian per
-- perangkat + per jaringan, sesi uji, dan sesi premium karena kuota habis).

insert into private.secrets (name, value)
values ('net_salt', encode(extensions.gen_random_bytes(24), 'hex'))
on conflict (name) do nothing;

alter table public.rooms add column if not exists net_hash text;
create index if not exists rooms_net_idx on public.rooms (net_hash, created_at desc) where net_hash is not null;

create or replace function private.net_hash()
returns text language plpgsql stable set search_path = '' as $$
declare
  ip text;
  salt text;
begin
  ip := btrim(split_part(coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''), ',', 1));
  if ip = '' then
    return null;
  end if;
  select value into salt from private.secrets where name = 'net_salt';
  return encode(extensions.hmac(ip || ':' || to_char(now() at time zone 'Asia/Jakarta', 'YYYY-MM-DD'), salt, 'sha256'), 'hex');
exception when others then
  return null;
end $$;

create or replace function public.create_room(p_test boolean default false, p_premium boolean default false)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  is_demo boolean;
  net text;
  today timestamptz := date_trunc('day', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta';
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
  net := private.net_hash();
  -- Batas gratis (PRD): 3 sesi per hari (WIB) per perangkat.
  if not is_demo and not coalesce(p_premium, false) and (
    select count(distinct r.id) from public.rooms r
    join public.participants p on p.room_id = r.id and p.user_id = uid
    where r.tier = 'free' and r.created_at >= today
      and exists (select 1 from public.results s where s.room_id = r.id)
  ) >= 3 then
    raise exception 'daily_limit' using errcode = 'P0001';
  end if;
  -- Pengaman kedua: 25 sesi gratis per jaringan per hari.
  if not is_demo and not coalesce(p_premium, false) and net is not null and (
    select count(*) from public.rooms r
    where r.net_hash = net and r.tier = 'free' and r.created_at >= today
      and exists (select 1 from public.results s where s.room_id = r.id)
  ) >= 25 then
    raise exception 'daily_limit' using errcode = 'P0001';
  end if;
  for attempt in 1..10 loop
    new_code := private.random_string(6, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789');
    begin
      insert into public.rooms (code, host_id, tier, demo, test, needs_premium, net_hash)
      values (
        new_code, uid,
        case when is_demo then 'premium'::public.room_tier else 'free'::public.room_tier end,
        is_demo, coalesce(p_test, false), coalesce(p_premium, false) and not is_demo, net
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
