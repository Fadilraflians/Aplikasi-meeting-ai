<?php
/**
 * Script untuk menambahkan kolom end_time ke tabel ai_bookings_success
 */

require_once __DIR__ . '/../backend/config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    echo "=== MENAMBAHKAN KOLOM END_TIME KE AI_BOOKINGS_SUCCESS ===\n\n";
    
    // Cek apakah kolom end_time sudah ada
    $checkColumn = "SHOW COLUMNS FROM ai_bookings_success LIKE 'end_time'";
    $stmt = $conn->prepare($checkColumn);
    $stmt->execute();
    $columnExists = $stmt->fetch();
    
    if ($columnExists) {
        echo "✅ Kolom end_time sudah ada di tabel ai_bookings_success\n";
    } else {
        // Tambahkan kolom end_time
        $addColumn = "ALTER TABLE ai_bookings_success ADD COLUMN end_time TIME NULL AFTER meeting_time";
        $stmt = $conn->prepare($addColumn);
        $stmt->execute();
        
        echo "✅ Kolom end_time berhasil ditambahkan ke tabel ai_bookings_success\n";
    }
    
    // Update data existing dengan menghitung end_time dari meeting_time + duration
    echo "\n🔄 Memperbarui data existing...\n";
    
    $updateQuery = "UPDATE ai_bookings_success 
                   SET end_time = ADDTIME(meeting_time, SEC_TO_TIME(duration * 60))
                   WHERE end_time IS NULL AND meeting_time IS NOT NULL AND duration IS NOT NULL";
    
    $stmt = $conn->prepare($updateQuery);
    $stmt->execute();
    $affectedRows = $stmt->rowCount();
    
    echo "✅ $affectedRows baris data diperbarui dengan end_time\n";
    
    // Cek struktur tabel setelah perubahan
    echo "\n📋 STRUKTUR TABEL AI_BOOKINGS_SUCCESS SETELAH PERUBAHAN:\n";
    echo "=" . str_repeat("=", 50) . "\n";
    $stmt = $conn->prepare("DESCRIBE ai_bookings_success");
    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($columns as $column) {
        echo "  {$column['Field']}: {$column['Type']}";
        if ($column['Key'] === 'PRI') echo " [PRI]";
        if ($column['Null'] === 'NO') echo " (NOT NULL)";
        if ($column['Null'] === 'YES') echo " (NULL)";
        if ($column['Default'] !== null) echo " DEFAULT {$column['Default']}";
        echo "\n";
    }
    
    // Cek beberapa data sample
    echo "\n📊 SAMPLE DATA DENGAN END_TIME:\n";
    echo "=" . str_repeat("=", 50) . "\n";
    $stmt = $conn->prepare("SELECT id, topic, meeting_time, end_time, duration FROM ai_bookings_success ORDER BY created_at DESC LIMIT 5");
    $stmt->execute();
    $samples = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($samples as $sample) {
        echo "ID: {$sample['id']} | Topic: {$sample['topic']} | Start: {$sample['meeting_time']} | End: {$sample['end_time']} | Duration: {$sample['duration']} min\n";
    }
    
    echo "\n✅ Script selesai!\n";
    
} catch (PDOException $e) {
    echo "❌ Database Error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "❌ General Error: " . $e->getMessage() . "\n";
}
?>



