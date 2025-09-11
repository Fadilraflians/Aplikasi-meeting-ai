<?php
require_once 'config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    echo "<h2>Database Debug Information</h2>";
    
    // Check meeting_rooms table
    echo "<h3>1. Meeting Rooms</h3>";
    $stmt = $conn->query('SELECT COUNT(*) as count FROM meeting_rooms');
    $result = $stmt->fetch();
    echo "<p>Total rooms: " . $result['count'] . "</p>";
    
    if ($result['count'] > 0) {
        $stmt = $conn->query('SELECT id, room_name, capacity, is_available FROM meeting_rooms LIMIT 5');
        $rooms = $stmt->fetchAll();
        echo "<table border='1'><tr><th>ID</th><th>Name</th><th>Capacity</th><th>Available</th></tr>";
        foreach ($rooms as $room) {
            echo "<tr><td>{$room['id']}</td><td>{$room['room_name']}</td><td>{$room['capacity']}</td><td>{$room['is_available']}</td></tr>";
        }
        echo "</table>";
    }
    
    // Check ai_bookings_success table
    echo "<h3>2. AI Bookings Success</h3>";
    $stmt = $conn->query('SELECT COUNT(*) as count FROM ai_bookings_success');
    $result = $stmt->fetch();
    echo "<p>Total bookings: " . $result['count'] . "</p>";
    
    if ($result['count'] > 0) {
        $stmt = $conn->query('SELECT id, room_name, topic, meeting_date, meeting_time FROM ai_bookings_success ORDER BY created_at DESC LIMIT 3');
        $bookings = $stmt->fetchAll();
        echo "<table border='1'><tr><th>ID</th><th>Room</th><th>Topic</th><th>Date</th><th>Time</th></tr>";
        foreach ($bookings as $booking) {
            echo "<tr><td>{$booking['id']}</td><td>{$booking['room_name']}</td><td>{$booking['topic']}</td><td>{$booking['meeting_date']}</td><td>{$booking['meeting_time']}</td></tr>";
        }
        echo "</table>";
    }
    
    // Check reservations table
    echo "<h3>3. Reservations</h3>";
    $stmt = $conn->query('SELECT COUNT(*) as count FROM reservations');
    $result = $stmt->fetch();
    echo "<p>Total reservations: " . $result['count'] . "</p>";
    
    if ($result['count'] > 0) {
        $stmt = $conn->query('SELECT id, title, start_time, end_time, status FROM reservations ORDER BY start_time DESC LIMIT 3');
        $reservations = $stmt->fetchAll();
        echo "<table border='1'><tr><th>ID</th><th>Title</th><th>Start Time</th><th>End Time</th><th>Status</th></tr>";
        foreach ($reservations as $reservation) {
            echo "<tr><td>{$reservation['id']}</td><td>{$reservation['title']}</td><td>{$reservation['start_time']}</td><td>{$reservation['end_time']}</td><td>{$reservation['status']}</td></tr>";
        }
        echo "</table>";
    }
    
    // Test API endpoints
    echo "<h3>4. API Endpoints Test</h3>";
    echo "<p><a href='backend/api/bookings.php/rooms' target='_blank'>Test Rooms API</a></p>";
    echo "<p><a href='backend/api/bookings.php/ai-success?user_id=1' target='_blank'>Test AI Bookings API</a></p>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}
?>

