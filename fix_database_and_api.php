<?php
require_once 'config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) {
        throw new Exception("Database connection failed");
    }
    
    echo "<h2>🔧 Fixing Database and API Issues</h2>";
    
    // 1. Ensure meeting_rooms table has data
    echo "<h3>1. Setting up Meeting Rooms</h3>";
    $stmt = $conn->query("SELECT COUNT(*) as count FROM meeting_rooms");
    $result = $stmt->fetch();
    $roomCount = $result['count'];
    
    if ($roomCount == 0) {
        echo "<p>Inserting sample meeting rooms...</p>";
        
        $sql = "INSERT INTO `meeting_rooms` (`room_name`, `room_number`, `capacity`, `floor`, `building`, `description`, `features`, `is_available`, `is_maintenance`) VALUES
                ('Samudrantha Meeting Room', 'A101', 10, '1', 'Tower A', 'Ruang rapat dengan pemandangan laut', 'Proyektor, Whiteboard, AC, Sound System', 1, 0),
                ('Nusantara Conference Room', 'B201', 20, '2', 'Tower B', 'Ruang konferensi besar dengan fasilitas lengkap', 'Proyektor, Whiteboard, AC, Sound System, Video Conference', 1, 0),
                ('Garuda Discussion Room', 'A202', 6, '2', 'Tower A', 'Ruang diskusi kecil', 'Whiteboard, AC, TV', 1, 0),
                ('Komodo Meeting Room', 'C101', 8, '1', 'Tower C', 'Ruang rapat dengan desain modern', 'Proyektor, Whiteboard, AC', 1, 0),
                ('Borobudur Conference Hall', 'D301', 30, '3', 'Tower D', 'Ruang konferensi besar untuk acara penting', 'Proyektor, Whiteboard, AC, Sound System, Video Conference, Podium', 1, 0),
                ('Cedaya Meeting Room', 'E102', 12, '1', 'Tower E', 'Ruang rapat dengan fasilitas modern', 'Proyektor, Whiteboard, AC, Sound System', 1, 0),
                ('Celebes Meeting Room', 'F201', 15, '2', 'Tower F', 'Ruang rapat dengan pemandangan kota', 'Proyektor, Whiteboard, AC, TV', 1, 0),
                ('Balidwipa Meeting Room', 'G301', 18, '3', 'Tower G', 'Ruang rapat dengan desain elegan', 'Proyektor, Whiteboard, AC, Sound System', 1, 0),
                ('Swarnadwipa Meeting Room', 'H401', 25, '4', 'Tower H', 'Ruang rapat besar dengan fasilitas lengkap', 'Proyektor, Whiteboard, AC, Sound System, Video Conference', 1, 0),
                ('Jawadwipa 1 Meeting Room', 'I501', 8, '5', 'Tower I', 'Ruang rapat kecil untuk diskusi', 'Whiteboard, AC, TV', 1, 0),
                ('Jawadwipa 2 Meeting Room', 'I502', 8, '5', 'Tower I', 'Ruang rapat kecil untuk diskusi', 'Whiteboard, AC, TV', 1, 0),
                ('Kalamant Meeting Room', 'J601', 14, '6', 'Tower J', 'Ruang rapat dengan fasilitas modern', 'Proyektor, Whiteboard, AC, Sound System', 1, 0)";
        
        $conn->exec($sql);
        echo "<p style='color: green;'>✅ Sample meeting rooms inserted successfully!</p>";
    } else {
        echo "<p style='color: blue;'>ℹ️ Meeting rooms already exist ($roomCount rooms)</p>";
    }
    
    // 2. Ensure users table has data
    echo "<h3>2. Setting up Users</h3>";
    $stmt = $conn->query("SELECT COUNT(*) as count FROM users");
    $result = $stmt->fetch();
    $userCount = $result['count'];
    
    if ($userCount == 0) {
        echo "<p>Inserting sample users...</p>";
        
        $sql = "INSERT INTO `users` (`username`, `email`, `password`, `full_name`, `role`) VALUES
                ('admin', 'admin@spacio.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 'admin'),
                ('user1', 'user1@spacio.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'User One', 'user')";
        
        $conn->exec($sql);
        echo "<p style='color: green;'>✅ Sample users inserted successfully!</p>";
    } else {
        echo "<p style='color: blue;'>ℹ️ Users already exist ($userCount users)</p>";
    }
    
    // 3. Test API endpoints
    echo "<h3>3. Testing API Endpoints</h3>";
    
    // Test rooms API
    echo "<h4>Testing Rooms API:</h4>";
    $url = 'http://localhost/aplikasi-meeting-ai/backend/api/bookings.php/rooms';
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => 'Content-Type: application/json'
        ]
    ]);
    
    $response = @file_get_contents($url, false, $context);
    if ($response !== false) {
        $data = json_decode($response, true);
        if (isset($data['status']) && $data['status'] === 'success') {
            echo "<p style='color: green;'>✅ Rooms API working! Found " . count($data['data']) . " rooms</p>";
        } else {
            echo "<p style='color: red;'>❌ Rooms API error: " . ($data['message'] ?? 'Unknown error') . "</p>";
        }
    } else {
        echo "<p style='color: red;'>❌ Rooms API not accessible</p>";
    }
    
    // Test AI bookings API
    echo "<h4>Testing AI Bookings API:</h4>";
    $url = 'http://localhost/aplikasi-meeting-ai/backend/api/bookings.php/ai-success?user_id=1';
    $response = @file_get_contents($url, false, $context);
    if ($response !== false) {
        $data = json_decode($response, true);
        if (isset($data['status']) && $data['status'] === 'success') {
            echo "<p style='color: green;'>✅ AI Bookings API working! Found " . count($data['data']) . " bookings</p>";
        } else {
            echo "<p style='color: red;'>❌ AI Bookings API error: " . ($data['message'] ?? 'Unknown error') . "</p>";
        }
    } else {
        echo "<p style='color: red;'>❌ AI Bookings API not accessible</p>";
    }
    
    // 4. Show final status
    echo "<h3>4. Final Status</h3>";
    $stmt = $conn->query("SELECT COUNT(*) as count FROM meeting_rooms WHERE is_available = 1");
    $result = $stmt->fetch();
    echo "<p><strong>Available Meeting Rooms: " . $result['count'] . "</strong></p>";
    
    $stmt = $conn->query("SELECT COUNT(*) as count FROM ai_bookings_success");
    $result = $stmt->fetch();
    echo "<p><strong>AI Bookings: " . $result['count'] . "</strong></p>";
    
    $stmt = $conn->query("SELECT COUNT(*) as count FROM reservations");
    $result = $stmt->fetch();
    echo "<p><strong>Reservations: " . $result['count'] . "</strong></p>";
    
    echo "<h3>5. Next Steps</h3>";
    echo "<p>1. <a href='backend/api/bookings.php/rooms' target='_blank'>Test Rooms API directly</a></p>";
    echo "<p>2. <a href='backend/api/bookings.php/ai-success?user_id=1' target='_blank'>Test AI Bookings API directly</a></p>";
    echo "<p>3. <a href='index.html' target='_blank'>Go to main application</a></p>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}
?>




