<?php
require_once 'backend/config/database.php';

echo "=== TEST REALISTIC BOOKING SIMULATION ===\n\n";

// Simulate user input data
$userInputData = [
    'user_id' => 1,
    'session_id' => 'real_booking_' . time(),
    'room_id' => 2, // Nusantara Conference Room
    'room_name' => 'Nusantara Conference Room',
    'topic' => 'Rapat Tim Marketing',
    'pic' => 'Budi Santoso',
    'participants' => 15,
    'meeting_date' => '2025-09-08',
    'meeting_time' => '14:30:00', // User input: 14:30
    'duration' => 60,
    'meeting_type' => 'internal', // User input: internal
    'food_order' => 'ringan' // User input: makanan ringan
];

echo "📝 User Input Data:\n";
print_r($userInputData);

// Test the endpoint
$url = 'http://localhost:8000/api/bookings.php/ai-booking-success';
$data = json_encode($userInputData);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Content-Length: ' . strlen($data)
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "\n🌐 API Response (HTTP $httpCode):\n";
echo $response . "\n";

// Check database
try {
    $db = new PDO("mysql:host=localhost;dbname=spacio_meeting_db", "root", "");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $stmt = $db->prepare("SELECT * FROM ai_bookings_success WHERE session_id = ? ORDER BY created_at DESC LIMIT 1");
    $stmt->execute([$userInputData['session_id']]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result) {
        echo "\n✅ SUCCESS: Data berhasil disimpan dengan ID: " . $result['id'] . "\n\n";
        echo "📋 Retrieved Data:\n";
        print_r($result);
        
        // Verify data matches user input
        echo "\n🔍 Data Verification:\n";
        echo "Room Name: " . ($result['room_name'] === $userInputData['room_name'] ? "✅" : "❌") . " Expected: {$userInputData['room_name']}, Got: {$result['room_name']}\n";
        echo "Topic: " . ($result['topic'] === $userInputData['topic'] ? "✅" : "❌") . " Expected: {$userInputData['topic']}, Got: {$result['topic']}\n";
        echo "PIC: " . ($result['pic'] === $userInputData['pic'] ? "✅" : "❌") . " Expected: {$userInputData['pic']}, Got: {$result['pic']}\n";
        echo "Participants: " . ($result['participants'] == $userInputData['participants'] ? "✅" : "❌") . " Expected: {$userInputData['participants']}, Got: {$result['participants']}\n";
        echo "Meeting Date: " . ($result['meeting_date'] === $userInputData['meeting_date'] ? "✅" : "❌") . " Expected: {$userInputData['meeting_date']}, Got: {$result['meeting_date']}\n";
        echo "Meeting Time: " . ($result['meeting_time'] === $userInputData['meeting_time'] ? "✅" : "❌") . " Expected: {$userInputData['meeting_time']}, Got: {$result['meeting_time']}\n";
        echo "Time Display: " . ($result['time_display'] === '14:30' ? "✅" : "❌") . " Expected: 14:30, Got: {$result['time_display']}\n";
        echo "Meeting Type: " . ($result['meeting_type'] === $userInputData['meeting_type'] ? "✅" : "❌") . " Expected: {$userInputData['meeting_type']}, Got: {$result['meeting_type']}\n";
        echo "Meeting Type Display: " . ($result['meeting_type_display'] === 'Internal' ? "✅" : "❌") . " Expected: Internal, Got: {$result['meeting_type_display']}\n";
        echo "Food Order: " . ($result['food_order'] === $userInputData['food_order'] ? "✅" : "❌") . " Expected: {$userInputData['food_order']}, Got: {$result['food_order']}\n";
        echo "Food Order Display: " . ($result['food_order_display'] === 'Makanan Ringan' ? "✅" : "❌") . " Expected: Makanan Ringan, Got: {$result['food_order_display']}\n";
    } else {
        echo "\n❌ FAILED: Data tidak ditemukan di database\n";
    }
    
} catch (PDOException $e) {
    echo "\n❌ Database Error: " . $e->getMessage() . "\n";
}

echo "\n=== END TEST ===\n";
?>






