-- Dua template baru. "Bersih" mengisi lubang yang selama ini kosong: tidak ada
-- pilihan tanpa tema sama sekali. "Wisuda" yang pertama dari rak musiman —
-- untuk sekarang selalu tampil; saklar waktunya menyusul.
--
-- Definisinya sendiri tetap di kode (lib/templates/builtin.ts); baris di sini
-- cuma yang dipakai server untuk memvalidasi pilihan & tier.
insert into public.templates (id, name, tier, sort) values
  ('bersih', 'Bersih', 'free', 2),
  ('wisuda', 'Wisuda', 'free', 3)
on conflict (id) do update set name = excluded.name, tier = excluded.tier, sort = excluded.sort;

-- Urutan menyesuaikan picker: bawaan dulu, lalu yang baru, lalu sisanya.
update public.templates set sort = 4 where id = 'polaroid';
update public.templates set sort = 5 where id = 'kotak';
update public.templates set sort = 6 where id = 'y2k';
update public.templates set sort = 7 where id = 'kodak';
update public.templates set sort = 8 where id = 'valentine';
