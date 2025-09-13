<?php
require_once 'backend/config/database.php';

echo "=== CHECK AI BOOKING AGENT DATA ===\n\n";

try {
    $db = new PDO("mysql:host=localhost;dbname=spacio_meeting_db", "root", "");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "🔗 Database connected successfully\n";
    
    // Check total records
    $stmt = $db->query("SELECT COUNT(*) as total FROM ai_booking_agent");
    $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    echo "\n📊 Total records in ai_booking_agent: $total\n";
    
    if ($total > 0) {
        // Get latest records
        $stmt = $db->query("SELECT * FROM ai_booking_agent ORDER BY created_at DESC LIMIT 5");
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "\n📋 Latest 5 records:\n";
        foreach ($records as $index => $record) {
            echo "\n--- Record " . ($index + 1) . " ---\n";
            echo "ID: " . $record['id'] . "\n";
            echo "Session ID: " . $record['session_id'] . "\n";
            echo "Room: " . $record['room_name'] . "\n";
            echo "Topic: " . $record['topic'] . "\n";
            echo "PIC: " . $record['pic'] . "\n";
            echo "Participants: " . $record['participants'] . "\n";
            echo "Date: " . $record['meeting_date'] . "\n";
            echo "Time: " . $record['meeting_time'] . "\n";
            echo "Time Display: " . $record['time_display'] . "\n";
            echo "Meeting Type: " . $record['meeting_type'] . "\n";
            echo "Meeting Type Display: " . $record['meeting_type_display'] . "\n";
            echo "Food Order: " . $record['food_order'] . "\n";
            echo "Food Order Display: " . $record['food_order_display'] . "\n";
            echo "Status: " . $record['booking_status'] . "\n";
            echo "Created: " . $record['created_at'] . "\n";
        }
        
        // Check for specific test data
        $stmt = $db->prepare("SELECT * FROM ai_booking_agent WHERE session_id LIKE ? ORDER BY created_at DESC");
        $stmt->execute(['%test%']);
        $testRecords = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($testRecords) > 0) {
            echo "\n🧪 Test Records Found:\n";
            foreach ($testRecords as $record) {
                echo "- Session: " . $record['session_id'] . " | Time: " . $record['time_display'] . " | Type: " . $record['meeting_type_display'] . "\n";
            }
        }
        
    } else {
        echo "\n❌ No records found in ai_booking_agent table\n";
    }
    
} catch (PDOException $e) {
    echo "\n❌ Database Error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "\n❌ General Error: " . $e->getMessage() . "\n";
}

echo "\n=== END CHECK ===\n";
?>









