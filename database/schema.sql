-- Database schema for Meeting Room Booking System
-- Supports both AI Agent and Form-based bookings

-- Create database
CREATE DATABASE IF NOT EXISTS meeting_room_booking;
USE meeting_room_booking;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    position VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Meeting rooms table
CREATE TABLE meeting_rooms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    floor VARCHAR(50) NOT NULL,
    capacity INT NOT NULL,
    address TEXT,
    facilities JSON,
    image_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Booking status enum
CREATE TABLE booking_status (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#000000'
);

-- Insert default booking statuses
INSERT INTO booking_status (name, description, color) VALUES
('pending', 'Menunggu konfirmasi', '#FFA500'),
('confirmed', 'Dikonfirmasi', '#008000'),
('cancelled', 'Dibatalkan', '#FF0000'),
('completed', 'Selesai', '#808080'),
('expired', 'Kadaluarsa', '#FF0000');

-- Bookings table (main table)
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    room_id INT NOT NULL,
    status_id INT NOT NULL DEFAULT 1,
    topic VARCHAR(255) NOT NULL,
    pic VARCHAR(100) NOT NULL,
    participants INT NOT NULL,
    meeting_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    meeting_type ENUM('internal', 'external') DEFAULT 'internal',
    food_order ENUM('tidak', 'ringan', 'berat') DEFAULT 'tidak',
    special_requests TEXT,
    ai_agent_created BOOLEAN DEFAULT FALSE,
    form_created BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES meeting_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (status_id) REFERENCES booking_status(id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_room_id (room_id),
    INDEX idx_meeting_date (meeting_date),
    INDEX idx_status_id (status_id),
    INDEX idx_ai_agent_created (ai_agent_created),
    INDEX idx_form_created (form_created)
);

-- AI Agent conversation history
CREATE TABLE ai_conversations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    booking_state VARCHAR(50),
    booking_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_created_at (created_at)
);

-- AI Agent session tracking
CREATE TABLE ai_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    current_state VARCHAR(50) DEFAULT 'IDLE',
    booking_data JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_is_active (is_active)
);

-- Room availability tracking
CREATE TABLE room_availability (
    id INT PRIMARY KEY AUTO_INCREMENT,
    room_id INT NOT NULL,
    date DATE NOT NULL,
    time_slot TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    booking_id INT NULL,
    
    FOREIGN KEY (room_id) REFERENCES meeting_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    
    UNIQUE KEY unique_room_time (room_id, date, time_slot),
    INDEX idx_room_id (room_id),
    INDEX idx_date (date),
    INDEX idx_is_available (is_available)
);

-- Food orders (if needed for catering)
CREATE TABLE food_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    food_type ENUM('ringan', 'berat') NOT NULL,
    quantity INT NOT NULL,
    special_requirements TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    
    INDEX idx_booking_id (booking_id)
);

-- Audit log for tracking changes
CREATE TABLE audit_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    table_name VARCHAR(50) NOT NULL,
    record_id INT NOT NULL,
    action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    old_values JSON,
    new_values JSON,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_table_name (table_name),
    INDEX idx_record_id (record_id),
    INDEX idx_action (action),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

-- Insert sample meeting rooms
INSERT INTO meeting_rooms (name, floor, capacity, address, facilities, image_url) VALUES
('Samudrantha Meeting Room', '1st Floor', 15, 'Injourney Airport Center', '["TV", "AC", "Proyektor"]', '/images/meeting-rooms/samudrantha.svg'),
('Cedaya Meeting Room', '1st Floor', 15, 'Injourney Airport Center', '["TV", "AC", "Proyektor"]', '/images/meeting-rooms/cedaya.svg'),
('Celebes Meeting Room', '1st Floor', 15, 'Injourney Airport Center', '["TV", "AC", "Proyektor"]', '/images/meeting-rooms/celebes.svg'),
('Kalamanthana Meeting Room', '1st Floor', 15, 'Injourney Airport Center', '["TV", "AC", "Proyektor", "Whiteboard"]', '/images/meeting-rooms/kalamanthana.svg'),
('Nusanipa Meeting Room', '1st Floor', 15, 'Injourney Airport Center', '["TV", "AC"]', '/images/meeting-rooms/nusanipa.svg'),
('Balidwipa Meeting Room', '1st Floor', 20, 'Injourney Airport Center', '["TV", "AC", "Proyektor"]', '/images/meeting-rooms/balidwipa.svg'),
('Swarnadwipa Meeting Room', 'Ground Floor', 25, 'Injourney Airport Center', '["TV", "AC", "Proyektor"]', '/images/meeting-rooms/swarnadwipa.svg'),
('Auditorium Jawadwipa 1', 'Ground Floor', 35, 'Injourney Airport Center', '["TV", "AC", "Proyektor", "Sound System"]', '/images/meeting-rooms/jawadwipa1.svg'),
('Auditorium Jawadwipa 2', 'Ground Floor', 35, 'Injourney Airport Center', '["TV", "AC", "Proyektor", "Sound System"]', '/images/meeting-rooms/jawadwipa2.svg');

-- Insert sample user (for testing)
INSERT INTO users (username, email, password_hash, full_name, department, position) VALUES
('admin', 'admin@spacio.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 'IT', 'System Admin'),
('user1', 'user1@spacio.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John Doe', 'Marketing', 'Manager'),
('user2', 'user2@spacio.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane Smith', 'Sales', 'Team Lead');
