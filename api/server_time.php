<?php
/**
 * Server Time API
 * Returns current server time in WIB timezone
 */

// Set timezone to Asia/Jakarta
date_default_timezone_set('Asia/Jakarta');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    $currentDate = date('Y-m-d');
    $currentTime = date('H:i:s');
    $currentDateTime = date('Y-m-d H:i:s');
    $timezone = date_default_timezone_get();
    
    echo json_encode([
        'status' => 'success',
        'data' => [
            'date' => $currentDate,
            'time' => $currentTime,
            'datetime' => $currentDateTime,
            'timezone' => $timezone,
            'timestamp' => time()
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
