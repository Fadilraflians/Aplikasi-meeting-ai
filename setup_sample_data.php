<?php
require_once 'config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) {
        throw new Exception("Database connection failed");
    }
    
    echo "<h2>Setting up sample data...</h2>";
    
    // Check if meeting_rooms table exists and has data
    $stmt = $conn->query("SELECT COUNT(*) as count FROM meeting_rooms");
    $result = $stmt->fetch();
    $roomCount = $result['count'];
    
    echo "<p>Current meeting rooms: $roomCount</p>";
    
    if ($roomCount == 0) {
        echo "<p>Inserting sample meeting rooms...</p>";
        
        $sql = "INSERT INTO `meeting_rooms` (`room_name`, `room_number`, `capacity`, `floor`, `building`, `description`, `features`, `is_available`) VALUES
                ('Samudrantha Meeting Room', 'A101', 10, '1', 'Tower A', 'Ruang rapat dengan pemandangan laut', 'Proyektor, Whiteboard, AC, Sound System', 1),
                ('Nusantara Conference Room', 'B201', 20, '2', 'Tower B', 'Ruang konferensi besar dengan fasilitas lengkap', 'Proyektor, Whiteboard, AC, Sound System, Video Conference', 1),
                ('Garuda Discussion Room', 'A202', 6, '2', 'Tower A', 'Ruang diskusi kecil', 'Whiteboard, AC, TV', 1),
                ('Komodo Meeting Room', 'C101', 8, '1', 'Tower C', 'Ruang rapat dengan desain modern', 'Proyektor, Whiteboard, AC', 1),
                ('Borobudur Conference Hall', 'D301', 30, '3', 'Tower D', 'Ruang konferensi besar untuk acara penting', 'Proyektor, Whiteboard, AC, Sound System, Video Conference, Podium', 1),
                ('Cedaya Meeting Room', 'E102', 12, '1', 'Tower E', 'Ruang rapat dengan fasilitas modern', 'Proyektor, Whiteboard, AC, Sound System', 1),
                ('Celebes Meeting Room', 'F201', 15, '2', 'Tower F', 'Ruang rapat dengan pemandangan kota', 'Proyektor, Whiteboard, AC, TV', 1),
                ('Balidwipa Meeting Room', 'G301', 18, '3', 'Tower G', 'Ruang rapat dengan desain elegan', 'Proyektor, Whiteboard, AC, Sound System', 1),
                ('Swarnadwipa Meeting Room', 'H401', 25, '4', 'Tower H', 'Ruang rapat besar dengan fasilitas lengkap', 'Proyektor, Whiteboard, AC, Sound System, Video Conference', 1),
                ('Jawadwipa 1 Meeting Room', 'I501', 8, '5', 'Tower I', 'Ruang rapat kecil untuk diskusi', 'Whiteboard, AC, TV', 1),
                ('Jawadwipa 2 Meeting Room', 'I502', 8, '5', 'Tower I', 'Ruang rapat kecil untuk diskusi', 'Whiteboard, AC, TV', 1),
                ('Kalamant Meeting Room', 'J601', 14, '6', 'Tower J', 'Ruang rapat dengan fasilitas modern', 'Proyektor, Whiteboard, AC, Sound System', 1)
                ON DUPLICATE KEY UPDATE `room_name` = VALUES(`room_name`)";
        
        $conn->exec($sql);
        echo "<p style='color: green;'>✅ Sample meeting rooms inserted successfully!</p>";
    } else {
        echo "<p style='color: blue;'>ℹ️ Meeting rooms already exist ($roomCount rooms)</p>";
    }
    
    // Check if users table has data
    $stmt = $conn->query("SELECT COUNT(*) as count FROM users");
    $result = $stmt->fetch();
    $userCount = $result['count'];
    
    echo "<p>Current users: $userCount</p>";
    
    if ($userCount == 0) {
        echo "<p>Inserting sample user...</p>";
        
        $sql = "INSERT INTO `users` (`username`, `email`, `password`, `full_name`, `role`) VALUES
                ('admin', 'admin@spacio.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 'admin'),
                ('user1', 'user1@spacio.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'User One', 'user')
                ON DUPLICATE KEY UPDATE `username` = VALUES(`username`)";
        
        $conn->exec($sql);
        echo "<p style='color: green;'>✅ Sample users inserted successfully!</p>";
    } else {
        echo "<p style='color: blue;'>ℹ️ Users already exist ($userCount users)</p>";
    }
    
    // Check final counts
    $stmt = $conn->query("SELECT COUNT(*) as count FROM meeting_rooms");
    $result = $stmt->fetch();
    echo "<p><strong>Final meeting rooms count: " . $result['count'] . "</strong></p>";
    
    $stmt = $conn->query("SELECT COUNT(*) as count FROM users");
    $result = $stmt->fetch();
    echo "<p><strong>Final users count: " . $result['count'] . "</strong></p>";
    
    echo "<h3>Test API Endpoints:</h3>";
    echo "<p><a href='backend/api/bookings.php/rooms' target='_blank'>Test Rooms API</a></p>";
    echo "<p><a href='backend/api/bookings.php/ai-success?user_id=1' target='_blank'>Test AI Bookings API</a></p>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}
?>

