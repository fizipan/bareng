-- Catat hasil percobaan menyalakan mic (berhasil / ditolak / sibuk) supaya
-- masalah izin mic di HP tertentu kelihatan penyebabnya di tab Statistik.
create or replace function public.track(p_room uuid, p_name text, p_props jsonb default null)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare
  me public.participants;
begin
  if p_name not in ('camera_granted', 'camera_denied', 'rtc_connected', 'rtc_failed', 'result_viewed', 'download', 'share', 'paywall_viewed', 'retake', 'mic_result') then
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
