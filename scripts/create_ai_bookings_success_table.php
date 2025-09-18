<?php
/**
 * Script untuk membuat tabel ai_bookings_success
 */

require_once __DIR__ . '/../config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    echo "=== MEMBUAT TABEL AI_BOOKINGS_SUCCESS ===\n\n";
    
    // SQL untuk membuat tabel ai_bookings_success
    $sql = "CREATE TABLE IF NOT EXISTS ai_bookings_success (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        session_id VARCHAR(255),
        room_id INT,
        room_name VARCHAR(255) NOT NULL,
        topic VARCHAR(500) NOT NULL,
        pic VARCHAR(255) NOT NULL,
        participants INT NOT NULL,
        meeting_date VARCHAR(255) NOT NULL,
        meeting_time VARCHAR(255),
        duration INT DEFAULT 60,
        meeting_type VARCHAR(50) DEFAULT 'internal',
        food_order VARCHAR(100) DEFAULT 'tidak',
        booking_state VARCHAR(50) DEFAULT 'BOOKED',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_session_id (session_id),
        INDEX idx_room_id (room_id),
        INDEX idx_booking_state (booking_state)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    
    echo "✅ Tabel ai_bookings_success berhasil dibuat!\n\n";
    
    // Cek struktur tabel
    echo "📋 STRUKTUR TABEL AI_BOOKINGS_SUCCESS:\n";
    echo "=" . str_repeat("=", 50) . "\n";
    $stmt = $conn->prepare("DESCRIBE ai_bookings_success");
    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($columns as $column) {
        echo sprintf(
            "%-20s | %-15s | %-10s | %-10s | %-10s\n",
            $column['Field'],
            $column['Type'],
            $column['Null'],
            $column['Key'],
            $column['Default'] ?? 'NULL'
        );
    }
    
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
}
?>











