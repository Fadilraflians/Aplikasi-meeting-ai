-- Cancel Requests table untuk menyimpan permintaan pembatalan dari user lain
CREATE TABLE IF NOT EXISTS `cancel_requests` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `booking_id` VARCHAR(50) NOT NULL,
    `booking_type` ENUM('ai', 'form') NOT NULL,
    `requester_id` INT UNSIGNED NOT NULL,
    `requester_name` VARCHAR(100) NOT NULL,
    `owner_id` INT UNSIGNED NOT NULL,
    `owner_name` VARCHAR(100) NOT NULL,
    `reason` TEXT NOT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `response_message` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_booking_id` (`booking_id`),
    KEY `idx_requester_id` (`requester_id`),
    KEY `idx_owner_id` (`owner_id`),
    KEY `idx_status` (`status`),
    CONSTRAINT `fk_cancel_req_requester` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_cancel_req_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


