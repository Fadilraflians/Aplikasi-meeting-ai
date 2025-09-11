<?php
require_once 'config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) {
        throw new Exception("Database connection failed");
    }
    
    echo "<h2>🧪 Test One-Shot Booking</h2>";
    
    // Test 1: Check AI bookings table
    echo "<h3>1. AI Bookings Table:</h3>";
    $stmt = $conn->query("SELECT id, room_name, topic, meeting_date, meeting_time, duration, participants, pic, created_at FROM ai_bookings_success ORDER BY created_at DESC LIMIT 5");
    $aiBookings = $stmt->fetchAll();
    
    if (count($aiBookings) > 0) {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>ID</th><th>Room</th><th>Topic</th><th>Date</th><th>Time</th><th>Duration</th><th>Participants</th><th>PIC</th><th>Created</th></tr>";
        foreach ($aiBookings as $booking) {
            echo "<tr>";
            echo "<td>{$booking['id']}</td>";
            echo "<td>{$booking['room_name']}</td>";
            echo "<td>{$booking['topic']}</td>";
            echo "<td>{$booking['meeting_date']}</td>";
            echo "<td>{$booking['meeting_time']}</td>";
            echo "<td>{$booking['duration']} min</td>";
            echo "<td>{$booking['participants']}</td>";
            echo "<td>{$booking['pic']}</td>";
            echo "<td>{$booking['created_at']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p>No AI bookings found.</p>";
    }
    
    // Test 2: Check if time format is correct
    echo "<h3>2. Time Format Check:</h3>";
    $stmt = $conn->query("SELECT meeting_time, duration FROM ai_bookings_success WHERE meeting_time IS NOT NULL ORDER BY created_at DESC LIMIT 3");
    $timeData = $stmt->fetchAll();
    
    if (count($timeData) > 0) {
        echo "<p>Recent time formats:</p>";
        echo "<ul>";
        foreach ($timeData as $time) {
            $timeStr = $time['meeting_time'];
            $duration = $time['duration'];
            echo "<li>Time: <strong>{$timeStr}</strong> (Duration: {$duration} min)</li>";
        }
        echo "</ul>";
    }
    
    // Test 3: Check for any time ranges in meeting_time
    echo "<h3>3. Time Range Check:</h3>";
    $stmt = $conn->query("SELECT meeting_time FROM ai_bookings_success WHERE meeting_time LIKE '%-%' ORDER BY created_at DESC LIMIT 5");
    $rangeData = $stmt->fetchAll();
    
    if (count($rangeData) > 0) {
        echo "<p style='color: orange;'>⚠️ Found time ranges in meeting_time:</p>";
        echo "<ul>";
        foreach ($rangeData as $range) {
            echo "<li>{$range['meeting_time']}</li>";
        }
        echo "</ul>";
    } else {
        echo "<p style='color: green;'>✅ No time ranges found - all times are start times only.</p>";
    }
    
    // Test 4: Check meeting rooms
    echo "<h3>4. Available Meeting Rooms:</h3>";
    $stmt = $conn->query("SELECT id, room_name, image_url FROM meeting_rooms ORDER BY room_name");
    $rooms = $stmt->fetchAll();
    
    if (count($rooms) > 0) {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>ID</th><th>Room Name</th><th>Image URL</th></tr>";
        foreach ($rooms as $room) {
            echo "<tr>";
            echo "<td>{$room['id']}</td>";
            echo "<td>{$room['room_name']}</td>";
            echo "<td>{$room['image_url']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p>No meeting rooms found.</p>";
    }
    
    echo "<h3>5. Test Instructions:</h3>";
    echo "<p>1. <a href='index.html'>Go to AI Assistant</a></p>";
    echo "<p>2. Click 'One-Shot Booking'</p>";
    echo "<p>3. Try these examples:</p>";
    echo "<ul>";
    echo "<li>\"Booking ruang meeting besok jam 09:00 untuk presentasi client\"</li>";
    echo "<li>\"Pesan Auditorium Jawadwipa 2 lusa jam 14:00 dengan 10 orang\"</li>";
    echo "<li>\"Reservasi ruang 1 hari ini jam 16:00 untuk rapat tim\"</li>";
    echo "</ul>";
    echo "<p>4. Check if time shows only start time (e.g., 09:00) not range (09:00-11:00)</p>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}
?>

