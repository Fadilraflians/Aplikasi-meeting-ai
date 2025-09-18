<?php
echo "=== TEST FRONTEND BACKEND CONNECTION ===\n\n";

// Test data yang sama dengan yang dikirim frontend
$testData = [
    'user_id' => 1,
    'session_id' => 'frontend_test_' . time(),
    'room_id' => 3,
    'room_name' => 'Kalamanthana Meeting Room',
    'topic' => 'rapaat',
    'pic' => 'ril',
    'participants' => 14,
    'meeting_date' => '2025-09-05',
    'meeting_time' => '15:00:00',
    'duration' => 60,
    'meeting_type' => 'external',
    'food_order' => 'berat'
];

echo "📝 Test Data (same as frontend):\n";
print_r($testData);

// Test both possible URLs
$urls = [
    'http://127.0.0.1:8080/api/ai/agent-booking.php',
    'http://127.0.0.1:8080/backend/api/ai/agent-booking.php'
];

foreach ($urls as $index => $url) {
    echo "\n🔗 Testing URL " . ($index + 1) . ": $url\n";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($testData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_VERBOSE, true);

    echo "📤 Sending POST request...\n";

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);

    curl_close($ch);

    echo "📥 HTTP Response Code: $httpCode\n";

    if ($error) {
        echo "❌ cURL Error: $error\n";
    } else {
        echo "📥 Response Body:\n";
        echo $response . "\n";
        
        $responseData = json_decode($response, true);
        if ($responseData) {
            echo "\n🔍 Parsed Response:\n";
            print_r($responseData);
            
            if (isset($responseData['success']) && $responseData['success']) {
                echo "\n✅ URL $url berfungsi dengan baik!\n";
                echo "🎯 Booking ID: " . ($responseData['booking_id'] ?? 'N/A') . "\n";
            } else {
                echo "\n❌ URL $url gagal: " . ($responseData['error'] ?? 'Unknown error') . "\n";
            }
        } else {
            echo "\n❌ Failed to parse JSON response\n";
        }
    }
    
    echo "\n" . str_repeat("-", 50) . "\n";
}

echo "\n=== END TEST ===\n";
?>










