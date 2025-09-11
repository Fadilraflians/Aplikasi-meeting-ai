<?php
require_once 'config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) {
        throw new Exception("Database connection failed");
    }
    
    echo "<h2>🔍 Checking Booking Data</h2>";
    
    // Check AI bookings data
    echo "<h3>AI Bookings Data:</h3>";
    $stmt = $conn->query("SELECT id, room_name, topic, meeting_date, meeting_time, duration, created_at FROM ai_bookings_success ORDER BY created_at DESC LIMIT 5");
    $bookings = $stmt->fetchAll();
    
    if (count($bookings) > 0) {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>ID</th><th>Room</th><th>Topic</th><th>Date</th><th>Time</th><th>Duration</th><th>Created</th></tr>";
        foreach ($bookings as $booking) {
            echo "<tr>";
            echo "<td>{$booking['id']}</td>";
            echo "<td>{$booking['room_name']}</td>";
            echo "<td>{$booking['topic']}</td>";
            echo "<td>{$booking['meeting_date']}</td>";
            echo "<td>{$booking['meeting_time']}</td>";
            echo "<td>{$booking['duration']}</td>";
            echo "<td>{$booking['created_at']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p>No AI bookings found.</p>";
    }
    
    // Check reservations data
    echo "<h3>Reservations Data:</h3>";
    $stmt = $conn->query("SELECT id, title, start_time, end_time, created_at FROM reservations ORDER BY created_at DESC LIMIT 5");
    $reservations = $stmt->fetchAll();
    
    if (count($reservations) > 0) {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>ID</th><th>Title</th><th>Start Time</th><th>End Time</th><th>Created</th></tr>";
        foreach ($reservations as $reservation) {
            echo "<tr>";
            echo "<td>{$reservation['id']}</td>";
            echo "<td>{$reservation['title']}</td>";
            echo "<td>{$reservation['start_time']}</td>";
            echo "<td>{$reservation['end_time']}</td>";
            echo "<td>{$reservation['created_at']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p>No reservations found.</p>";
    }
    
    // Test API response
    echo "<h3>API Response Test:</h3>";
    $url = 'http://localhost/aplikasi-meeting-ai/backend/api/bookings.php/ai-success?user_id=1';
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => 'Content-Type: application/json',
            'timeout' => 10
        ]
    ]);
    
    $response = @file_get_contents($url, false, $context);
    if ($response !== false) {
        $data = json_decode($response, true);
        echo "<pre>" . json_encode($data, JSON_PRETTY_PRINT) . "</pre>";
    } else {
        echo "<p style='color: red;'>API not accessible</p>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}
?>

