USE spacio_meeting_db;

INSERT INTO bookings (user_id, room_id, room_name, topic, pic, participants, meeting_date, start_time, end_time, meeting_type, facilities, status, created_at, updated_at) 
VALUES (2, 1, 'Samudrantha Meeting Room', 'Meeting Besok Raflians', 'Raflians', 8, '2025-01-27', '14:00:00', '15:00:00', 'internal', '["TV", "AC", "Proyektor"]', 'active', NOW(), NOW());

