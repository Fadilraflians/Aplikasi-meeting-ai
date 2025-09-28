-- Create ai_bookings_success table for storing successful AI bookings
CREATE TABLE IF NOT EXISTS ai_bookings_success (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    room_id INT,
    room_name VARCHAR(255) NOT NULL,
    topic VARCHAR(500) NOT NULL,
    pic VARCHAR(255) NOT NULL,
    participants INT NOT NULL DEFAULT 0,
    meeting_date DATE NOT NULL,
    meeting_time TIME NOT NULL,
    end_time TIME,
    duration INT NOT NULL DEFAULT 60,
    meeting_type ENUM('internal', 'external') NOT NULL DEFAULT 'internal',
    booking_state VARCHAR(50) NOT NULL DEFAULT 'BOOKED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_meeting_date (meeting_date),
    INDEX idx_booking_state (booking_state),
    INDEX idx_created_at (created_at)
);

-- Add foreign key constraint if meeting_rooms table exists
-- ALTER TABLE ai_bookings_success ADD CONSTRAINT fk_ai_bookings_room_id FOREIGN KEY (room_id) REFERENCES meeting_rooms(id) ON DELETE SET NULL;
