<?php
require_once 'config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) {
        throw new Exception("Database connection failed");
    }
    
    echo "<h2>🧪 AI Booking End-to-End Test</h2>";
    
    // Test 1: Check database connection
    echo "<h3>1. Database Connection Test:</h3>";
    echo "<p style='color: green;'>✅ Database connection successful</p>";
    
    // Test 2: Check ai_bookings_success table exists
    echo "<h3>2. Table Structure Test:</h3>";
    $stmt = $conn->query("DESCRIBE ai_bookings_success");
    $columns = $stmt->fetchAll();
    
    if (count($columns) > 0) {
        echo "<p style='color: green;'>✅ ai_bookings_success table exists</p>";
        echo "<p>Columns: " . implode(', ', array_column($columns, 'Field')) . "</p>";
    } else {
        echo "<p style='color: red;'>❌ ai_bookings_success table not found</p>";
    }
    
    // Test 3: Check meeting_rooms table
    echo "<h3>3. Meeting Rooms Test:</h3>";
    $stmt = $conn->query("SELECT COUNT(*) as count FROM meeting_rooms");
    $result = $stmt->fetch();
    $roomCount = $result['count'];
    
    if ($roomCount > 0) {
        echo "<p style='color: green;'>✅ Found {$roomCount} meeting rooms</p>";
        
        // Show available rooms
        $stmt = $conn->query("SELECT id, name, capacity FROM meeting_rooms LIMIT 5");
        $rooms = $stmt->fetchAll();
        echo "<p>Available rooms:</p><ul>";
        foreach ($rooms as $room) {
            echo "<li>ID: {$room['id']}, Name: {$room['name']}, Capacity: {$room['capacity']}</li>";
        }
        echo "</ul>";
    } else {
        echo "<p style='color: red;'>❌ No meeting rooms found</p>";
    }
    
    // Test 4: Check recent AI bookings
    echo "<h3>4. Recent AI Bookings Test:</h3>";
    $stmt = $conn->query("
        SELECT id, user_id, session_id, room_name, topic, meeting_date, meeting_time, 
               participants, pic, created_at 
        FROM ai_bookings_success 
        ORDER BY created_at DESC 
        LIMIT 5
    ");
    $bookings = $stmt->fetchAll();
    
    if (count($bookings) > 0) {
        echo "<p style='color: green;'>✅ Found " . count($bookings) . " recent AI bookings</p>";
        echo "<table border='1' style='border-collapse: collapse; width: 100%; font-size: 12px;'>";
        echo "<tr><th>ID</th><th>User</th><th>Room</th><th>Topic</th><th>Date</th><th>Time</th><th>Participants</th><th>Created</th></tr>";
        
        $today = date('Y-m-d');
        $tomorrow = date('Y-m-d', strtotime('+1 day'));
        
        foreach ($bookings as $booking) {
            $meetingDate = $booking['meeting_date'];
            $dateStatus = '';
            if ($meetingDate === $today) {
                $dateStatus = ' <span style="color: orange;">(TODAY)</span>';
            } elseif ($meetingDate === $tomorrow) {
                $dateStatus = ' <span style="color: green;">(TOMORROW)</span>';
            }
            
            echo "<tr>";
            echo "<td>{$booking['id']}</td>";
            echo "<td>{$booking['user_id']}</td>";
            echo "<td>{$booking['room_name']}</td>";
            echo "<td>{$booking['topic']}</td>";
            echo "<td>{$meetingDate}{$dateStatus}</td>";
            echo "<td>{$booking['meeting_time']}</td>";
            echo "<td>{$booking['participants']}</td>";
            echo "<td>{$booking['created_at']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p style='color: orange;'>⚠️ No AI bookings found - this might be normal if no bookings have been made yet</p>";
    }
    
    // Test 5: Test API endpoint
    echo "<h3>5. API Endpoint Test:</h3>";
    echo "<p>Testing ai-booking-success endpoint with sample data:</p>";
    
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
    
    // Test 6: Manual test instructions
    echo "<h3>6. Manual Test Instructions:</h3>";
    echo "<div style='background: #f0f0f0; padding: 15px; border-radius: 5px;'>";
    echo "<h4>Step-by-step test:</h4>";
    echo "<ol>";
    echo "<li>Open <a href='index.html' target='_blank'>AI Assistant</a> in a new tab</li>";
    echo "<li>Click 'One-Shot Booking' button</li>";
    echo "<li>Type: <strong>'Booking ruang meeting besok jam 14:00 untuk test'</strong></li>";
    echo "<li>Complete the booking process</li>";
    echo "<li>Check browser console (F12 → Console) for any errors</li>";
    echo "<li>Refresh this page to see if the booking appears</li>";
    echo "<li>Check if the date shows tomorrow (not today)</li>";
    echo "</ol>";
    echo "</div>";
    
    // Test 7: Debug information
    echo "<h3>7. Debug Information:</h3>";
    echo "<p>Current server time: " . date('Y-m-d H:i:s') . "</p>";
    echo "<p>Server timezone: " . date_default_timezone_get() . "</p>";
    echo "<p>Tomorrow date: " . date('Y-m-d', strtotime('+1 day')) . "</p>";
    
    // Test 8: Check for errors
    echo "<h3>8. Error Check:</h3>";
    echo "<p>If bookings are not being saved, check:</p>";
    echo "<ul>";
    echo "<li>Browser console for JavaScript errors</li>";
    echo "<li>Server error logs</li>";
    echo "<li>Network tab in browser dev tools for failed API calls</li>";
    echo "<li>Database connection and permissions</li>";
    echo "</ul>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}
?>

