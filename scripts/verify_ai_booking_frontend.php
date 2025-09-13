<?php
/**
 * Script untuk memverifikasi data booking AI dari frontend
 */

require_once __DIR__ . '/../backend/config/database.php';
require_once __DIR__ . '/../backend/models/AiBookingSuccess.php';

echo "=== VERIFIKASI DATA BOOKING AI DARI FRONTEND ===\n\n";

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $aiBookingSuccess = new AiBookingSuccess($db);
    
    // Ambil semua data booking AI yang berhasil
    $allBookings = $aiBookingSuccess->getAllSuccessBookings();
    
    echo "📊 Total data booking AI yang tersimpan: " . count($allBookings) . "\n\n";
    
    if (count($allBookings) > 0) {
        echo "📋 Data booking AI terbaru:\n";
        echo "===================================================\n";
        
        // Tampilkan 5 data terbaru
        $recentBookings = array_slice($allBookings, 0, 5);
        foreach ($recentBookings as $index => $booking) {
            echo ($index + 1) . ". ID: " . $booking['id'] . "\n";
            echo "   Session ID: " . $booking['session_id'] . "\n";
            echo "   User ID: " . $booking['user_id'] . "\n";
            echo "   Room: " . $booking['room_name'] . " (ID: " . $booking['room_id'] . ")\n";
            echo "   Topic: " . $booking['topic'] . "\n";
            echo "   PIC: " . $booking['pic'] . "\n";
            echo "   Participants: " . $booking['participants'] . "\n";
            echo "   Date: " . $booking['meeting_date'] . "\n";
            echo "   Time: " . $booking['meeting_time'] . "\n";
            echo "   Duration: " . $booking['duration'] . " minutes\n";
            echo "   Type: " . $booking['meeting_type'] . "\n";
            echo "   Food: " . $booking['food_order'] . "\n";
            echo "   Status: " . $booking['booking_state'] . "\n";
            echo "   Created: " . $booking['created_at'] . "\n";
            echo "   Updated: " . $booking['updated_at'] . "\n";
            echo "   ---------------------------------------------------\n";
        }
        
        // Cek data berdasarkan user_id
        echo "\n🔍 Data booking berdasarkan User ID:\n";
        $userBookings = $aiBookingSuccess->getSuccessBookingsByUserId(1);
        echo "   User ID 1 memiliki " . count($userBookings) . " booking\n";
        
        // Cek session ID terbaru
        if (count($allBookings) > 0) {
            $latestSession = $allBookings[0]['session_id'];
            echo "\n🔍 Data booking berdasarkan Session ID terbaru:\n";
            $sessionBooking = $aiBookingSuccess->getSuccessBookingBySessionId($latestSession);
            if ($sessionBooking) {
                echo "   Session ID: " . $sessionBooking['session_id'] . "\n";
                echo "   Topic: " . $sessionBooking['topic'] . "\n";
                echo "   Room: " . $sessionBooking['room_name'] . "\n";
                echo "   Status: " . $sessionBooking['booking_state'] . "\n";
            }
        }
        
    } else {
        echo "❌ Belum ada data booking AI yang tersimpan\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}

echo "\n=== SELESAI ===\n";
?>







