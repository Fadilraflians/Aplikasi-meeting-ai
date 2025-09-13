<?php
require_once 'config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    echo "=== CHECKING DATABASE ===\n\n";
    
    // Check meeting_rooms table
    echo "1. Meeting Rooms:\n";
    $stmt = $conn->query('SELECT COUNT(*) as count FROM meeting_rooms');
    $result = $stmt->fetch();
    echo "   Total rooms: " . $result['count'] . "\n";
    
    if ($result['count'] > 0) {
        $stmt = $conn->query('SELECT id, room_name, capacity, is_available FROM meeting_rooms LIMIT 5');
        $rooms = $stmt->fetchAll();
        foreach ($rooms as $room) {
            echo "   - ID: {$room['id']}, Name: {$room['room_name']}, Capacity: {$room['capacity']}, Available: {$room['is_available']}\n";
        }
    }
    
    // Check ai_bookings_success table
    echo "\n2. AI Bookings Success:\n";
    $stmt = $conn->query('SELECT COUNT(*) as count FROM ai_bookings_success');
    $result = $stmt->fetch();
    echo "   Total bookings: " . $result['count'] . "\n";
    
    if ($result['count'] > 0) {
        $stmt = $conn->query('SELECT id, room_name, topic, meeting_date, meeting_time FROM ai_bookings_success ORDER BY created_at DESC LIMIT 3');
        $bookings = $stmt->fetchAll();
        foreach ($bookings as $booking) {
            echo "   - ID: {$booking['id']}, Room: {$booking['room_name']}, Topic: {$booking['topic']}, Date: {$booking['meeting_date']}, Time: {$booking['meeting_time']}\n";
        }
    }
    
    // Check reservations table
    echo "\n3. Reservations:\n";
    $stmt = $conn->query('SELECT COUNT(*) as count FROM reservations');
    $result = $stmt->fetch();
    echo "   Total reservations: " . $result['count'] . "\n";
    
    if ($result['count'] > 0) {
        $stmt = $conn->query('SELECT id, title, start_time, end_time, status FROM reservations ORDER BY start_time DESC LIMIT 3');
        $reservations = $stmt->fetchAll();
        foreach ($reservations as $reservation) {
            echo "   - ID: {$reservation['id']}, Title: {$reservation['title']}, Start: {$reservation['start_time']}, Status: {$reservation['status']}\n";
        }
    }
    
    echo "\n=== CHECK COMPLETE ===\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>




