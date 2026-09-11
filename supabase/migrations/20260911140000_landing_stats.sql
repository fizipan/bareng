-- Angka hidup di landing (dibaca /api/stats, di-cache CDN 15 detik). Hanya
-- agregat — tanpa nama, room, atau foto.
create index results_created_idx on public.results (created_at desc);

create function public.landing_stats()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    -- Orang di room yang masih hidup dan ada aktivitas 5 menit terakhir
    -- (updated_at naik tiap siap/ganti template/jepret).
    'people_live', (
      select count(*)
      from public.participants p
      join public.rooms r on r.id = p.room_id
      where r.status in ('waiting', 'lobby', 'capturing', 'review')
        and r.expires_at > now()
        and r.updated_at > now() - interval '5 minutes'
    ),
    'strips_today', (
      select count(*)
      from public.results
      where created_at >= (date_trunc('day', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta')
    ),
    'strips_total', (select count(*) from public.results),
    'last_strip_at', (select private.epoch_ms(max(created_at)) from public.results)
  )
$$;

revoke execute on function public.landing_stats() from public;
grant execute on function public.landing_stats() to anon, authenticated;
