-- Versi shot harus selalu naik dalam satu room: di layar review current_shot
-- sudah null, jadi foto ulang dulu mulai lagi dari v=1 dan bisa sama dengan
-- versi foto lama (HP mengira sudah motret; path Storage bentrok). Sekarang
-- versi berikutnya = versi terbesar yang pernah dipakai + 1.
create or replace function public.request_retake(p_room uuid, p_indices smallint[])
returns void language plpgsql volatile security definer set search_path = '' as $$
declare
  me public.participants := private.me(p_room);
  room public.rooms;
  queue smallint[];
  next_v int;
begin
  select * into room from public.rooms where id = p_room for update;
  if room.status <> 'review' then
    return;
  end if;
  select array_agg(distinct i order by i) into queue from unnest(p_indices) as i where i between 0 and 3;
  if queue is null then
    raise exception 'invalid_indices' using errcode = 'P0001';
  end if;
  select greatest(coalesce((room.current_shot ->> 'v')::int, 0), coalesce(max(f.shot_v), 0)) + 1
  into next_v
  from public.frames f where f.room_id = p_room;
  delete from public.frames where room_id = p_room and idx = any (queue);
  update public.rooms
  set status = 'capturing',
      retake_queue = queue,
      current_shot = private.make_shot(queue[1], next_v, interval '0.8 seconds', null)
  where id = p_room;
  perform private.broadcast(p_room, private.event('retake', me.id, jsonb_build_object('indices', to_jsonb(queue))));
end $$;
