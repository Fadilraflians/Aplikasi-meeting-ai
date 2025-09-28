<?php
/**
 * Bookings API Proxy
 * Proxy untuk mengakses API bookings dari frontend
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
            // Check if this is a request for AI bookings
            $aiData = $_GET['ai'] ?? $_GET['ai-data'] ?? null;
            if ($aiData === 'true') {
                // Get AI bookings from ai_bookings_success table
                require_once '../backend/models/AiBookingSuccess.php';
                $aiBookingSuccess = new AiBookingSuccess($db);
                
                // AI bookings are now global - no user filtering required
                // Get AI bookings with user information
                $query = "SELECT abs.*, 
                                 COALESCE(mr.room_name, abs.room_name) as room_name, 
                                 mr.capacity as room_capacity, 
                                 mr.image_url,
                                 u.username as user_name
                          FROM ai_bookings_success abs 
                          LEFT JOIN meeting_rooms mr ON abs.room_id = mr.id 
                          LEFT JOIN users u ON abs.user_id = u.id
                          WHERE abs.booking_state = 'BOOKED' 
                            AND abs.booking_state != 'COMPLETED'
                          ORDER BY abs.created_at DESC";
                
                $stmt = $db->prepare($query);
                $stmt->execute();
                $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode([
                    'success' => true,
                    'data' => $result
                ]);
            } else {
                // Check if this is a request for AI booking data
                $aiData = $_GET['ai-data'] ?? null;
                if ($aiData === 'true' || strpos($_SERVER['REQUEST_URI'], '/ai-data') !== false) {
                    // Get AI bookings from ai_bookings_success table with room names
                    // AI bookings are visible to all users (no user filtering required)
                    error_log("AI Bookings API - Global AI bookings request (no user filtering)");
                        
                        // First check if table exists
                        $tableCheck = $db->query("SHOW TABLES LIKE 'ai_bookings_success'");
                        if ($tableCheck->rowCount() == 0) {
                            error_log("AI Bookings API - Table ai_bookings_success does not exist");
                            echo json_encode([
                                'success' => false,
                                'message' => 'AI bookings table does not exist',
                                'data' => []
                            ]);
                            return;
                        }
                        
                        // Get AI bookings for all users (global visibility)
                        $query = "SELECT abs.*, 
                                         COALESCE(mr.room_name, abs.room_name) as room_name, 
                                         mr.capacity as room_capacity, 
                                         mr.image_url,
                                         u.username as user_name
                                  FROM ai_bookings_success abs 
                                  LEFT JOIN meeting_rooms mr ON abs.room_id = mr.id 
                                  LEFT JOIN users u ON abs.user_id = u.id
                                  WHERE abs.booking_state = 'BOOKED' 
                                    AND abs.booking_state != 'COMPLETED'
                                  ORDER BY abs.created_at DESC";
                        
                        $stmt = $db->prepare($query);
                        error_log("AI Bookings API - Global query: $query (visible to all users)");
                        
                        $stmt->execute();
                        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
                        
                        error_log("AI Bookings API - Query result count: " . count($result));
                        error_log("AI Bookings API - Sample result: " . json_encode($result[0] ?? 'No results'));
                        
                        echo json_encode([
                            'success' => true,
                            'data' => $result
                        ]);
                } else {
                    // Regular bookings request
                    if ($userId) {
                        // Get bookings for specific user
                        $includeCompleted = $_GET['include_completed'] ?? false;
                        
                        if ($includeCompleted) {
                            // Get all bookings including completed and cancelled ones (for HistoryPage)
                            $result = $booking->getAllBookingsIncludingCompleted($userId);
                        } else {
                            // Get only active bookings (for ReservationsPage)
                            $result = $booking->getActiveBookings($userId);
                        }
                        
                        // Filter by status if provided
                        if ($status && $result) {
                            $result = array_filter($result, function($booking) use ($status) {
                                return $booking['booking_state'] === $status;
                            });
                        }
                        
                        echo json_encode([
                            'success' => true,
                            'data' => array_values($result) // Re-index array
                        ]);
                    } else {
                        // Get all bookings for all users (admin view)
                        $includeCompleted = $_GET['include_completed'] ?? false;
                        
                        if ($includeCompleted) {
                            // Get all bookings including completed and cancelled ones (for HistoryPage)
                            $result = $booking->getAllBookingsIncludingCompleted();
                        } else {
                            // Get only active bookings (for ReservationsPage)
                            $result = $booking->getActiveBookings();
                        }
                        
                        echo json_encode([
                            'success' => true,
                            'data' => $result
                        ]);
                    }
                }
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
                    
                    if ($result && isset($result['success']) && $result['success'] === false) {
                        // Room not available
                        sendResponse(false, $result['message'], $result, 409);
                    } elseif ($result) {
                        sendResponse(true, 'Booking created successfully', $result);
                    } else {
                        sendResponse(false, 'Failed to create booking', null, 500);
                    }
                    break;
                    
                case 'cleanup_old_ai_bookings':
                    // Hapus AI bookings yang sudah berlalu lebih dari 7 hari
                    $query = "DELETE FROM ai_bookings_success 
                              WHERE meeting_date < DATE_SUB(NOW(), INTERVAL 7 DAY) 
                              AND booking_state IN ('BOOKED', 'COMPLETED')";
                    $stmt = $db->prepare($query);
                    $result = $stmt->execute();
                    
                    if ($result) {
                        $deletedCount = $stmt->rowCount();
                        sendResponse(true, "Cleaned up {$deletedCount} old AI bookings", ['deleted_count' => $deletedCount]);
                    } else {
                        sendResponse(false, 'Failed to cleanup old AI bookings', null, 500);
                    }
                    break;
                    
                case 'create_ai_success':
                    $bookingData = $input['booking_data'] ?? null;
                    error_log("Bookings API create_ai_success - booking data: " . json_encode($bookingData));
                    
                    if (!$bookingData) {
                        sendResponse(false, 'AI booking data required', null, 400);
                        return;
                    }
                    
                    // Validate required fields
                    $requiredFields = ['user_id', 'session_id', 'room_name', 'topic', 'meeting_date', 'meeting_time'];
                    foreach ($requiredFields as $field) {
                        if (!isset($bookingData[$field]) || empty($bookingData[$field])) {
                            sendResponse(false, "Missing required field: $field", null, 400);
                            return;
                        }
                    }
                    
                    // Save to ai_bookings_success table
                    require_once '../backend/models/AiBookingSuccess.php';
                    
                    // Check database connection
                    if (!$db) {
                        error_log("Database connection is null");
                        sendResponse(false, 'Database connection failed', null, 500);
                        return;
                    }
                    
                    $aiBookingSuccess = new AiBookingSuccess($db);
                    
                    // Get room_id from room_name or use provided room_id
                    $roomId = $bookingData['room_id'] ?? null;
                    if (!$roomId && isset($bookingData['room_name'])) {
                        $roomQuery = "SELECT id FROM meeting_rooms WHERE room_name = ?";
                        $roomStmt = $db->prepare($roomQuery);
                        $roomStmt->execute([$bookingData['room_name']]);
                        $room = $roomStmt->fetch(PDO::FETCH_ASSOC);
                        $roomId = $room ? $room['id'] : null;
                    }
                    
                    // Check room availability first
                    if ($roomId && isset($bookingData['meeting_date']) && isset($bookingData['meeting_time']) && isset($bookingData['duration'])) {
                        $availability = $booking->checkRoomAvailability(
                            $roomId, 
                            $bookingData['meeting_date'], 
                            $bookingData['meeting_time'], 
                            $bookingData['duration']
                        );
                        
                        if (!$availability['available']) {
                            error_log("Room not available for AI booking: " . json_encode($availability));
                            sendResponse(false, 'Room is not available for the selected time', $availability, 409);
                            return;
                        }
                    }

                    // Prepare data for ai_bookings_success table
                    $successData = [
                        'user_id' => $bookingData['user_id'],
                        'session_id' => $bookingData['session_id'],
                        'room_id' => $roomId,
                        'room_name' => $bookingData['room_name'],
                        'topic' => $bookingData['topic'],
                        'meeting_date' => $bookingData['meeting_date'],
                        'meeting_time' => $bookingData['meeting_time'],
                        'end_time' => $bookingData['end_time'] ?? null,
                        'duration' => $bookingData['duration'],
                        'participants' => $bookingData['participants'],
                        'pic' => $bookingData['pic'],
                        'meeting_type' => $bookingData['meeting_type'],
                        'booking_state' => $bookingData['booking_state']
                    ];
                    
                    error_log("Saving to ai_bookings_success table: " . json_encode($successData));
                    
                    $result = $aiBookingSuccess->createSuccessBooking($successData);
                    
                    if ($result) {
                        error_log("AI booking saved successfully to ai_bookings_success table with ID: $result");
                        sendResponse(true, 'AI booking created successfully', ['id' => $result]);
                    } else {
                        error_log("Failed to save AI booking to ai_bookings_success table");
                        error_log("Error details: " . json_encode(error_get_last()));
                        sendResponse(false, 'Failed to create AI booking', null, 500);
                    }
                    break;
                    
                case 'complete':
                    $bookingId = $input['booking_id'] ?? null;
                    if (!$bookingId) {
                        sendResponse(false, 'Booking ID required', null, 400);
                        return;
                    }
                    
                    // Check if this is an AI booking by checking if it exists in ai_bookings_success
                    require_once '../backend/models/AiBookingSuccess.php';
                    $aiBookingSuccess = new AiBookingSuccess($db);
                    
                    // Try to complete AI booking first
                    $aiResult = $aiBookingSuccess->completeBooking($bookingId);
                    if ($aiResult) {
                        sendResponse(true, 'AI booking completed successfully');
                        return;
                    }
                    
                    // Try to complete regular booking in bookings table
                    $query = "UPDATE bookings SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = :id";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(":id", $bookingId);
                    
                    if ($stmt->execute() && $stmt->rowCount() > 0) {
                        sendResponse(true, 'Booking completed successfully');
                        return;
                    }
                    
                    // If not found in any table, return error
                    sendResponse(false, 'Booking not found or already completed', null, 404);
                    break;
                    
                default:
                    sendResponse(false, 'Invalid action', null, 400);
            }
            break;
            
        case 'DELETE':
            // Handle DELETE requests for canceling bookings
            $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
            $pathParts = explode('/', trim($path, '/'));
            $endpoint = end($pathParts);
            
            if ($endpoint === 'ai-cancel') {
                // Cancel AI booking
                $aiId = $_GET['id'] ?? null;
                $cancelReason = $_GET['reason'] ?? null;
                
                if (!$aiId || !is_numeric($aiId)) {
                    sendResponse(false, 'AI booking ID required', null, 400);
                    return;
                }
                
                try {
                    $cancelled = false;
                    $message = '';
                    
                    // Try to cancel from ai_bookings_success table first
                    require_once '../backend/models/AiBookingSuccess.php';
                    $aiBookingSuccess = new AiBookingSuccess($db);
                    $result1 = $aiBookingSuccess->deleteBooking($aiId, $cancelReason);
                    
                    if ($result1) {
                        $cancelled = true;
                        $message = 'AI booking cancelled successfully from ai_bookings_success';
                    } else {
                        // Try to cancel from ai_booking_data table
                        require_once '../backend/models/Booking.php';
                        $booking = new Booking($db);
                        $result2 = $booking->deleteBooking($aiId, $cancelReason);
                        
                        if ($result2) {
                            $cancelled = true;
                            $message = 'AI booking cancelled successfully from ai_booking_data';
                        }
                    }
                    
                    if ($cancelled) {
                        sendResponse(true, $message);
                    } else {
                        sendResponse(false, 'AI booking not found or already deleted', null, 404);
                    }
                } catch (Exception $e) {
                    error_log("Error cancelling AI booking: " . $e->getMessage());
                    sendResponse(false, 'Internal server error', null, 500);
                }
            } elseif (is_numeric($endpoint)) {
                // Cancel regular booking
                $cancelReason = $_GET['reason'] ?? null;
                
                try {
                    // Update booking status to cancelled in bookings table
                    $query = "UPDATE bookings 
                             SET status = 'cancelled', cancel_reason = :cancel_reason, updated_at = CURRENT_TIMESTAMP 
                             WHERE id = :id";
                    
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':id', $endpoint);
                    $stmt->bindParam(':cancel_reason', $cancelReason);
                    
                    $result = $stmt->execute();
                    $rowCount = $stmt->rowCount();
                    
                    error_log("UPDATE bookings query executed for ID: $endpoint with reason: $cancelReason, Result: " . ($result ? 'true' : 'false') . ", Rows affected: $rowCount");
                    
                    if ($result && $rowCount > 0) {
                        sendResponse(true, 'Booking cancelled successfully');
                    } else {
                        sendResponse(false, 'Booking not found or already deleted', null, 404);
                    }
                } catch (Exception $e) {
                    error_log("Error cancelling regular booking: " . $e->getMessage());
                    sendResponse(false, 'Internal server error', null, 500);
                }
            } else {
                sendResponse(false, 'Invalid endpoint for DELETE request', null, 400);
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
