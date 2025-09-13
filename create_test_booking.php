<?php
require_once 'config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    // Insert test booking for today
    $today = date('Y-m-d');
    $tomorrow = date('Y-m-d', strtotime('+1 day'));
    
    $stmt = $conn->prepare('INSERT INTO ai_bookings_success (user_id, session_id, room_id, room_name, topic, meeting_date, meeting_time, end_time, duration, participants, pic, meeting_type, booking_state) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    
    // Booking for today at 16:00
    $stmt->execute([1, 'test_session_' . time(), 96, 'Test Room', 'Test Meeting Today', $today, '16:00:00', '17:00:00', 60, 5, 'Test PIC', 'internal', 'BOOKED']);
    echo "Created booking for today at 16:00\n";
    
    // Booking for tomorrow at 10:00
    $stmt->execute([1, 'test_session_' . (time() + 1), 97, 'Test Room 2', 'Test Meeting Tomorrow', $tomorrow, '10:00:00', '11:00:00', 60, 8, 'Test PIC 2', 'internal', 'BOOKED']);
    echo "Created booking for tomorrow at 10:00\n";
    
    echo "Test bookings created successfully!\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
