<?php
/**
 * Script untuk mengupdate data existing di ai_bookings_success dengan end_time
 */

require_once __DIR__ . '/../backend/config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    echo "=== MENGUPDATE DATA EXISTING DENGAN END_TIME ===\n\n";
    
    // Cek data yang belum memiliki end_time
    $checkQuery = "SELECT COUNT(*) as count FROM ai_bookings_success WHERE end_time IS NULL";
    $stmt = $conn->prepare($checkQuery);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $nullEndTimeCount = $result['count'];
    
    echo "📊 Data dengan end_time NULL: $nullEndTimeCount baris\n\n";
    
    if ($nullEndTimeCount > 0) {
        // Update data yang belum memiliki end_time
        $updateQuery = "UPDATE ai_bookings_success 
                       SET end_time = ADDTIME(meeting_time, SEC_TO_TIME(duration * 60))
                       WHERE end_time IS NULL 
                       AND meeting_time IS NOT NULL 
                       AND duration IS NOT NULL
                       AND meeting_time != ''";
        
        $stmt = $conn->prepare($updateQuery);
        $stmt->execute();
        $affectedRows = $stmt->rowCount();
        
        echo "✅ $affectedRows baris data diperbarui dengan end_time\n";
        
        // Cek data setelah update
        $checkAfterQuery = "SELECT COUNT(*) as count FROM ai_bookings_success WHERE end_time IS NULL";
        $stmt = $conn->prepare($checkAfterQuery);
        $stmt->execute();
        $resultAfter = $stmt->fetch(PDO::FETCH_ASSOC);
        $remainingNull = $resultAfter['count'];
        
        echo "📊 Data dengan end_time NULL setelah update: $remainingNull baris\n";
    } else {
        echo "✅ Semua data sudah memiliki end_time\n";
    }
    
    // Tampilkan sample data
    echo "\n📋 SAMPLE DATA DENGAN END_TIME:\n";
    echo "=" . str_repeat("=", 80) . "\n";
    $sampleQuery = "SELECT id, topic, room_name, meeting_time, end_time, duration, created_at 
                   FROM ai_bookings_success 
                   ORDER BY created_at DESC 
                   LIMIT 5";
    $stmt = $conn->prepare($sampleQuery);
    $stmt->execute();
    $samples = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($samples as $sample) {
        $endTimeDisplay = $sample['end_time'] ? $sample['end_time'] : 'NULL';
        echo "ID: {$sample['id']} | Topic: {$sample['topic']} | Room: {$sample['room_name']}\n";
        echo "     Start: {$sample['meeting_time']} | End: $endTimeDisplay | Duration: {$sample['duration']} min\n";
        echo "     Created: {$sample['created_at']}\n";
        echo "     " . str_repeat("-", 60) . "\n";
    }
    
    echo "\n✅ Script selesai!\n";
    
} catch (PDOException $e) {
    echo "❌ Database Error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "❌ General Error: " . $e->getMessage() . "\n";
}
?>


