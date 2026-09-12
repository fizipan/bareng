-- Halaman publik butuh umur hasil (untuk "hilang N hari lagi"), dan pemilik
-- foto harus tetap bisa membeli "simpan selamanya" walau sesi room-nya sudah
-- lama berakhir. (Diterapkan lebih dulu lewat dashboard; file ini menjaga
-- repo tetap sama dengan database.)
create or replace function public.get_public_result(p_slug text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'slug', s.slug,
    'template_id', s.template_id,
    'filter_id', s.filter_id,
    'names', s.names,
    'watermark', s.watermark,
    'image_path', s.image_path,
    'created_at', private.epoch_ms(s.created_at),
    'expires_at', private.epoch_ms(s.expires_at)
  )
  from public.results s
  where s.slug = p_slug and s.deleted_at is null and (s.expires_at is null or s.expires_at > now())
$$;

-- payment_open: room kedaluwarsa tetap boleh dibayar selama photostrip-nya
-- masih hidup (jalur "simpan selamanya" dari halaman publik). Definisi utuh
-- ada di 20260912170000_net_quota_guard.sql.
