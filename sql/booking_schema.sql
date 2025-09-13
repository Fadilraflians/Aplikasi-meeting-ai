-- Spacio Booking Schema
-- Use the existing database
USE `spacio_meeting_db`;

-- Meeting Rooms table (if not exists)
CREATE TABLE IF NOT EXISTS `meeting_rooms` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `room_name` VARCHAR(100) NOT NULL,
    `room_number` VARCHAR(50) NULL,
    `capacity` INT UNSIGNED NOT NULL DEFAULT 0,
    `floor` VARCHAR(50) NULL,
    `building` VARCHAR(100) NULL,
    `description` TEXT NULL,
    `features` TEXT NULL,
    `image_url` VARCHAR(255) NULL,
    `is_available` TINYINT(1) NOT NULL DEFAULT 1,
    `is_maintenance` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uniq_room_name` (`room_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reservations table
CREATE TABLE IF NOT EXISTS `reservations` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `room_id` INT UNSIGNED NOT NULL,
    `user_id` INT UNSIGNED NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `start_time` DATETIME NOT NULL,
    `end_time` DATETIME NOT NULL,
    `attendees` INT UNSIGNED NOT NULL DEFAULT 1,
    `meeting_type` ENUM('internal', 'external', 'training', 'interview', 'other') NOT NULL DEFAULT 'internal',
    `status` ENUM('pending', 'confirmed', 'cancelled', 'completed') NOT NULL DEFAULT 'pending',
    `created_by_ai` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_room_id` (`room_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_start_time` (`start_time`),
    KEY `idx_end_time` (`end_time`),
    KEY `idx_status` (`status`),
    CONSTRAINT `fk_reservation_room` FOREIGN KEY (`room_id`) REFERENCES `meeting_rooms` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_reservation_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Conversation History table
CREATE TABLE IF NOT EXISTS `ai_conversations` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED NOT NULL,
    `session_id` VARCHAR(100) NOT NULL,
    `message` TEXT NOT NULL,
    `response` TEXT NOT NULL,
    `booking_state` VARCHAR(50) NULL,
    `booking_data` JSON NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_session_id` (`session_id`),
    CONSTRAINT `fk_ai_conv_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Booking Data table (to store temporary booking data during conversation)
CREATE TABLE IF NOT EXISTS `ai_booking_data` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED NOT NULL,
    `session_id` VARCHAR(100) NOT NULL,
    `room_id` INT UNSIGNED NULL,
    `topic` VARCHAR(255) NULL,
    `meeting_date` DATE NULL,
    `meeting_time` TIME NULL,
    `end_time` TIME NULL,
    `duration` INT UNSIGNED NULL,
    `participants` INT UNSIGNED NULL,
    `meeting_type` ENUM('internal', 'external', 'training', 'interview', 'other') NULL,
    `facilities` TEXT NULL,
    `booking_state` VARCHAR(50) NOT NULL DEFAULT 'IDLE',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uniq_user_session` (`user_id`, `session_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_session_id` (`session_id`),
    KEY `idx_room_id` (`room_id`),
    CONSTRAINT `fk_ai_booking_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ai_booking_room` FOREIGN KEY (`room_id`) REFERENCES `meeting_rooms` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data for meeting rooms
INSERT INTO `meeting_rooms` (`room_name`, `room_number`, `capacity`, `floor`, `building`, `description`, `features`) VALUES
('Samudrantha Meeting Room', 'A101', 10, '1', 'Tower A', 'Ruang rapat dengan pemandangan laut', 'Proyektor, Whiteboard, AC, Sound System'),
('Nusantara Conference Room', 'B201', 20, '2', 'Tower B', 'Ruang konferensi besar dengan fasilitas lengkap', 'Proyektor, Whiteboard, AC, Sound System, Video Conference'),
('Garuda Discussion Room', 'A202', 6, '2', 'Tower A', 'Ruang diskusi kecil', 'Whiteboard, AC, TV'),
('Komodo Meeting Room', 'C101', 8, '1', 'Tower C', 'Ruang rapat dengan desain modern', 'Proyektor, Whiteboard, AC'),
('Borobudur Conference Hall', 'D301', 30, '3', 'Tower D', 'Ruang konferensi besar untuk acara penting', 'Proyektor, Whiteboard, AC, Sound System, Video Conference, Podium')
ON DUPLICATE KEY UPDATE `room_name` = VALUES(`room_name`);