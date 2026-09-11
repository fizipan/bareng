-- M6 selesai: room hanya bisa jadi premium lewat pembayaran (webhook →
-- payment_settle). Jalan pintas sementara dari M2 dihapus setelah klien baru
-- live, supaya tidak ada klien lama yang tiba-tiba gagal.
drop function public.mock_upgrade(uuid);
