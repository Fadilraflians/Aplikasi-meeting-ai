<?php
/**
 * Test script untuk memverifikasi error handling di AI booking
 */

require_once __DIR__ . '/../backend/config/database.php';
require_once __DIR__ . '/../backend/models/AiBookingSuccess.php';

echo "=== TEST ERROR HANDLING AI BOOKING ===\n\n";

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $aiBookingSuccess = new AiBookingSuccess($db);
    
    // Test 1: Data kosong
    echo "🔍 Test 1: Data kosong\n";
    $emptyData = [];
    $result1 = $aiBookingSuccess->createSuccessBooking($emptyData);
    echo "Result: " . ($result1 ? "SUCCESS" : "FAILED") . "\n\n";
    
    // Test 2: Data dengan field yang hilang
    echo "🔍 Test 2: Data dengan field yang hilang\n";
    $incompleteData = [
        'user_id' => 1,
        'session_id' => 'test_incomplete_' . time(),
        // Missing room_id, room_name, etc.
    ];
    $result2 = $aiBookingSuccess->createSuccessBooking($incompleteData);
    echo "Result: " . ($result2 ? "SUCCESS" : "FAILED") . "\n\n";
    
    // Test 3: Data dengan nilai null
    echo "🔍 Test 3: Data dengan nilai null\n";
    $nullData = [
        'user_id' => null,
        'session_id' => 'test_null_' . time(),
        'room_id' => null,
        'room_name' => null,
        'topic' => null,
        'pic' => null,
        'participants' => null,
        'meeting_date' => null,
        'meeting_time' => null,
        'duration' => null,
        'meeting_type' => null,
        'food_order' => null
    ];
    $result3 = $aiBookingSuccess->createSuccessBooking($nullData);
    echo "Result: " . ($result3 ? "SUCCESS" : "FAILED") . "\n\n";
    
    // Test 4: Data dengan tipe data yang salah
    echo "🔍 Test 4: Data dengan tipe data yang salah\n";
    $wrongTypeData = [
        'user_id' => 'string_instead_of_int',
        'session_id' => 'test_wrong_type_' . time(),
        'room_id' => 'string_instead_of_int',
        'room_name' => 123, // int instead of string
        'topic' => 456, // int instead of string
        'pic' => 789, // int instead of string
        'participants' => 'string_instead_of_int',
        'meeting_date' => 2025, // int instead of string
        'meeting_time' => 1500, // int instead of string
        'duration' => 'string_instead_of_int',
        'meeting_type' => 999, // int instead of string
        'food_order' => 888 // int instead of string
    ];
    $result4 = $aiBookingSuccess->createSuccessBooking($wrongTypeData);
    echo "Result: " . ($result4 ? "SUCCESS" : "FAILED") . "\n\n";
    
    // Test 5: Data yang valid
    echo "🔍 Test 5: Data yang valid\n";
    $validData = [
        'user_id' => 1,
        'session_id' => 'test_valid_' . time(),
        'room_id' => 1,
        'room_name' => 'Test Room',
        'topic' => 'Test Meeting',
        'pic' => 'Test User',
        'participants' => 5,
        'meeting_date' => date('Y-m-d'),
        'meeting_time' => '14:00:00',
        'duration' => 60,
        'meeting_type' => 'internal',
        'food_order' => 'tidak'
    ];
    $result5 = $aiBookingSuccess->createSuccessBooking($validData);
    echo "Result: " . ($result5 ? "SUCCESS (ID: $result5)" : "FAILED") . "\n\n";
    
    // Test 6: Duplicate session_id
    echo "🔍 Test 6: Duplicate session_id\n";
    $duplicateData = [
        'user_id' => 1,
        'session_id' => 'test_valid_' . (time() - 1), // Use same session_id as test 5
        'room_id' => 1,
        'room_name' => 'Test Room 2',
        'topic' => 'Test Meeting 2',
        'pic' => 'Test User 2',
        'participants' => 3,
        'meeting_date' => date('Y-m-d'),
        'meeting_time' => '15:00:00',
        'duration' => 60,
        'meeting_type' => 'internal',
        'food_order' => 'tidak'
    ];
    $result6 = $aiBookingSuccess->createSuccessBooking($duplicateData);
    echo "Result: " . ($result6 ? "SUCCESS (ID: $result6)" : "FAILED") . "\n\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
} catch (Error $e) {
    echo "❌ Fatal Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}

echo "\n=== SELESAI ===\n";
?>







