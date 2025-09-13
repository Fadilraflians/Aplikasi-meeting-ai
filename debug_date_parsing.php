<?php
require_once 'config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) {
        throw new Exception("Database connection failed");
    }
    
    echo "<h2>🐛 Debug Date Parsing</h2>";
    
    // Check current date
    echo "<h3>1. Current Date Info:</h3>";
    echo "<p>Server Date: " . date('Y-m-d H:i:s') . "</p>";
    echo "<p>Server Timezone: " . date_default_timezone_get() . "</p>";
    
    // Check recent AI bookings
    echo "<h3>2. Recent AI Bookings (Last 10):</h3>";
    $stmt = $conn->query("
        SELECT id, room_name, topic, meeting_date, meeting_time, participants, pic, created_at 
        FROM ai_bookings_success 
        ORDER BY created_at DESC 
        LIMIT 10
    ");
    $bookings = $stmt->fetchAll();
    
    if (count($bookings) > 0) {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>ID</th><th>Room</th><th>Topic</th><th>Meeting Date</th><th>Time</th><th>Participants</th><th>PIC</th><th>Created</th><th>Date Status</th></tr>";
        
        $today = date('Y-m-d');
        $tomorrow = date('Y-m-d', strtotime('+1 day'));
        
        foreach ($bookings as $booking) {
            $meetingDate = $booking['meeting_date'];
            $createdAt = $booking['created_at'];
            
            // Check if meeting date is today or tomorrow
            $dateStatus = '';
            if ($meetingDate === $today) {
                $dateStatus = '<span style="color: orange;">TODAY</span>';
            } elseif ($meetingDate === $tomorrow) {
                $dateStatus = '<span style="color: green;">TOMORROW</span>';
            } elseif ($meetingDate < $today) {
                $dateStatus = '<span style="color: red;">PAST</span>';
            } else {
                $dateStatus = '<span style="color: blue;">FUTURE</span>';
            }
            
            echo "<tr>";
            echo "<td>{$booking['id']}</td>";
            echo "<td>{$booking['room_name']}</td>";
            echo "<td>{$booking['topic']}</td>";
            echo "<td>{$meetingDate}</td>";
            echo "<td>{$booking['meeting_time']}</td>";
            echo "<td>{$booking['participants']}</td>";
            echo "<td>{$booking['pic']}</td>";
            echo "<td>{$createdAt}</td>";
            echo "<td>{$dateStatus}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p>No AI bookings found.</p>";
    }
    
    // Check for bookings with "besok" in topic or other fields
    echo "<h3>3. Bookings with 'besok' keyword:</h3>";
    $stmt = $conn->query("
        SELECT id, room_name, topic, meeting_date, meeting_time, participants, pic, created_at 
        FROM ai_bookings_success 
        WHERE LOWER(topic) LIKE '%besok%' 
           OR LOWER(room_name) LIKE '%besok%'
        ORDER BY created_at DESC 
        LIMIT 5
    ");
    $besokBookings = $stmt->fetchAll();
    
    if (count($besokBookings) > 0) {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>ID</th><th>Room</th><th>Topic</th><th>Meeting Date</th><th>Time</th><th>Created</th></tr>";
        foreach ($besokBookings as $booking) {
            echo "<tr>";
            echo "<td>{$booking['id']}</td>";
            echo "<td>{$booking['room_name']}</td>";
            echo "<td>{$booking['topic']}</td>";
            echo "<td>{$booking['meeting_date']}</td>";
            echo "<td>{$booking['meeting_time']}</td>";
            echo "<td>{$booking['created_at']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p>No bookings with 'besok' keyword found.</p>";
    }
    
    // Test date parsing logic
    echo "<h3>4. Date Parsing Test:</h3>";
    echo "<p>Testing JavaScript-like date parsing:</p>";
    
    $testDates = [
        'besok' => date('Y-m-d', strtotime('+1 day')),
        'hari ini' => date('Y-m-d'),
        'lusa' => date('Y-m-d', strtotime('+2 days')),
        'today' => date('Y-m-d'),
        'tomorrow' => date('Y-m-d', strtotime('+1 day'))
    ];
    
    echo "<ul>";
    foreach ($testDates as $input => $expected) {
        echo "<li><strong>'{$input}'</strong> → {$expected}</li>";
    }
    echo "</ul>";
    
    // Check if there are any bookings created today but with today's date instead of tomorrow
    echo "<h3>5. Potential Date Issues:</h3>";
    $stmt = $conn->query("
        SELECT id, room_name, topic, meeting_date, meeting_time, participants, pic, created_at 
        FROM ai_bookings_success 
        WHERE DATE(created_at) = CURDATE() 
          AND meeting_date = CURDATE()
        ORDER BY created_at DESC 
        LIMIT 5
    ");
    $todayBookings = $stmt->fetchAll();
    
    if (count($todayBookings) > 0) {
        echo "<p style='color: orange;'>⚠️ Found bookings created today with today's date (might be 'besok' bookings):</p>";
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>ID</th><th>Room</th><th>Topic</th><th>Meeting Date</th><th>Time</th><th>Created</th></tr>";
        foreach ($todayBookings as $booking) {
            echo "<tr>";
            echo "<td>{$booking['id']}</td>";
            echo "<td>{$booking['room_name']}</td>";
            echo "<td>{$booking['topic']}</td>";
            echo "<td>{$booking['meeting_date']}</td>";
            echo "<td>{$booking['meeting_time']}</td>";
            echo "<td>{$booking['created_at']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p style='color: green;'>✅ No obvious date issues found.</p>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}
?>




