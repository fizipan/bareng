-- Admin laporan: laporan lewat /api/report (server kirim email ke admin),
-- status tinjau, dan RPC antrean/tindakan yang hanya bisa dipanggil server
-- dengan kunci service_role (halaman /admin).

alter table public.reports add column reviewed_at timestamptz;

-- Pengganti report_result: mengembalikan apakah laporan tercatat & jumlahnya,
-- supaya server tahu kapan perlu mengirim email.
create function public.file_report(p_slug text, p_reason text default null)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  res_id uuid;
  who uuid := auth.uid();
  total int;
begin
  select id into res_id from public.results where slug = p_slug and deleted_at is null;
  if res_id is null then
    return jsonb_build_object('inserted', false);
  end if;
  -- Satu laporan per pelapor yang punya sesi; total per photostrip dibatasi.
  if who is not null and exists (select 1 from public.reports where result_id = res_id and reporter = who) then
    return jsonb_build_object('inserted', false);
  end if;
  select count(*) into total from public.reports where result_id = res_id;
  if total >= 50 then
    return jsonb_build_object('inserted', false);
  end if;
  insert into public.reports (result_id, reason, reporter) values (res_id, left(p_reason, 500), who);
  return jsonb_build_object('inserted', true, 'reports', total + 1);
end $$;

drop function public.report_result(text, text);

-- Antrean untuk /admin: per photostrip, yang belum ditinjau di atas.
create function public.admin_report_queue()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(q order by q.pending > 0 desc, q.last_report desc), '[]'::jsonb)
  from (
    select
      s.slug,
      s.names,
      s.image_path,
      s.deleted_at is not null as removed,
      count(*) as reports,
      count(*) filter (where r.reviewed_at is null) as pending,
      coalesce(jsonb_agg(distinct r.reason) filter (where r.reason is not null), '[]'::jsonb) as reasons,
      private.epoch_ms(max(r.created_at)) as last_report
    from public.reports r
    join public.results s on s.id = r.result_id
    group by s.id
  ) q
$$;

-- Tandai ditinjau; p_takedown = turunkan photostrip-nya juga.
create function public.admin_resolve(p_slug text, p_takedown boolean)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  update public.reports r set reviewed_at = now()
  from public.results s
  where s.id = r.result_id and s.slug = p_slug and r.reviewed_at is null;
  if p_takedown then
    perform private.takedown_result(p_slug);
  end if;
end $$;

drop view private.report_queue;
create view private.report_queue as
select
  s.slug,
  count(*) as reports,
  count(*) filter (where r.reviewed_at is null) as pending,
  array_agg(distinct r.reason) filter (where r.reason is not null) as reasons,
  max(r.created_at) as last_report,
  s.deleted_at is not null as removed
from public.reports r
join public.results s on s.id = r.result_id
group by s.slug, s.deleted_at
order by max(r.created_at) desc;

revoke execute on function public.file_report(text, text) from public;
grant execute on function public.file_report(text, text) to anon, authenticated;
revoke execute on function public.admin_report_queue() from public, anon, authenticated;
revoke execute on function public.admin_resolve(text, boolean) from public, anon, authenticated;
grant execute on function public.admin_report_queue() to service_role;
grant execute on function public.admin_resolve(text, boolean) to service_role;
