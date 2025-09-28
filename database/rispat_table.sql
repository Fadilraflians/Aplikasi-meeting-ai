-- Tabel untuk menyimpan rispat berupa foto
CREATE TABLE rispat (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by VARCHAR(100) NOT NULL,
    status ENUM('active', 'deleted') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key ke tabel booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    
    -- Index untuk performa
    INDEX idx_booking_id (booking_id),
    INDEX idx_uploaded_at (uploaded_at),
    INDEX idx_status (status)
);

-- Tabel untuk menyimpan metadata foto rispat
CREATE TABLE rispat_metadata (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rispat_id INT NOT NULL,
    image_width INT,
    image_height INT,
    camera_model VARCHAR(100),
    taken_at TIMESTAMP NULL,
    location VARCHAR(255),
    description TEXT,
    tags JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key ke tabel rispat
    FOREIGN KEY (rispat_id) REFERENCES rispat(id) ON DELETE CASCADE,
    
    -- Index untuk performa
    INDEX idx_rispat_id (rispat_id)
);

-- View untuk mendapatkan rispat dengan metadata
CREATE VIEW rispat_with_metadata AS
SELECT 
    r.id,
    r.booking_id,
    r.filename,
    r.original_filename,
    r.file_path,
    r.file_size,
    r.file_type,
    r.mime_type,
    r.uploaded_at,
    r.uploaded_by,
    r.status,
    rm.image_width,
    rm.image_height,
    rm.camera_model,
    rm.taken_at,
    rm.location,
    rm.description,
    rm.tags,
    r.created_at,
    r.updated_at
FROM rispat r
LEFT JOIN rispat_metadata rm ON r.id = rm.rispat_id
WHERE r.status = 'active';

-- Stored procedure untuk mendapatkan rispat berdasarkan booking_id
DELIMITER //
CREATE PROCEDURE GetRispatByBookingId(IN p_booking_id INT)
BEGIN
    SELECT 
        id,
        filename,
        original_filename,
        file_path,
        file_size,
        file_type,
        mime_type,
        uploaded_at,
        uploaded_by,
        image_width,
        image_height,
        camera_model,
        taken_at,
        location,
        description,
        tags
    FROM rispat_with_metadata
    WHERE booking_id = p_booking_id
    ORDER BY uploaded_at DESC;
END //
DELIMITER ;

-- Stored procedure untuk upload rispat baru
DELIMITER //
CREATE PROCEDURE UploadRispat(
    IN p_booking_id INT,
    IN p_filename VARCHAR(255),
    IN p_original_filename VARCHAR(255),
    IN p_file_path VARCHAR(500),
    IN p_file_size INT,
    IN p_file_type VARCHAR(100),
    IN p_mime_type VARCHAR(100),
    IN p_uploaded_by VARCHAR(100),
    IN p_image_width INT,
    IN p_image_height INT,
    IN p_camera_model VARCHAR(100),
    IN p_taken_at TIMESTAMP,
    IN p_location VARCHAR(255),
    IN p_description TEXT,
    IN p_tags JSON
)
BEGIN
    DECLARE v_rispat_id INT;
    
    -- Insert ke tabel rispat
    INSERT INTO rispat (
        booking_id, filename, original_filename, file_path, 
        file_size, file_type, mime_type, uploaded_by
    ) VALUES (
        p_booking_id, p_filename, p_original_filename, p_file_path,
        p_file_size, p_file_type, p_mime_type, p_uploaded_by
    );
    
    -- Get the inserted ID
    SET v_rispat_id = LAST_INSERT_ID();
    
    -- Insert metadata jika ada
    IF p_image_width IS NOT NULL OR p_image_height IS NOT NULL OR 
       p_camera_model IS NOT NULL OR p_taken_at IS NOT NULL OR 
       p_location IS NOT NULL OR p_description IS NOT NULL OR 
       p_tags IS NOT NULL THEN
        
        INSERT INTO rispat_metadata (
            rispat_id, image_width, image_height, camera_model,
            taken_at, location, description, tags
        ) VALUES (
            v_rispat_id, p_image_width, p_image_height, p_camera_model,
            p_taken_at, p_location, p_description, p_tags
        );
    END IF;
    
    -- Return the rispat data
    SELECT 
        id, filename, original_filename, file_path, file_size,
        file_type, mime_type, uploaded_at, uploaded_by
    FROM rispat
    WHERE id = v_rispat_id;
END //
DELIMITER ;

-- Stored procedure untuk menghapus rispat
DELIMITER //
CREATE PROCEDURE DeleteRispat(IN p_rispat_id INT, IN p_deleted_by VARCHAR(100))
BEGIN
    UPDATE rispat 
    SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
    WHERE id = p_rispat_id;
    
    SELECT 'Rispat berhasil dihapus' as message;
END //
DELIMITER ;

-- Insert sample data untuk testing
INSERT INTO rispat (
    booking_id, filename, original_filename, file_path, 
    file_size, file_type, mime_type, uploaded_by
) VALUES 
(1, 'rispat_001.jpg', 'meeting_room_1.jpg', '/uploads/rispat/rispat_001.jpg', 2048576, 'image', 'image/jpeg', 'admin'),
(1, 'rispat_002.jpg', 'meeting_room_2.jpg', '/uploads/rispat/rispat_002.jpg', 1536000, 'image', 'image/jpeg', 'admin'),
(2, 'rispat_003.jpg', 'meeting_room_3.jpg', '/uploads/rispat/rispat_003.jpg', 3072000, 'image', 'image/jpeg', 'admin');

-- Insert sample metadata
INSERT INTO rispat_metadata (
    rispat_id, image_width, image_height, camera_model, 
    taken_at, location, description, tags
) VALUES 
(1, 1920, 1080, 'iPhone 12', '2024-01-15 10:30:00', 'Meeting Room A', 'Foto ruangan sebelum rapat dimulai', '["meeting", "room", "before"]'),
(2, 1920, 1080, 'iPhone 12', '2024-01-15 12:00:00', 'Meeting Room A', 'Foto ruangan saat rapat berlangsung', '["meeting", "room", "during"]'),
(3, 1920, 1080, 'iPhone 12', '2024-01-15 14:30:00', 'Meeting Room B', 'Foto ruangan setelah rapat selesai', '["meeting", "room", "after"]');






