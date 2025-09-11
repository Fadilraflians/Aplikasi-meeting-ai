<?php
/**
 * Test script untuk memverifikasi CORS dan API configuration
 */

echo "=== TEST CORS DAN API CONFIGURATION ===\n\n";

// Test 1: CORS headers
echo "🔍 Test 1: CORS Headers\n";
$url = 'http://localhost:8080/backend/api/bookings.php/rooms';
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_NOBODY, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$headers = substr($response, 0, $headerSize);
curl_close($ch);

echo "HTTP Code: " . $httpCode . "\n";
echo "Headers:\n" . $headers . "\n";

// Check for CORS headers
if (strpos($headers, 'Access-Control-Allow-Origin') !== false) {
    echo "✅ CORS headers found\n";
} else {
    echo "❌ CORS headers not found\n";
}

// Test 2: API endpoints availability
echo "\n🔍 Test 2: API Endpoints Availability\n";

$endpoints = [
    'http://localhost:8080/backend/api/bookings.php/rooms',
    'http://localhost:8080/backend/api/bookings.php/ai-booking',
    'http://localhost:8080/backend/api/bookings.php/ai-booking-success',
    'http://localhost:8080/api/auth/session.php'
];

foreach ($endpoints as $endpoint) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $endpoint);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_NOBODY, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        echo "❌ " . $endpoint . " - Error: " . $error . "\n";
    } else {
        echo "✅ " . $endpoint . " - HTTP " . $httpCode . "\n";
    }
}

// Test 3: Frontend API configuration
echo "\n🔍 Test 3: Frontend API Configuration\n";

$frontendConfigs = [
    'http://localhost:5173/src/config/api.ts',
    'http://localhost:5173/services/aiDatabaseService.ts',
    'http://localhost:5173/src/services/backendService.ts'
];

foreach ($frontendConfigs as $config) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $config);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        echo "❌ " . $config . " - Error: " . $error . "\n";
    } else {
        echo "✅ " . $config . " - HTTP " . $httpCode . "\n";
    }
}

// Test 4: Database connection
echo "\n🔍 Test 4: Database Connection\n";

require_once __DIR__ . '/../backend/config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    echo "✅ Database connection successful\n";
    
    // Test query
    $stmt = $db->query("SELECT COUNT(*) as count FROM ai_bookings_success");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "✅ Database query successful - Total bookings: " . $result['count'] . "\n";
    
} catch (Exception $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "\n";
}

echo "\n=== SELESAI ===\n";
?>




