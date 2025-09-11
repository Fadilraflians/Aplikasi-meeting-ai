<?php
/**
 * Script untuk menghapus tabel ai_booking_agent
 */

require_once __DIR__ . '/../backend/config/database.php';

echo "=== MENGHAPUS TABEL AI_BOOKING_AGENT ===\n\n";

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Drop tabel ai_booking_agent
    $query = "DROP TABLE IF EXISTS ai_booking_agent";
    $stmt = $db->prepare($query);
    
    if ($stmt->execute()) {
        echo "✅ Tabel ai_booking_agent berhasil dihapus!\n";
    } else {
        echo "❌ Gagal menghapus tabel ai_booking_agent\n";
    }
    
    // Verifikasi tabel sudah dihapus
    $checkQuery = "SHOW TABLES LIKE 'ai_booking_agent'";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->execute();
    $result = $checkStmt->fetch();
    
    if (!$result) {
        echo "✅ Verifikasi: Tabel ai_booking_agent sudah tidak ada\n";
    } else {
        echo "❌ Verifikasi: Tabel ai_booking_agent masih ada\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n=== SELESAI ===\n";
?>




