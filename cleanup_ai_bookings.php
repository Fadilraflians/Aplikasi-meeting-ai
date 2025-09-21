<?php
/**
 * Script untuk membersihkan AI bookings yang sudah berlalu
 * Jalankan script ini untuk menghapus data lama
 */

require_once 'config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "🧹 Starting cleanup of old AI bookings...\n";
    
    // Hapus AI bookings yang sudah berlalu lebih dari 7 hari
    $query = "DELETE FROM ai_bookings_success 
              WHERE meeting_date < DATE_SUB(NOW(), INTERVAL 7 DAY) 
              AND booking_state IN ('BOOKED', 'COMPLETED')";
    
    $stmt = $db->prepare($query);
    $result = $stmt->execute();
    
    if ($result) {
        $deletedCount = $stmt->rowCount();
        echo "✅ Successfully cleaned up {$deletedCount} old AI bookings\n";
        
        // Tampilkan sisa AI bookings
        $remainingQuery = "SELECT COUNT(*) as count FROM ai_bookings_success";
        $remainingStmt = $db->prepare($remainingQuery);
        $remainingStmt->execute();
        $remainingCount = $remainingStmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        echo "📊 Remaining AI bookings: {$remainingCount}\n";
        
        // Tampilkan detail AI bookings yang tersisa
        $detailQuery = "SELECT id, room_name, topic, meeting_date, meeting_time, participants, pic 
                        FROM ai_bookings_success 
                        ORDER BY created_at DESC 
                        LIMIT 10";
        $detailStmt = $db->prepare($detailQuery);
        $detailStmt->execute();
        $remainingBookings = $detailStmt->fetchAll(PDO::FETCH_ASSOC);
        
        if ($remainingBookings) {
            echo "\n📋 Recent AI bookings:\n";
            foreach ($remainingBookings as $booking) {
                echo "  - ID: {$booking['id']}, Room: {$booking['room_name']}, Topic: {$booking['topic']}, Date: {$booking['meeting_date']}, Time: {$booking['meeting_time']}, Participants: {$booking['participants']}, PIC: {$booking['pic']}\n";
            }
        }
        
    } else {
        echo "❌ Failed to cleanup old AI bookings\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
