<?php
require_once 'config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) {
        throw new Exception("Database connection failed");
    }
    
    echo "<h2>🧪 Testing API Endpoints</h2>";
    
    // Test 1: Check database tables
    echo "<h3>1. Database Tables Check</h3>";
    
    $tables = ['meeting_rooms', 'ai_bookings_success', 'reservations', 'users'];
    foreach ($tables as $table) {
        $stmt = $conn->query("SELECT COUNT(*) as count FROM $table");
        $result = $stmt->fetch();
        echo "<p>$table: " . $result['count'] . " records</p>";
    }
    
    // Test 2: Test Rooms API
    echo "<h3>2. Testing Rooms API</h3>";
    $url = 'http://localhost/aplikasi-meeting-ai/backend/api/bookings.php/rooms';
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
        if (isset($data['status']) && $data['status'] === 'success') {
            echo "<p style='color: green;'>✅ Rooms API working! Found " . count($data['data']) . " rooms</p>";
            if (count($data['data']) > 0) {
                echo "<p>Sample room: " . $data['data'][0]['name'] . " (Capacity: " . $data['data'][0]['capacity'] . ")</p>";
            }
        } else {
            echo "<p style='color: red;'>❌ Rooms API error: " . ($data['message'] ?? 'Unknown error') . "</p>";
        }
    } else {
        echo "<p style='color: red;'>❌ Rooms API not accessible. Error: " . error_get_last()['message'] . "</p>";
    }
    
    // Test 3: Test AI Bookings API
    echo "<h3>3. Testing AI Bookings API</h3>";
    $url = 'http://localhost/aplikasi-meeting-ai/backend/api/bookings.php/ai-success?user_id=1';
    $response = @file_get_contents($url, false, $context);
    if ($response !== false) {
        $data = json_decode($response, true);
        if (isset($data['status']) && $data['status'] === 'success') {
            echo "<p style='color: green;'>✅ AI Bookings API working! Found " . count($data['data']) . " bookings</p>";
            if (count($data['data']) > 0) {
                echo "<p>Sample booking: " . $data['data'][0]['room_name'] . " - " . $data['data'][0]['topic'] . "</p>";
            }
        } else {
            echo "<p style='color: red;'>❌ AI Bookings API error: " . ($data['message'] ?? 'Unknown error') . "</p>";
        }
    } else {
        echo "<p style='color: red;'>❌ AI Bookings API not accessible. Error: " . error_get_last()['message'] . "</p>";
    }
    
    // Test 4: Test User Bookings API
    echo "<h3>4. Testing User Bookings API</h3>";
    $url = 'http://localhost/aplikasi-meeting-ai/backend/api/bookings.php/user?user_id=1';
    $response = @file_get_contents($url, false, $context);
    if ($response !== false) {
        $data = json_decode($response, true);
        if (isset($data['status']) && $data['status'] === 'success') {
            echo "<p style='color: green;'>✅ User Bookings API working! Found " . count($data['data']) . " bookings</p>";
        } else {
            echo "<p style='color: red;'>❌ User Bookings API error: " . ($data['message'] ?? 'Unknown error') . "</p>";
        }
    } else {
        echo "<p style='color: red;'>❌ User Bookings API not accessible. Error: " . error_get_last()['message'] . "</p>";
    }
    
    // Test 5: Direct database query
    echo "<h3>5. Direct Database Query Test</h3>";
    
    // Test meeting rooms
    $stmt = $conn->query("SELECT id, room_name, capacity, is_available FROM meeting_rooms WHERE is_available = 1 LIMIT 3");
    $rooms = $stmt->fetchAll();
    echo "<p>Available rooms from DB: " . count($rooms) . "</p>";
    foreach ($rooms as $room) {
        echo "<p>- " . $room['room_name'] . " (ID: " . $room['id'] . ", Capacity: " . $room['capacity'] . ")</p>";
    }
    
    // Test AI bookings
    $stmt = $conn->query("SELECT id, room_name, topic, meeting_date, meeting_time FROM ai_bookings_success ORDER BY created_at DESC LIMIT 3");
    $bookings = $stmt->fetchAll();
    echo "<p>AI bookings from DB: " . count($bookings) . "</p>";
    foreach ($bookings as $booking) {
        echo "<p>- " . $booking['room_name'] . " - " . $booking['topic'] . " (" . $booking['meeting_date'] . " " . $booking['meeting_time'] . ")</p>";
    }
    
    echo "<h3>6. Recommendations</h3>";
    if (count($rooms) == 0) {
        echo "<p style='color: orange;'>⚠️ No meeting rooms found. Run <a href='setup_sample_data.php'>setup_sample_data.php</a> first.</p>";
    }
    if (count($bookings) == 0) {
        echo "<p style='color: blue;'>ℹ️ No AI bookings found. This is normal if no bookings have been made yet.</p>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}
?>

