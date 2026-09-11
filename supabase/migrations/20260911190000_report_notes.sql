-- Catatan laporan (wajib untuk "Lainnya", opsional untuk alasan lain),
-- ditampilkan di /admin & email admin.

alter table public.reports add column note text check (char_length(note) <= 500);

drop function public.file_report(text, text);

create function public.file_report(p_slug text, p_reason text default null, p_note text default null)
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
  insert into public.reports (result_id, reason, note, reporter)
  values (res_id, left(p_reason, 500), nullif(left(btrim(p_note), 500), ''), who);
  return jsonb_build_object('inserted', true, 'reports', total + 1);
end $$;

revoke execute on function public.file_report(text, text, text) from public;
grant execute on function public.file_report(text, text, text) to anon, authenticated;

create or replace function public.admin_report_queue()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(q order by (q.pending > 0 and not q.removed) desc, q.last_report desc), '[]'::jsonb)
  from (
    select
      s.slug,
      s.names,
      s.image_path,
      s.deleted_at is not null as removed,
      s.taken_down_at is not null as taken_down,
      count(*) as reports,
      count(*) filter (where r.reviewed_at is null) as pending,
      (
        select coalesce(jsonb_agg(jsonb_build_object('reason', x.reason, 'n', x.n) order by x.n desc), '[]'::jsonb)
        from (
          select r2.reason, count(*) as n from public.reports r2 where r2.result_id = s.id group by r2.reason
        ) x
      ) as reasons,
      -- Tiga catatan terbaru.
      (
        select coalesce(jsonb_agg(jsonb_build_object('reason', y.reason, 'note', y.note) order by y.created_at desc), '[]'::jsonb)
        from (
          select r3.reason, r3.note, r3.created_at
          from public.reports r3
          where r3.result_id = s.id and r3.note is not null
          order by r3.created_at desc
          limit 3
        ) y
      ) as notes,
      private.epoch_ms(max(r.created_at)) as last_report
    from public.reports r
    join public.results s on s.id = r.result_id
    group by s.id
  ) q
$$;
