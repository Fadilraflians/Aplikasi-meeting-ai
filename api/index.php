<?php
/**
 * Main API entry point for Spacio Meeting Room Booker
 * This file handles all API requests and routes them to appropriate services
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get the request path
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);
$path_parts = explode('/', trim($path, '/'));

// Remove 'api' from the path if it exists
if ($path_parts[0] === 'api') {
    array_shift($path_parts);
}

// Route the request based on the path
if (empty($path_parts)) {
    // Default route - show API info
    echo json_encode([
        'success' => true,
        'message' => 'Spacio Meeting Room Booker API',
        'version' => '1.0.0',
        'endpoints' => [
            'auth' => '/api/auth',
            'rooms' => '/api/rooms',
            'reservations' => '/api/reservations',
            'rispat' => '/api/rispat-simple.php'
        ]
    ]);
    exit();
}

$service = $path_parts[0] ?? '';

switch ($service) {
    case 'auth':
        require_once '../services/authService.php';
        break;
        
    case 'rooms':
        require_once '../services/meetingRoomService.php';
        break;
        
    case 'reservations':
        require_once '../services/reservationService.php';
        break;
        
    case 'rispat-simple.php':
        require_once 'rispat-simple.php';
        break;
        
    default:
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Service not found',
            'available_services' => ['auth', 'rooms', 'reservations', 'rispat-simple.php']
        ]);
        break;
}
?>



