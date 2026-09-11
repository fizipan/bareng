-- Statistik: tambah pembanding periode sebelumnya (panjang sama) dan waktu
-- data dibuat, untuk tanda naik/turun & "Diperbarui" di tab Statistik.
create or replace function public.admin_stats(p_days integer default 7)
returns jsonb language sql stable security definer set search_path = '' as $$
  with span as (
    select greatest(1, least(coalesce(p_days, 7), 90)) as days
  ),
  win as (
    select now() - make_interval(days => span.days) as since, now() - make_interval(days => span.days * 2) as prev_since
    from span
  ),
  cohort as (
    select e.room_id, e.created_at from public.events e, win
    where e.name = 'room_created' and e.created_at >= win.since
  ),
  ev as (
    select e.* from public.events e where e.room_id in (select room_id from cohort)
  ),
  prev_cohort as (
    select e.room_id from public.events e, win
    where e.name = 'room_created' and e.created_at >= win.prev_since and e.created_at < win.since
  ),
  prev_ev as (
    select e.* from public.events e where e.room_id in (select room_id from prev_cohort)
  ),
  drift as (
    select d::numeric as ms
    from public.events e, win, jsonb_array_elements_text(e.props -> 'drift') d
    where e.name = 'capture_done' and e.created_at >= win.since
  ),
  rtc as (
    select (e.props ->> 'ms')::numeric as ms, (e.props ->> 'relay')::boolean as relay
    from public.events e, win
    where e.name = 'rtc_connected' and e.created_at >= win.since and e.props ? 'ms'
  ),
  paid as (
    select (e.props ->> 'amount')::numeric as amount, e.created_at >= win.since as current
    from public.events e, win where e.name = 'payment_success' and e.created_at >= win.prev_since
  ),
  days as (
    select generate_series(
      date_trunc('day', (select since from win) at time zone 'Asia/Jakarta') + interval '1 day',
      date_trunc('day', now() at time zone 'Asia/Jakarta'),
      interval '1 day'
    ) as day
  )
  select jsonb_build_object(
    'days', (select days from span),
    'generated_at', private.epoch_ms(now()),
    'funnel', jsonb_build_object(
      'rooms', (select count(*) from cohort),
      'guest', (select count(distinct room_id) from ev where name = 'guest_joined'),
      'camera', (select count(*) from (select room_id from ev where name = 'camera_granted' group by room_id having count(distinct participant_id) >= 2) x),
      'connected', (select count(distinct room_id) from ev where name = 'rtc_connected'),
      'captured', (select count(distinct room_id) from ev where name = 'capture_done'),
      'saved', (select count(distinct room_id) from ev where name in ('download', 'share')),
      'paywall', (select count(distinct room_id) from ev where name = 'paywall_viewed'),
      'paid', (select count(distinct room_id) from ev where name = 'payment_success')
    ),
    'prev', jsonb_build_object(
      'rooms', (select count(*) from prev_cohort),
      'guest', (select count(distinct room_id) from prev_ev where name = 'guest_joined'),
      'connected', (select count(distinct room_id) from prev_ev where name = 'rtc_connected'),
      'captured', (select count(distinct room_id) from prev_ev where name = 'capture_done'),
      'paid_total', (select coalesce(sum(amount), 0) from paid where not current)
    ),
    'drift', jsonb_build_object(
      'n', (select count(*) from drift),
      'p50', (select round(percentile_cont(0.5) within group (order by ms)) from drift),
      'p95', (select round(percentile_cont(0.95) within group (order by ms)) from drift),
      'under150', (select round(100.0 * count(*) filter (where ms < 150) / nullif(count(*), 0)) from drift)
    ),
    'rtc', jsonb_build_object(
      'connected', (select count(*) from rtc),
      'failed', (select count(*) from public.events e, win where e.name = 'rtc_failed' and e.created_at >= win.since),
      'p50_ms', (select round(percentile_cont(0.5) within group (order by ms)) from rtc),
      'relay_pct', (select round(100.0 * count(*) filter (where relay) / nullif(count(*), 0)) from rtc)
    ),
    'payments', jsonb_build_object(
      'count', (select count(*) from paid where current),
      'total', (select coalesce(sum(amount), 0) from paid where current)
    ),
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'day', to_char(d.day, 'YYYY-MM-DD'),
        'rooms', (select count(*) from cohort c where date_trunc('day', c.created_at at time zone 'Asia/Jakarta') = d.day),
        'captured', (select count(*) from public.events e where e.name = 'capture_done' and date_trunc('day', e.created_at at time zone 'Asia/Jakarta') = d.day)
      ) order by d.day), '[]'::jsonb)
      from days d
    )
  )
$$;
