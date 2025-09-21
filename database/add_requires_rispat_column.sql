-- Add requires_rispat column to bookings table
-- This column indicates whether the booking requires rispat upload

USE meeting_room_booking;

-- Add requires_rispat column to bookings table
ALTER TABLE bookings 
ADD COLUMN requires_rispat BOOLEAN DEFAULT FALSE 
AFTER meeting_type;

-- Add requires_rispat column to ai_booking_data table (if exists)
-- This is for AI bookings
ALTER TABLE ai_booking_data 
ADD COLUMN requires_rispat BOOLEAN DEFAULT FALSE 
AFTER meeting_type;

-- Update existing bookings to have requires_rispat = FALSE by default
UPDATE bookings SET requires_rispat = FALSE WHERE requires_rispat IS NULL;
UPDATE ai_booking_data SET requires_rispat = FALSE WHERE requires_rispat IS NULL;
