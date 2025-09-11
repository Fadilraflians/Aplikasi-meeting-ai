-- Script untuk membuat tabel rispat di database spacio_meeting_db
USE spacio_meeting_db;

-- Buat tabel rispat
CREATE TABLE IF NOT EXISTS rispat (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by VARCHAR(100) NOT NULL DEFAULT 'user',
    status ENUM('active', 'deleted') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Index untuk performa
    INDEX idx_booking_id (booking_id),
    INDEX idx_uploaded_at (uploaded_at),
    INDEX idx_status (status)
);

-- Buat tabel metadata rispat (opsional)
CREATE TABLE IF NOT EXISTS rispat_metadata (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rispat_id INT NOT NULL,
    image_width INT,
    image_height INT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (rispat_id) REFERENCES rispat(id) ON DELETE CASCADE,
    INDEX idx_rispat_id (rispat_id)
);

-- Insert sample data untuk testing
INSERT INTO rispat (booking_id, filename, original_filename, file_path, file_size, file_type, mime_type, uploaded_by) VALUES 
(1, 'rispat_001.jpg', 'meeting_room_1.jpg', '/uploads/rispat/rispat_001.jpg', 2048576, 'image', 'image/jpeg', 'admin'),
(1, 'rispat_002.jpg', 'meeting_room_2.jpg', '/uploads/rispat/rispat_002.jpg', 1536000, 'image', 'image/jpeg', 'admin');

-- Insert sample metadata
INSERT INTO rispat_metadata (rispat_id, image_width, image_height, description) VALUES 
(1, 1920, 1080, 'Foto ruangan sebelum rapat dimulai'),
(2, 1920, 1080, 'Foto ruangan saat rapat berlangsung');

-- Tampilkan hasil
SELECT 'Tabel rispat berhasil dibuat!' as message;
SELECT COUNT(*) as total_rispat FROM rispat;
SELECT COUNT(*) as total_metadata FROM rispat_metadata;
