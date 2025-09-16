<?php
/**
 * Bookings API Proxy
 * Proxy untuk mengakses API bookings dari frontend
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
require_once '../backend/models/Booking.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        sendResponse(false, 'Database connection failed', null, 500);
        return;
    }
    
    $booking = new Booking($db);
    
    $method = $_SERVER['REQUEST_METHOD'];
    $userId = $_GET['user_id'] ?? null;
    $status = $_GET['status'] ?? null;
    
    switch ($method) {
        case 'GET':
            if ($userId) {
                // Get all bookings by user ID (including completed ones)
                $result = $booking->getAllBookingsByUserId($userId);
                
                // Filter by status if provided
                if ($status && $result) {
                    $result = array_filter($result, function($booking) use ($status) {
                        return $booking['booking_state'] === $status || $booking['status'] === $status;
                    });
                }
                
                echo json_encode([
                    'success' => true,
                    'data' => array_values($result) // Re-index array
                ]);
            } else {
                // Get all bookings
                $result = $booking->getAllBookings();
                echo json_encode([
                    'success' => true,
                    'data' => $result
                ]);
            }
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Debug logging
            error_log("Bookings API POST request received: " . json_encode($input));
            
            if (!$input) {
                sendResponse(false, 'Invalid JSON input', null, 400);
                return;
            }
            
            $action = $input['action'] ?? '';
            error_log("Bookings API action: " . $action);
            
            switch ($action) {
                case 'create':
                    $bookingData = $input['booking_data'] ?? null;
                    error_log("Bookings API create - booking data: " . json_encode($bookingData));
                    
                    if (!$bookingData) {
                        sendResponse(false, 'Booking data required', null, 400);
                        return;
                    }
                    
                    $result = $booking->createBooking($bookingData);
                    error_log("Bookings API create - result: " . json_encode($result));
                    
                    if ($result) {
                        sendResponse(true, 'Booking created successfully', $result);
                    } else {
                        sendResponse(false, 'Failed to create booking', null, 500);
                    }
                    break;
                    
                case 'complete':
                    $bookingId = $input['booking_id'] ?? null;
                    if (!$bookingId) {
                        sendResponse(false, 'Booking ID required', null, 400);
                        return;
                    }
                    $result = $booking->completeBooking($bookingId);
                    if ($result) {
                        sendResponse(true, 'Booking completed successfully');
                    } else {
                        sendResponse(false, 'Failed to complete booking', null, 500);
                    }
                    break;
                    
                default:
                    sendResponse(false, 'Invalid action', null, 400);
            }
            break;
            
        default:
            sendResponse(false, 'Method not allowed', null, 405);
    }
    
} catch (Exception $e) {
    error_log("Bookings API Error: " . $e->getMessage());
    sendResponse(false, 'Internal server error', null, 500);
}

function sendResponse($success, $message, $data = null, $httpCode = 200) {
    http_response_code($httpCode);
    
    $response = [
        'success' => $success,
        'message' => $message,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    echo json_encode($response, JSON_PRETTY_PRINT);
    exit();
}
?>
