-- Admin: bedakan photostrip yang diturunkan admin vs dihapus pemiliknya,
-- alasan beserta jumlahnya, dan yang perlu ditindak selalu di atas.

alter table public.results add column taken_down_at timestamptz;

create or replace function private.takedown_result(p_slug text)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare
  res public.results;
begin
  select * into res from public.results where slug = p_slug and deleted_at is null;
  if not found then
    return;
  end if;
  update public.results set deleted_at = now(), taken_down_at = now() where id = res.id;
  perform private.broadcast(res.room_id, private.event('deleted', null));
end $$;

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
      private.epoch_ms(max(r.created_at)) as last_report
    from public.reports r
    join public.results s on s.id = r.result_id
    group by s.id
  ) q
$$;
