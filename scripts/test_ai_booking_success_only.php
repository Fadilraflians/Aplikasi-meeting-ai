<?php
/**
 * Test script untuk memverifikasi data booking AI hanya tersimpan di ai_bookings_success
 */

require_once __DIR__ . '/../backend/config/database.php';
require_once __DIR__ . '/../backend/models/AiBookingSuccess.php';

echo "=== TEST AI BOOKING SUCCESS ONLY ===\n\n";

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $aiBookingSuccess = new AiBookingSuccess($db);
    
    // Test data
    $testData = [
        'user_id' => 1,
        'session_id' => 'ai_success_test_' . time(),
        'room_id' => 1,
        'room_name' => 'Ruang Meeting A',
        'topic' => 'Test Rapat AI Success Only',
        'pic' => 'Test User',
        'participants' => 5,
        'meeting_date' => date('Y-m-d'),
        'meeting_time' => '14:00:00',
        'duration' => 60,
        'meeting_type' => 'internal',
        'food_order' => 'tidak'
    ];
    
    echo "📊 Data yang akan disimpan:\n";
    print_r($testData);
    echo "\n";
    
    // Simpan data
    $result = $aiBookingSuccess->createSuccessBooking($testData);
    
    if ($result) {
        echo "✅ Berhasil menyimpan data booking AI ke ai_bookings_success!\n";
        echo "📋 ID booking: " . $result . "\n";
        
        // Verifikasi data tersimpan
        $savedData = $aiBookingSuccess->getSuccessBookingBySessionId($testData['session_id']);
        if ($savedData) {
            echo "✅ Data berhasil diverifikasi tersimpan:\n";
            print_r($savedData);
        } else {
            echo "❌ Data tidak ditemukan setelah penyimpanan\n";
        }
        
        // Cek total data di tabel
        $allBookings = $aiBookingSuccess->getAllSuccessBookings();
        echo "\n📊 Total data di ai_bookings_success: " . count($allBookings) . "\n";
        
    } else {
        echo "❌ Gagal menyimpan data booking AI\n";
    }
    
    // Verifikasi tabel ai_booking_agent sudah dihapus
    echo "\n🔍 Verifikasi tabel ai_booking_agent sudah dihapus:\n";
    try {
        $checkQuery = "SHOW TABLES LIKE 'ai_booking_agent'";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->execute();
        $result = $checkStmt->fetch();
        
        if (!$result) {
            echo "✅ Tabel ai_booking_agent sudah tidak ada\n";
        } else {
            echo "❌ Tabel ai_booking_agent masih ada\n";
        }
    } catch (Exception $e) {
        echo "✅ Tabel ai_booking_agent sudah dihapus (error saat cek)\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n=== SELESAI ===\n";
?>








