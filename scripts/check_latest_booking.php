<?php
require_once 'backend/config/database.php';

echo "=== CHECK LATEST BOOKING ===\n\n";

try {
    $db = new PDO("mysql:host=localhost;dbname=spacio_meeting_db", "root", "");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "🔗 Database connected successfully\n";
    
    // Get the latest booking (should be ID 6 from the test)
    $stmt = $db->query("SELECT * FROM ai_booking_agent ORDER BY created_at DESC LIMIT 1");
    $latestBooking = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($latestBooking) {
        echo "\n📋 Latest Booking (ID: {$latestBooking['id']}):\n";
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
        
        // Check if this is from frontend test
        if (strpos($latestBooking['session_id'], 'frontend_test') !== false) {
            echo "\n🎯 This booking was created from frontend test!\n";
            echo "✅ Frontend-to-backend connection is working!\n";
        } else {
            echo "\n⚠️ This booking was created from direct API test.\n";
        }
        
    } else {
        echo "\n❌ No bookings found in database.\n";
    }
    
} catch (PDOException $e) {
    echo "\n❌ Database Error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "\n❌ General Error: " . $e->getMessage() . "\n";
}

echo "\n=== END CHECK ===\n";
?>










