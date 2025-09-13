<?php
require_once 'config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) {
        throw new Exception("Database connection failed");
    }
    
    echo "<h2>🧪 Test Date Parsing</h2>";
    
    // Test 1: Check current date and time
    echo "<h3>1. Current Date/Time Info:</h3>";
    echo "<p>Server Date: " . date('Y-m-d H:i:s') . "</p>";
    echo "<p>Server Timezone: " . date_default_timezone_get() . "</p>";
    echo "<p>Tomorrow: " . date('Y-m-d', strtotime('+1 day')) . "</p>";
    
    // Test 2: Check recent bookings
    echo "<h3>2. Recent Bookings (Last 5):</h3>";
    $stmt = $conn->query("
        SELECT id, room_name, topic, meeting_date, meeting_time, participants, pic, created_at 
        FROM ai_bookings_success 
        ORDER BY created_at DESC 
        LIMIT 5
    ");
    $bookings = $stmt->fetchAll();
    
    if (count($bookings) > 0) {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>ID</th><th>Room</th><th>Topic</th><th>Meeting Date</th><th>Time</th><th>Created</th><th>Status</th></tr>";
        
        $today = date('Y-m-d');
        $tomorrow = date('Y-m-d', strtotime('+1 day'));
        
        foreach ($bookings as $booking) {
            $meetingDate = $booking['meeting_date'];
            $createdAt = $booking['created_at'];
            
            // Check if meeting date is today or tomorrow
            $status = '';
            if ($meetingDate === $today) {
                $status = '<span style="color: orange;">TODAY</span>';
            } elseif ($meetingDate === $tomorrow) {
                $status = '<span style="color: green;">TOMORROW</span>';
            } elseif ($meetingDate < $today) {
                $status = '<span style="color: red;">PAST</span>';
            } else {
                $status = '<span style="color: blue;">FUTURE</span>';
            }
            
            echo "<tr>";
            echo "<td>{$booking['id']}</td>";
            echo "<td>{$booking['room_name']}</td>";
            echo "<td>{$booking['topic']}</td>";
            echo "<td>{$meetingDate}</td>";
            echo "<td>{$booking['meeting_time']}</td>";
            echo "<td>{$createdAt}</td>";
            echo "<td>{$status}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p>No bookings found.</p>";
    }
    
    // Test 3: Check for potential issues
    echo "<h3>3. Potential Issues:</h3>";
    
    // Check if there are bookings created today with today's date
    $stmt = $conn->query("
        SELECT COUNT(*) as count 
        FROM ai_bookings_success 
        WHERE DATE(created_at) = CURDATE() 
          AND meeting_date = CURDATE()
    ");
    $result = $stmt->fetch();
    $todayBookings = $result['count'];
    
    if ($todayBookings > 0) {
        echo "<p style='color: orange;'>⚠️ Found {$todayBookings} booking(s) created today with today's date (might be 'besok' bookings)</p>";
    } else {
        echo "<p style='color: green;'>✅ No obvious date issues found.</p>";
    }
    
    // Check if there are bookings created today with tomorrow's date
    $stmt = $conn->query("
        SELECT COUNT(*) as count 
        FROM ai_bookings_success 
        WHERE DATE(created_at) = CURDATE() 
          AND meeting_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
    ");
    $result = $stmt->fetch();
    $tomorrowBookings = $result['count'];
    
    if ($tomorrowBookings > 0) {
        echo "<p style='color: green;'>✅ Found {$tomorrowBookings} booking(s) created today with tomorrow's date (correct 'besok' bookings)</p>";
    } else {
        echo "<p style='color: orange;'>⚠️ No bookings found for tomorrow</p>";
    }
    
    // Test 4: JavaScript date parsing simulation
    echo "<h3>4. JavaScript Date Parsing Simulation:</h3>";
    echo "<p>Simulating JavaScript date parsing:</p>";
    
    $now = new DateTime();
    $tomorrow = clone $now;
    $tomorrow->add(new DateInterval('P1D'));
    
    echo "<ul>";
    echo "<li>Current date: " . $now->format('Y-m-d') . "</li>";
    echo "<li>Tomorrow: " . $tomorrow->format('Y-m-d') . "</li>";
    echo "<li>ISO string: " . $tomorrow->format('c') . "</li>";
    echo "<li>ISO date only: " . $tomorrow->format('Y-m-d') . "</li>";
    echo "</ul>";
    
    // Test 5: Check timezone issues
    echo "<h3>5. Timezone Check:</h3>";
    echo "<p>Current timezone: " . date_default_timezone_get() . "</p>";
    echo "<p>Server time: " . date('Y-m-d H:i:s') . "</p>";
    echo "<p>UTC time: " . gmdate('Y-m-d H:i:s') . "</p>";
    
    // Test 6: Manual test
    echo "<h3>6. Manual Test:</h3>";
    echo "<p>Try these test cases:</p>";
    echo "<ol>";
    echo "<li>Go to <a href='index.html'>AI Assistant</a></li>";
    echo "<li>Click 'One-Shot Booking'</li>";
    echo "<li>Type: 'Booking ruang meeting besok jam 14:00 untuk test'</li>";
    echo "<li>Check console logs in browser (F12 → Console)</li>";
    echo "<li>Check if the booking appears with tomorrow's date</li>";
    echo "</ol>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}
?>




