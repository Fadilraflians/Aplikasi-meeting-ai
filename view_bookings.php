<?php
require_once 'config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    echo "AI Bookings:\n";
    $stmt = $conn->query('SELECT id, room_name, topic, meeting_date, meeting_time, end_time FROM ai_bookings_success ORDER BY created_at DESC LIMIT 5');
    $bookings = $stmt->fetchAll();
    foreach ($bookings as $booking) {
        echo "- ID: {$booking['id']}, Room: {$booking['room_name']}, Topic: {$booking['topic']}, Date: {$booking['meeting_date']}, Time: {$booking['meeting_time']}, End: {$booking['end_time']}\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
