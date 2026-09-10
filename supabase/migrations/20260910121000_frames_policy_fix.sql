-- Policy unggah foto tidak boleh membaca public.rooms: tabel itu tertutup RLS
-- untuk klien, jadi syarat status room selalu gagal. Cukup keanggotaan
-- (baris participants milik sendiri memang boleh dibaca). Path berversi dan
-- frame_uploaded tetap memvalidasi foto yang dipakai.
drop policy "peserta unggah foto sendiri" on storage.objects;

create policy "peserta unggah foto sendiri" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'frames'
    and exists (
      select 1 from public.participants p
      where p.user_id = (select auth.uid())
        and p.room_id::text = (storage.foldername(name))[1]
        and p.id::text = (storage.foldername(name))[2]
    )
  );
