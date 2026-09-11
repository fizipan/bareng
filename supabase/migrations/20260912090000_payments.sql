-- M6: pembayaran per sesi (R7). Klien tidak pernah menulis status bayar:
-- route server membuka tagihan (service_role), dan hanya webhook provider yang
-- bisa menandai lunas → room premium → broadcast ke dua HP.
-- Batas gratis: 3 sesi per hari (WIB) per perangkat, dicek saat membuat room.

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique,
  room_id uuid not null references public.rooms (id) on delete cascade,
  participant_id uuid references public.participants (id) on delete set null,
  provider text not null,
  provider_ref text,
  amount integer not null check (amount > 0),
  -- Template premium yang dipilih sebelum bayar; dipakai begitu lunas.
  template_id text references public.templates (id),
  qr text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'expired')),
  expires_at timestamptz not null,
  paid_at timestamptz,
  raw jsonb,
  created_at timestamptz not null default now()
);
create index payments_room_idx on public.payments (room_id, created_at desc);
alter table public.payments enable row level security;

-- Buka tagihan untuk room (dipanggil route /api/payments setelah token user
-- diverifikasi). Tagihan yang masih berlaku dipakai lagi: kalau dua-duanya
-- membuka paywall, QR-nya sama, jadi tidak mungkin bayar dua kali.
create function public.payment_open(p_user uuid, p_room uuid, p_template text, p_provider text, p_amount integer)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  me public.participants;
  room public.rooms;
  pay public.payments;
begin
  select * into me from public.participants where room_id = p_room and user_id = p_user;
  if not found then
    raise exception 'not_participant' using errcode = 'P0001';
  end if;
  select * into room from public.rooms where id = p_room for update;
  if room.status = 'expired' then
    raise exception 'room_expired' using errcode = 'P0001';
  end if;
  if room.tier = 'premium' then
    raise exception 'already_premium' using errcode = 'P0001';
  end if;
  if p_template is not null and not exists (select 1 from public.templates where id = p_template and active) then
    raise exception 'template_not_found' using errcode = 'P0001';
  end if;

  update public.payments set status = 'expired'
  where room_id = p_room and status = 'pending' and expires_at <= now();
  select * into pay from public.payments
  where room_id = p_room and status = 'pending' and provider = p_provider
  order by created_at desc limit 1;
  if found then
    if p_template is not null then
      update public.payments set template_id = p_template where id = pay.id returning * into pay;
    end if;
    return jsonb_build_object(
      'order_id', pay.order_id, 'amount', pay.amount, 'qr', pay.qr,
      'expires_at', private.epoch_ms(pay.expires_at), 'reused', true
    );
  end if;

  if (select count(*) from public.payments where room_id = p_room and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  insert into public.payments (order_id, room_id, participant_id, provider, amount, template_id, expires_at)
  values (
    'BRG-' || private.random_string(12, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'),
    p_room, me.id, p_provider, p_amount, p_template, now() + interval '15 minutes'
  )
  returning * into pay;
  perform private.broadcast(p_room, private.event('paying', me.id));
  return jsonb_build_object(
    'order_id', pay.order_id, 'amount', pay.amount, 'qr', null,
    'expires_at', private.epoch_ms(pay.expires_at), 'reused', false
  );
end $$;

-- Simpan QR & referensi dari provider setelah tagihan dibuat di sana.
create function public.payment_attach(p_order text, p_provider_ref text, p_qr text)
returns void language sql volatile security definer set search_path = '' as $$
  update public.payments set provider_ref = p_provider_ref, qr = p_qr
  where order_id = p_order and status = 'pending'
$$;

-- Hasil webhook (sudah diverifikasi route). Idempoten: provider boleh
-- mengirim notifikasi yang sama berkali-kali. Gagal/kedaluwarsa tidak
-- menyentuh room maupun foto.
create function public.payment_settle(p_order text, p_status text, p_raw jsonb default null)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  pay public.payments;
  room public.rooms;
begin
  if p_status not in ('paid', 'failed', 'expired') then
    raise exception 'bad_status' using errcode = 'P0001';
  end if;
  select * into pay from public.payments where order_id = p_order for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if pay.status = 'paid' or pay.status = p_status then
    return jsonb_build_object('ok', true, 'status', pay.status, 'duplicate', true);
  end if;

  if p_status = 'paid' then
    -- Lunas selalu diterima, termasuk setelah QR dianggap kedaluwarsa
    -- (uangnya sudah masuk).
    update public.payments set status = 'paid', paid_at = now(), raw = p_raw where id = pay.id;
    select * into room from public.rooms where id = pay.room_id for update;
    update public.rooms set tier = 'premium' where id = room.id;
    update public.results set watermark = false, expires_at = null where room_id = room.id;
    if pay.template_id is not null and room.status not in ('capturing', 'expired')
      and exists (select 1 from public.templates where id = pay.template_id and active) then
      update public.rooms set template_id = pay.template_id where id = room.id;
      if room.status = 'done' then
        update public.results set template_id = pay.template_id where room_id = room.id and deleted_at is null;
      end if;
    end if;
    perform private.broadcast(room.id, private.event('upgraded', pay.participant_id, jsonb_build_object('order', pay.order_id)));
    return jsonb_build_object('ok', true, 'status', 'paid');
  end if;

  if pay.status = 'pending' then
    update public.payments set status = p_status, raw = p_raw where id = pay.id;
    perform private.broadcast(
      pay.room_id,
      private.event('payment_failed', pay.participant_id, jsonb_build_object('order', pay.order_id, 'status', p_status))
    );
  end if;
  return jsonb_build_object('ok', true, 'status', p_status);
end $$;

-- Batas gratis (PRD): 3 sesi per hari per perangkat. Yang dihitung sesi gratis
-- yang sampai jadi photostrip, baik sebagai pembuat room maupun tamu.
create or replace function public.create_room()
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
  if (
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
      insert into public.rooms (code, host_id) values (new_code, uid) returning * into room;
      exit;
    exception when unique_violation then
      if attempt = 10 then raise; end if;
    end;
  end loop;
  insert into public.participants (room_id, user_id, role) values (room.id, uid, 'host');
  return jsonb_build_object('room_id', room.id, 'code', room.code);
end $$;

revoke execute on function public.payment_open(uuid, uuid, text, text, integer) from public, anon, authenticated;
revoke execute on function public.payment_attach(text, text, text) from public, anon, authenticated;
revoke execute on function public.payment_settle(text, text, jsonb) from public, anon, authenticated;
grant execute on function public.payment_open(uuid, uuid, text, text, integer) to service_role;
grant execute on function public.payment_attach(text, text, text) to service_role;
grant execute on function public.payment_settle(text, text, jsonb) to service_role;
