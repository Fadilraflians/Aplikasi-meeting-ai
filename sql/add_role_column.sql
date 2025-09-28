-- Migration script to add role column to existing users table
-- Run this script if you already have a users table without the role column

USE `spacio_meeting_db`;

-- Add role column to users table
ALTER TABLE `users` ADD COLUMN `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user' AFTER `bio`;

-- Update existing admin user (if exists)
UPDATE `users` SET `role` = 'admin' WHERE `email` = 'admin@spacio.com' OR `username` = 'admin';

-- Update existing user (if exists)
UPDATE `users` SET `role` = 'user' WHERE `email` = 'raflians@gmail.com' OR `username` = 'raflians';

-- If no admin user exists, create one
INSERT IGNORE INTO `users` (username, email, password, full_name, role) VALUES 
('admin', 'admin@spacio.com', 'admin123', 'Admin Spacio', 'admin');

-- If no regular user exists, create one
INSERT IGNORE INTO `users` (username, email, password, full_name, role) VALUES 
('raflians', 'raflians@gmail.com', 'admin123', 'Raflians User', 'user');


