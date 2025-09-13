<?php
require_once 'backend/config/database.php';

echo "=== VERIFY FRONTEND BACKEND SYNC ===\n\n";

try {
    $db = new PDO("mysql:host=localhost;dbname=spacio_meeting_db", "root", "");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "🔗 Database connected successfully\n";
    
    // Get the latest booking from ai_booking_agent
    $stmt = $db->query("SELECT * FROM ai_booking_agent ORDER BY created_at DESC LIMIT 1");
    $latestBooking = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($latestBooking) {
        echo "\n📋 Latest Booking from Database:\n";
        echo "ID: " . $latestBooking['id'] . "\n";
        echo "Session ID: " . $latestBooking['session_id'] . "\n";
        echo "Room: " . $latestBooking['room_name'] . "\n";
        echo "Topic: " . $latestBooking['topic'] . "\n";
        echo "PIC: " . $latestBooking['pic'] . "\n";
        echo "Participants: " . $latestBooking['participants'] . "\n";
        echo "Date: " . $latestBooking['meeting_date'] . "\n";
        echo "Time: " . $latestBooking['meeting_time'] . "\n";
        echo "Time Display: " . $latestBooking['time_display'] . "\n";
        echo "Meeting Type: " . $latestBooking['meeting_type'] . "\n";
        echo "Meeting Type Display: " . $latestBooking['meeting_type_display'] . "\n";
        echo "Food Order: " . $latestBooking['food_order'] . "\n";
        echo "Food Order Display: " . $latestBooking['food_order_display'] . "\n";
        echo "Status: " . $latestBooking['booking_status'] . "\n";
        echo "Created: " . $latestBooking['created_at'] . "\n";
        
        echo "\n🎯 EXPECTED vs ACTUAL:\n";
        echo "Expected Time Display: 15:00 | Actual: " . $latestBooking['time_display'] . " | " . 
             ($latestBooking['time_display'] === '15:00' ? "✅ MATCH" : "❌ MISMATCH") . "\n";
        echo "Expected Meeting Type Display: External | Actual: " . $latestBooking['meeting_type_display'] . " | " . 
             ($latestBooking['meeting_type_display'] === 'External' ? "✅ MATCH" : "❌ MISMATCH") . "\n";
        echo "Expected Food Order Display: Makanan Berat | Actual: " . $latestBooking['food_order_display'] . " | " . 
             ($latestBooking['food_order_display'] === 'Makanan Berat' ? "✅ MATCH" : "❌ MISMATCH") . "\n";
        
        echo "\n📊 SUMMARY:\n";
        $matches = 0;
        $total = 3;
        
        if ($latestBooking['time_display'] === '15:00') $matches++;
        if ($latestBooking['meeting_type_display'] === 'External') $matches++;
        if ($latestBooking['food_order_display'] === 'Makanan Berat') $matches++;
        
        echo "Data Accuracy: $matches/$total (" . round(($matches/$total)*100, 1) . "%)\n";
        
        if ($matches === $total) {
            echo "🎉 PERFECT! All data matches expected values.\n";
            echo "✅ Backend is working correctly.\n";
            echo "🔍 Next step: Check frontend display logic.\n";
        } else {
            echo "⚠️ Some data doesn't match expected values.\n";
            echo "🔍 Check backend processing logic.\n";
        }
        
    } else {
        echo "\n❌ No bookings found in database.\n";
    }
    
} catch (PDOException $e) {
    echo "\n❌ Database Error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "\n❌ General Error: " . $e->getMessage() . "\n";
}

echo "\n=== END VERIFICATION ===\n";
?>









