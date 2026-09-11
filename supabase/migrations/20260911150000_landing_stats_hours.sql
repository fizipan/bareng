-- Angka landing + jumlah photostrip per jam hari ini (WIB) untuk grafik kecil.
create or replace function public.landing_stats()
returns jsonb language sql stable security definer set search_path = '' as $$
  with day as (
    select (date_trunc('day', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta') as start
  ),
  today as (
    select s.created_at from public.results s, day where s.created_at >= day.start
  ),
  per_hour as (
    select coalesce(jsonb_agg(coalesce(c.n, 0) order by g.h), '[]'::jsonb) as list
    from generate_series(0, 23) g(h)
    left join (
      select extract(hour from created_at at time zone 'Asia/Jakarta')::int as h, count(*) as n
      from today
      group by 1
    ) c on c.h = g.h
  )
  select jsonb_build_object(
    -- Orang di room yang masih hidup dan ada aktivitas 5 menit terakhir.
    'people_live', (
      select count(*)
      from public.participants p
      join public.rooms r on r.id = p.room_id
      where r.status in ('waiting', 'lobby', 'capturing', 'review')
        and r.expires_at > now()
        and r.updated_at > now() - interval '5 minutes'
    ),
    'strips_today', (select count(*) from today),
    'strips_total', (select count(*) from public.results),
    'last_strip_at', (select private.epoch_ms(max(created_at)) from public.results),
    'hours', (select list from per_hour),
    'hour_now', extract(hour from now() at time zone 'Asia/Jakarta')::int
  )
$$;
