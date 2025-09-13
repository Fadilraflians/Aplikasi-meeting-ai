<?php
/**
 * Script untuk mengecek data di tabel ai_bookings_success
 */

require_once __DIR__ . '/../backend/config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    echo "=== CEK DATA AI_BOOKINGS_SUCCESS ===\n\n";
    
    // Cek jumlah data
    $countQuery = "SELECT COUNT(*) as count FROM ai_bookings_success";
    $stmt = $conn->prepare($countQuery);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $totalCount = $result['count'];
    
    echo "📊 Total data di ai_bookings_success: $totalCount baris\n\n";
    
    if ($totalCount > 0) {
        // Tampilkan semua data
        $selectQuery = "SELECT id, topic, room_name, meeting_time, end_time, duration, created_at 
                       FROM ai_bookings_success 
                       ORDER BY created_at DESC";
        $stmt = $conn->prepare($selectQuery);
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "📋 SEMUA DATA:\n";
        echo "=" . str_repeat("=", 80) . "\n";
        
        foreach ($data as $row) {
            $endTimeDisplay = $row['end_time'] ? $row['end_time'] : 'NULL';
            echo "ID: {$row['id']} | Topic: {$row['topic']} | Room: {$row['room_name']}\n";
            echo "     Start: {$row['meeting_time']} | End: $endTimeDisplay | Duration: {$row['duration']} min\n";
            echo "     Created: {$row['created_at']}\n";
            echo "     " . str_repeat("-", 60) . "\n";
        }
    } else {
        echo "❌ Tidak ada data di tabel ai_bookings_success\n";
    }
    
    echo "\n✅ Script selesai!\n";
    
} catch (PDOException $e) {
    echo "❌ Database Error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "❌ General Error: " . $e->getMessage() . "\n";
}
?>


