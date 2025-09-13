<?php
require_once 'config/database.php';

// Set timezone to WIB
date_default_timezone_set('Asia/Jakarta');

echo "<h1>Create Bookings Table</h1>";

// Get database connection
$pdo = getDBConnection();
if (!$pdo) {
    echo "<p style='color: red;'>Error: Could not connect to database</p>";
    exit;
}

// Create bookings table
$createTableSQL = "
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    room_id INT NOT NULL,
    room_name VARCHAR(255) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    meeting_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    participants INT DEFAULT 0,
    pic VARCHAR(255),
    meeting_type ENUM('internal', 'external') DEFAULT 'internal',
    facilities JSON,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_meeting_date (meeting_date),
    INDEX idx_room_id (room_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
";

try {
    $pdo->exec($createTableSQL);
    echo "<p style='color: green;'>✓ Bookings table created successfully!</p>";
} catch (Exception $e) {
    echo "<p style='color: red;'>Error creating bookings table: " . $e->getMessage() . "</p>";
}

// Check if table exists
try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'bookings'");
    $tableExists = $stmt->fetch();
    
    if ($tableExists) {
        echo "<p style='color: green;'>✓ Bookings table exists and is accessible.</p>";
        
        // Show table structure
        $stmt = $pdo->query("DESCRIBE bookings");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "<h2>Table Structure:</h2>";
        echo "<table border='1' style='border-collapse: collapse;'>";
        echo "<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th></tr>";
        
        foreach ($columns as $column) {
            echo "<tr>";
            echo "<td>{$column['Field']}</td>";
            echo "<td>{$column['Type']}</td>";
            echo "<td>{$column['Null']}</td>";
            echo "<td>{$column['Key']}</td>";
            echo "<td>{$column['Default']}</td>";
            echo "</tr>";
        }
        echo "</table>";
        
    } else {
        echo "<p style='color: red;'>✗ Bookings table does not exist.</p>";
    }
} catch (Exception $e) {
    echo "<p style='color: red;'>Error checking table: " . $e->getMessage() . "</p>";
}

// Insert sample data
$sampleDataSQL = "
INSERT IGNORE INTO bookings (user_id, room_id, room_name, topic, meeting_date, start_time, end_time, participants, pic, meeting_type) VALUES
(1, 1, 'Kalamanthana Meeting Room', 'teess', '2025-09-12', '00:22:00', '01:22:00', 10, 'dil', 'internal'),
(1, 2, 'Garuda Discussion Room', 'tes', '2025-09-12', '01:44:00', '02:44:00', 6, 'tess', 'internal'),
(1, 3, 'Nusantara Meeting Room', 'diskusi', '2025-09-12', '02:53:00', '03:53:00', 8, 'tni', 'internal'),
(1, 4, 'Celebes Meeting Room', 'meet', '2025-09-13', '10:50:00', '11:50:00', 10, 'PRESIDEN', 'external');
";

try {
    $pdo->exec($sampleDataSQL);
    echo "<p style='color: green;'>✓ Sample data inserted successfully!</p>";
} catch (Exception $e) {
    echo "<p style='color: red;'>Error inserting sample data: " . $e->getMessage() . "</p>";
}

// Show current data
try {
    $stmt = $pdo->query("SELECT * FROM bookings ORDER BY meeting_date, start_time");
    $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<h2>Current Bookings Data:</h2>";
    if (empty($bookings)) {
        echo "<p>No bookings found.</p>";
    } else {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>ID</th><th>Topic</th><th>Room</th><th>Date</th><th>Start Time</th><th>End Time</th><th>PIC</th><th>Participants</th></tr>";
        
        foreach ($bookings as $booking) {
            echo "<tr>";
            echo "<td>{$booking['id']}</td>";
            echo "<td>{$booking['topic']}</td>";
            echo "<td>{$booking['room_name']}</td>";
            echo "<td>{$booking['meeting_date']}</td>";
            echo "<td>{$booking['start_time']}</td>";
            echo "<td>{$booking['end_time']}</td>";
            echo "<td>{$booking['pic']}</td>";
            echo "<td>{$booking['participants']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    }
} catch (Exception $e) {
    echo "<p style='color: red;'>Error fetching bookings: " . $e->getMessage() . "</p>";
}
?>

