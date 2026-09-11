-- Halaman publik: tombol unduh hanya untuk dua peserta room, laporan dengan
-- alasan (satu per pelapor, total dibatasi), antrean tinjauan & penurunan.

alter table public.reports add column reporter uuid;
create index reports_result_idx on public.reports (result_id);

-- Browser ini salah satu dari dua peserta room photostrip ini? (sesi anonim
-- yang dipakai saat sesi foto). Tanpa sesi = bukan peserta.
create function public.is_result_member(p_slug text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.results s
    join public.participants p on p.room_id = s.room_id
    where s.slug = p_slug and s.deleted_at is null and p.user_id = auth.uid()
  )
$$;

create or replace function public.report_result(p_slug text, p_reason text default null)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare
  res_id uuid;
  who uuid := auth.uid();
begin
  select id into res_id from public.results where slug = p_slug and deleted_at is null;
  if res_id is null then
    return;
  end if;
  -- Satu laporan per pelapor yang punya sesi; total per photostrip dibatasi
  -- supaya tabel tidak bisa dibanjiri.
  if who is not null and exists (select 1 from public.reports where result_id = res_id and reporter = who) then
    return;
  end if;
  if (select count(*) from public.reports where result_id = res_id) >= 50 then
    return;
  end if;
  insert into public.reports (result_id, reason, reporter) values (res_id, left(p_reason, 500), who);
end $$;

-- Antrean tinjauan untuk tim (SQL editor / dashboard), tidak diekspos ke API.
create view private.report_queue as
select
  s.slug,
  count(*) as reports,
  array_agg(distinct r.reason) filter (where r.reason is not null) as reasons,
  max(r.created_at) as last_report,
  s.deleted_at is not null as removed
from public.reports r
join public.results s on s.id = r.result_id
group by s.slug, s.deleted_at
order by max(r.created_at) desc;

-- Turunkan photostrip yang dilaporkan: select private.takedown_result('slug');
-- File dibuang oleh jadwal pembersihan per jam.
create function private.takedown_result(p_slug text)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare
  res public.results;
begin
  select * into res from public.results where slug = p_slug and deleted_at is null;
  if not found then
    return;
  end if;
  update public.results set deleted_at = now() where id = res.id;
  perform private.broadcast(res.room_id, private.event('deleted', null));
end $$;

revoke execute on function private.takedown_result(text) from public, anon, authenticated;
revoke execute on function public.is_result_member(text) from public;
grant execute on function public.is_result_member(text) to anon, authenticated;
