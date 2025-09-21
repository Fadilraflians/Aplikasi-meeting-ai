<?php
/**
 * Script untuk memperbaiki dan membersihkan data AI bookings
 * - Hapus booking yang sudah berlalu
 * - Perbaiki data yang tidak lengkap
 * - Update room_name yang kosong
 */

require_once 'config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "🔧 Starting AI bookings data cleanup and fix...\n\n";
    
    // 1. Hapus booking yang sudah berlalu lebih dari 1 hari
    echo "1️⃣ Cleaning up past bookings...\n";
    $deleteQuery = "DELETE FROM ai_bookings_success 
                    WHERE meeting_date < DATE_SUB(NOW(), INTERVAL 1 DAY) 
                    AND booking_state IN ('BOOKED', 'COMPLETED')";
    
    $stmt = $db->prepare($deleteQuery);
    $result = $stmt->execute();
    
    if ($result) {
        $deletedCount = $stmt->rowCount();
        echo "✅ Deleted {$deletedCount} past bookings\n";
    }
    
    // 2. Perbaiki room_name yang kosong atau "Ruangan Tidak Diketahui"
    echo "\n2️⃣ Fixing empty room names...\n";
    $fixRoomQuery = "UPDATE ai_bookings_success abs
                     LEFT JOIN meeting_rooms mr ON abs.room_id = mr.id
                     SET abs.room_name = COALESCE(mr.name, mr.room_name, 'Ruangan Tidak Tersedia')
                     WHERE (abs.room_name = '' OR abs.room_name IS NULL OR abs.room_name = 'Ruangan Tidak Diketahui')
                     AND abs.room_id IS NOT NULL";
    
    $stmt = $db->prepare($fixRoomQuery);
    $result = $stmt->execute();
    
    if ($result) {
        $fixedCount = $stmt->rowCount();
        echo "✅ Fixed {$fixedCount} room names\n";
    }
    
    // 3. Perbaiki meeting_time yang kosong atau "00:00"
    echo "\n3️⃣ Fixing empty meeting times...\n";
    
    // Update meeting_time dulu
    $fixTimeQuery = "UPDATE ai_bookings_success 
                     SET meeting_time = '09:00:00'
                     WHERE (meeting_time = '' OR meeting_time IS NULL OR meeting_time = '00:00:00')";
    
    $stmt = $db->prepare($fixTimeQuery);
    $result = $stmt->execute();
    
    if ($result) {
        $fixedCount = $stmt->rowCount();
        echo "✅ Fixed {$fixedCount} meeting times\n";
    }
    
    // Update end_time berdasarkan duration
    $fixEndTimeQuery = "UPDATE ai_bookings_success 
                        SET end_time = CASE 
                            WHEN duration = 30 THEN '09:30:00'
                            WHEN duration = 60 THEN '10:00:00'
                            WHEN duration = 90 THEN '10:30:00'
                            WHEN duration = 120 THEN '11:00:00'
                            WHEN duration = 180 THEN '12:00:00'
                            ELSE '10:00:00'
                        END
                        WHERE (end_time IS NULL OR end_time = '')";
    
    $stmt = $db->prepare($fixEndTimeQuery);
    $result = $stmt->execute();
    
    if ($result) {
        $fixedCount = $stmt->rowCount();
        echo "✅ Fixed {$fixedCount} end times\n";
    }
    
    // 4. Perbaiki topic yang kosong
    echo "\n4️⃣ Fixing empty topics...\n";
    $fixTopicQuery = "UPDATE ai_bookings_success 
                      SET topic = 'Meeting AI Booking'
                      WHERE (topic = '' OR topic IS NULL)";
    
    $stmt = $db->prepare($fixTopicQuery);
    $result = $stmt->execute();
    
    if ($result) {
        $fixedCount = $stmt->rowCount();
        echo "✅ Fixed {$fixedCount} empty topics\n";
    }
    
    // 5. Perbaiki PIC yang kosong
    echo "\n5️⃣ Fixing empty PIC...\n";
    $fixPicQuery = "UPDATE ai_bookings_success 
                    SET pic = 'AI User'
                    WHERE (pic = '' OR pic IS NULL OR pic = '-')";
    
    $stmt = $db->prepare($fixPicQuery);
    $result = $stmt->execute();
    
    if ($result) {
        $fixedCount = $stmt->rowCount();
        echo "✅ Fixed {$fixedCount} empty PIC\n";
    }
    
    // 6. Set default duration jika kosong
    echo "\n6️⃣ Setting default duration...\n";
    $fixDurationQuery = "UPDATE ai_bookings_success 
                         SET duration = 60
                         WHERE (duration IS NULL OR duration = 0)";
    
    $stmt = $db->prepare($fixDurationQuery);
    $result = $stmt->execute();
    
    if ($result) {
        $fixedCount = $stmt->rowCount();
        echo "✅ Fixed {$fixedCount} durations\n";
    }
    
    // 7. Tampilkan data yang sudah diperbaiki
    echo "\n📊 Current AI bookings after cleanup:\n";
    echo "=" . str_repeat("=", 80) . "\n";
    
    $remainingQuery = "SELECT COUNT(*) as count FROM ai_bookings_success WHERE booking_state = 'BOOKED'";
    $remainingStmt = $db->prepare($remainingQuery);
    $remainingStmt->execute();
    $remainingCount = $remainingStmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    echo "📈 Active AI bookings: {$remainingCount}\n\n";
    
    // Tampilkan detail AI bookings yang tersisa
    $detailQuery = "SELECT id, room_name, topic, meeting_date, meeting_time, end_time, participants, pic, duration
                    FROM ai_bookings_success 
                    WHERE booking_state = 'BOOKED'
                    ORDER BY meeting_date ASC, meeting_time ASC 
                    LIMIT 10";
    $detailStmt = $db->prepare($detailQuery);
    $detailStmt->execute();
    $remainingBookings = $detailStmt->fetchAll(PDO::FETCH_ASSOC);
    
    if ($remainingBookings) {
        echo "📋 Upcoming AI bookings:\n";
        echo sprintf("%-4s | %-25s | %-20s | %-12s | %-10s | %-8s | %-15s\n", 
                    "ID", "Room", "Topic", "Date", "Time", "Duration", "PIC");
        echo str_repeat("-", 100) . "\n";
        
        foreach ($remainingBookings as $booking) {
            $timeRange = $booking['meeting_time'] . " - " . $booking['end_time'];
            echo sprintf("%-4s | %-25s | %-20s | %-12s | %-10s | %-8s | %-15s\n",
                        $booking['id'],
                        substr($booking['room_name'], 0, 25),
                        substr($booking['topic'], 0, 20),
                        $booking['meeting_date'],
                        $timeRange,
                        $booking['duration'] . " min",
                        $booking['pic']
            );
        }
    }
    
    echo "\n✅ AI bookings cleanup completed successfully!\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
