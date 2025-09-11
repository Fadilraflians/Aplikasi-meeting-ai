<?php
require_once 'config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) {
        throw new Exception("Database connection failed");
    }
    
    echo "<h2>🔍 Checking for Duplicate Bookings</h2>";
    
    // Check AI bookings
    echo "<h3>1. AI Bookings (ai_bookings_success):</h3>";
    $stmt = $conn->query("SELECT id, room_name, topic, meeting_date, meeting_time, participants, created_at FROM ai_bookings_success ORDER BY created_at DESC");
    $aiBookings = $stmt->fetchAll();
    
    if (count($aiBookings) > 0) {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>ID</th><th>Room</th><th>Topic</th><th>Date</th><th>Time</th><th>Participants</th><th>Created</th></tr>";
        foreach ($aiBookings as $booking) {
            echo "<tr>";
            echo "<td>{$booking['id']}</td>";
            echo "<td>{$booking['room_name']}</td>";
            echo "<td>{$booking['topic']}</td>";
            echo "<td>{$booking['meeting_date']}</td>";
            echo "<td>{$booking['meeting_time']}</td>";
            echo "<td>{$booking['participants']}</td>";
            echo "<td>{$booking['created_at']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p>No AI bookings found.</p>";
    }
    
    // Check for duplicates in AI bookings
    echo "<h3>2. Duplicate Check in AI Bookings:</h3>";
    $stmt = $conn->query("
        SELECT room_name, topic, meeting_date, meeting_time, participants, COUNT(*) as count 
        FROM ai_bookings_success 
        GROUP BY room_name, topic, meeting_date, meeting_time, participants 
        HAVING COUNT(*) > 1
    ");
    $duplicates = $stmt->fetchAll();
    
    if (count($duplicates) > 0) {
        echo "<p style='color: red;'>❌ Found duplicates in AI bookings:</p>";
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>Room</th><th>Topic</th><th>Date</th><th>Time</th><th>Participants</th><th>Count</th></tr>";
        foreach ($duplicates as $dup) {
            echo "<tr>";
            echo "<td>{$dup['room_name']}</td>";
            echo "<td>{$dup['topic']}</td>";
            echo "<td>{$dup['meeting_date']}</td>";
            echo "<td>{$dup['meeting_time']}</td>";
            echo "<td>{$dup['participants']}</td>";
            echo "<td style='color: red;'>{$dup['count']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p style='color: green;'>✅ No duplicates found in AI bookings.</p>";
    }
    
    // Check reservations
    echo "<h3>3. Reservations (reservations table):</h3>";
    $stmt = $conn->query("SELECT id, title, start_time, end_time, attendees, created_at FROM reservations ORDER BY created_at DESC");
    $reservations = $stmt->fetchAll();
    
    if (count($reservations) > 0) {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>ID</th><th>Title</th><th>Start Time</th><th>End Time</th><th>Attendees</th><th>Created</th></tr>";
        foreach ($reservations as $reservation) {
            echo "<tr>";
            echo "<td>{$reservation['id']}</td>";
            echo "<td>{$reservation['title']}</td>";
            echo "<td>{$reservation['start_time']}</td>";
            echo "<td>{$reservation['end_time']}</td>";
            echo "<td>{$reservation['attendees']}</td>";
            echo "<td>{$reservation['created_at']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p>No reservations found.</p>";
    }
    
    // Check for duplicates in reservations
    echo "<h3>4. Duplicate Check in Reservations:</h3>";
    $stmt = $conn->query("
        SELECT title, start_time, end_time, attendees, COUNT(*) as count 
        FROM reservations 
        GROUP BY title, start_time, end_time, attendees 
        HAVING COUNT(*) > 1
    ");
    $dupReservations = $stmt->fetchAll();
    
    if (count($dupReservations) > 0) {
        echo "<p style='color: red;'>❌ Found duplicates in reservations:</p>";
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>Title</th><th>Start Time</th><th>End Time</th><th>Attendees</th><th>Count</th></tr>";
        foreach ($dupReservations as $dup) {
            echo "<tr>";
            echo "<td>{$dup['title']}</td>";
            echo "<td>{$dup['start_time']}</td>";
            echo "<td>{$dup['end_time']}</td>";
            echo "<td>{$dup['attendees']}</td>";
            echo "<td style='color: red;'>{$dup['count']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p style='color: green;'>✅ No duplicates found in reservations.</p>";
    }
    
    // Check meeting rooms
    echo "<h3>5. Meeting Rooms:</h3>";
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
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}
?>

