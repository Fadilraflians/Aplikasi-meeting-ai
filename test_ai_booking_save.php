<?php
require_once 'config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) {
        throw new Exception("Database connection failed");
    }
    
    echo "<h2>🧪 Test AI Booking Save</h2>";
    
    // Test 1: Check recent AI bookings
    echo "<h3>1. Recent AI Bookings (Last 10):</h3>";
    $stmt = $conn->query("
        SELECT id, user_id, session_id, room_id, room_name, topic, pic, 
               meeting_date, meeting_time, duration, participants, 
               meeting_type, food_order, booking_state, created_at 
        FROM ai_bookings_success 
        ORDER BY created_at DESC 
        LIMIT 10
    ");
    $bookings = $stmt->fetchAll();
    
    if (count($bookings) > 0) {
        echo "<table border='1' style='border-collapse: collapse; width: 100%; font-size: 12px;'>";
        echo "<tr><th>ID</th><th>User ID</th><th>Session</th><th>Room</th><th>Topic</th><th>Date</th><th>Time</th><th>Duration</th><th>Participants</th><th>PIC</th><th>Created</th></tr>";
        
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
            echo "<td>{$booking['user_id']}</td>";
            echo "<td>{$booking['session_id']}</td>";
            echo "<td>{$booking['room_name']}</td>";
            echo "<td>{$booking['topic']}</td>";
            echo "<td>{$meetingDate} {$dateStatus}</td>";
            echo "<td>{$booking['meeting_time']}</td>";
            echo "<td>{$booking['duration']} min</td>";
            echo "<td>{$booking['participants']}</td>";
            echo "<td>{$booking['pic']}</td>";
            echo "<td>{$createdAt}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p>No AI bookings found.</p>";
    }
    
    // Test 2: Check for bookings created today
    echo "<h3>2. Bookings Created Today:</h3>";
    $stmt = $conn->query("
        SELECT COUNT(*) as count 
        FROM ai_bookings_success 
        WHERE DATE(created_at) = CURDATE()
    ");
    $result = $stmt->fetch();
    $todayCount = $result['count'];
    
    echo "<p>Total AI bookings created today: <strong>{$todayCount}</strong></p>";
    
    if ($todayCount > 0) {
        echo "<p style='color: green;'>✅ AI bookings are being saved to database</p>";
    } else {
        echo "<p style='color: red;'>❌ No AI bookings found for today - there might be a save issue</p>";
    }
    
    // Test 3: Check date parsing issues
    echo "<h3>3. Date Parsing Issues:</h3>";
    
    // Check for bookings with today's date that might be "besok" bookings
    $stmt = $conn->query("
        SELECT COUNT(*) as count 
        FROM ai_bookings_success 
        WHERE DATE(created_at) = CURDATE() 
          AND meeting_date = CURDATE()
    ");
    $result = $stmt->fetch();
    $todayTodayCount = $result['count'];
    
    // Check for bookings with tomorrow's date
    $stmt = $conn->query("
        SELECT COUNT(*) as count 
        FROM ai_bookings_success 
        WHERE DATE(created_at) = CURDATE() 
          AND meeting_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
    ");
    $result = $stmt->fetch();
    $todayTomorrowCount = $result['count'];
    
    echo "<p>Bookings created today with today's date: <strong>{$todayTodayCount}</strong></p>";
    echo "<p>Bookings created today with tomorrow's date: <strong>{$todayTomorrowCount}</strong></p>";
    
    if ($todayTodayCount > 0 && $todayTomorrowCount === 0) {
        echo "<p style='color: orange;'>⚠️ Possible date parsing issue - bookings created today have today's date instead of tomorrow</p>";
    } elseif ($todayTomorrowCount > 0) {
        echo "<p style='color: green;'>✅ Date parsing working correctly - bookings created today have tomorrow's date</p>";
    }
    
    // Test 4: Check API endpoint
    echo "<h3>4. API Endpoint Test:</h3>";
    echo "<p>Testing ai-booking-success endpoint:</p>";
    
    // Simulate a test booking
    $testData = [
        'user_id' => 1,
        'session_id' => 'test_' . time(),
        'room_id' => 1,
        'room_name' => 'Test Room',
        'topic' => 'Test Booking',
        'pic' => 'Test User',
        'meeting_date' => date('Y-m-d', strtotime('+1 day')), // Tomorrow
        'meeting_time' => '14:00:00',
        'duration' => 60,
        'participants' => 5,
        'meeting_type' => 'internal',
        'food_order' => 'tidak',
        'booking_state' => 'BOOKED'
    ];
    
    echo "<p>Test data: " . json_encode($testData, JSON_PRETTY_PRINT) . "</p>";
    
    // Test 5: Check for errors in logs
    echo "<h3>5. Error Check:</h3>";
    echo "<p>Check browser console (F12) and server logs for any errors during AI booking process.</p>";
    
    // Test 6: Manual test instructions
    echo "<h3>6. Manual Test Instructions:</h3>";
    echo "<ol>";
    echo "<li>Go to <a href='index.html'>AI Assistant</a></li>";
    echo "<li>Click 'One-Shot Booking'</li>";
    echo "<li>Type: 'Booking ruang meeting besok jam 14:00 untuk test'</li>";
    echo "<li>Complete the booking process</li>";
    echo "<li>Check this page again to see if the booking appears</li>";
    echo "<li>Check browser console for any errors</li>";
    echo "</ol>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}
?>

