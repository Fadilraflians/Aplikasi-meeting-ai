<?php
/**
 * Test script untuk memverifikasi akurasi data user input
 */

require_once __DIR__ . '/../backend/config/database.php';
require_once __DIR__ . '/../backend/models/AiBookingSuccess.php';

echo "=== TEST AKURASI DATA USER INPUT ===\n\n";

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $aiBookingSuccess = new AiBookingSuccess($db);
    
    // Test data dengan berbagai meeting type dan waktu
    $testCases = [
        [
            'name' => 'Test External Meeting',
            'data' => [
                'user_id' => 1,
                'session_id' => 'test_external_' . time(),
                'room_id' => 1,
                'room_name' => 'Ruang Meeting A',
                'topic' => 'Meeting dengan Client',
                'pic' => 'John Doe',
                'participants' => 5,
                'meeting_date' => date('Y-m-d'),
                'meeting_time' => '15:30:00',
                'duration' => 60,
                'meeting_type' => 'external',
                'food_order' => 'ringan'
            ]
        ],
        [
            'name' => 'Test Internal Meeting',
            'data' => [
                'user_id' => 1,
                'session_id' => 'test_internal_' . time(),
                'room_id' => 1,
                'room_name' => 'Ruang Meeting B',
                'topic' => 'Rapat Internal',
                'pic' => 'Jane Smith',
                'participants' => 3,
                'meeting_date' => date('Y-m-d'),
                'meeting_time' => '14:15:00',
                'duration' => 90,
                'meeting_type' => 'internal',
                'food_order' => 'tidak'
            ]
        ],
        [
            'name' => 'Test Vendor Meeting',
            'data' => [
                'user_id' => 1,
                'session_id' => 'test_vendor_' . time(),
                'room_id' => 1,
                'room_name' => 'Ruang Meeting C',
                'topic' => 'Meeting dengan Vendor',
                'pic' => 'Bob Wilson',
                'participants' => 8,
                'meeting_date' => date('Y-m-d'),
                'meeting_time' => '16:45:00',
                'duration' => 120,
                'meeting_type' => 'external',
                'food_order' => 'berat'
            ]
        ]
    ];
    
    foreach ($testCases as $testCase) {
        echo "🔍 Testing: " . $testCase['name'] . "\n";
        echo "📊 Input data:\n";
        print_r($testCase['data']);
        
        // Simpan data
        $result = $aiBookingSuccess->createSuccessBooking($testCase['data']);
        
        if ($result) {
            echo "✅ Berhasil disimpan dengan ID: " . $result . "\n";
            
            // Verifikasi data tersimpan dengan benar
            $savedData = $aiBookingSuccess->getSuccessBookingBySessionId($testCase['data']['session_id']);
            if ($savedData) {
                echo "📋 Data tersimpan:\n";
                echo "  - Meeting Type: " . $savedData['meeting_type'] . " (expected: " . $testCase['data']['meeting_type'] . ")\n";
                echo "  - Meeting Time: " . $savedData['meeting_time'] . " (expected: " . $testCase['data']['meeting_time'] . ")\n";
                echo "  - Topic: " . $savedData['topic'] . " (expected: " . $testCase['data']['topic'] . ")\n";
                echo "  - PIC: " . $savedData['pic'] . " (expected: " . $testCase['data']['pic'] . ")\n";
                echo "  - Participants: " . $savedData['participants'] . " (expected: " . $testCase['data']['participants'] . ")\n";
                echo "  - Food Order: " . $savedData['food_order'] . " (expected: " . $testCase['data']['food_order'] . ")\n";
                
                // Check accuracy
                $meetingTypeCorrect = $savedData['meeting_type'] === $testCase['data']['meeting_type'];
                $meetingTimeCorrect = $savedData['meeting_time'] === $testCase['data']['meeting_time'];
                $topicCorrect = $savedData['topic'] === $testCase['data']['topic'];
                $picCorrect = $savedData['pic'] === $testCase['data']['pic'];
                $participantsCorrect = $savedData['participants'] == $testCase['data']['participants'];
                $foodOrderCorrect = $savedData['food_order'] === $testCase['data']['food_order'];
                
                echo "✅ Accuracy Check:\n";
                echo "  - Meeting Type: " . ($meetingTypeCorrect ? "✅" : "❌") . "\n";
                echo "  - Meeting Time: " . ($meetingTimeCorrect ? "✅" : "❌") . "\n";
                echo "  - Topic: " . ($topicCorrect ? "✅" : "❌") . "\n";
                echo "  - PIC: " . ($picCorrect ? "✅" : "❌") . "\n";
                echo "  - Participants: " . ($participantsCorrect ? "✅" : "❌") . "\n";
                echo "  - Food Order: " . ($foodOrderCorrect ? "✅" : "❌") . "\n";
                
            } else {
                echo "❌ Data tidak ditemukan setelah penyimpanan\n";
            }
        } else {
            echo "❌ Gagal menyimpan data\n";
        }
        
        echo "--------------------------------------------------\n";
    }
    
    // Show all recent bookings
    echo "\n📊 Semua booking terbaru:\n";
    $allBookings = $aiBookingSuccess->getAllSuccessBookings();
    $recentBookings = array_slice($allBookings, 0, 5);
    
    foreach ($recentBookings as $index => $booking) {
        echo ($index + 1) . ". ID: " . $booking['id'] . "\n";
        echo "   Session: " . $booking['session_id'] . "\n";
        echo "   Type: " . $booking['meeting_type'] . "\n";
        echo "   Time: " . $booking['meeting_time'] . "\n";
        echo "   Topic: " . $booking['topic'] . "\n";
        echo "   PIC: " . $booking['pic'] . "\n";
        echo "   ---------------------------------------------------\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n=== SELESAI ===\n";
?>







