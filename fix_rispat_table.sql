-- Script untuk memperbaiki tabel rispat
USE aplikasi_meeting_ai;

-- Perpanjang kolom file_type
ALTER TABLE rispat MODIFY COLUMN file_type VARCHAR(255) NOT NULL;

-- Perpanjang kolom mime_type  
ALTER TABLE rispat MODIFY COLUMN mime_type VARCHAR(255) NOT NULL;

-- Tambahkan kolom filename jika belum ada
ALTER TABLE rispat ADD COLUMN IF NOT EXISTS filename VARCHAR(255) NOT NULL AFTER booking_id;

-- Tambahkan kolom original_filename jika belum ada
ALTER TABLE rispat ADD COLUMN IF NOT EXISTS original_filename VARCHAR(255) NOT NULL AFTER filename;

-- Hapus kolom lama jika ada
ALTER TABLE rispat DROP COLUMN IF EXISTS file_name;
ALTER TABLE rispat DROP COLUMN IF EXISTS original_name;

-- Tampilkan struktur tabel
DESCRIBE rispat;
