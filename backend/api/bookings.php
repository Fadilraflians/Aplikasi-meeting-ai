<?php
/**
 * Bookings API Endpoint
 * Handles both AI Agent and Form-based bookings
 * Adapted for spacio_meeting_db database structure
 */

// Set timezone to Asia/Jakarta
date_default_timezone_set('Asia/Jakarta');

header('Content-Type: application/json');
// CORS: allow only localhost:5173 and aplikasi-meeting-ai.test
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (!empty($origin)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    // Fallback when accessed directly (CLI or same-origin)
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';
require_once '../models/Booking.php';
require_once '../models/MeetingRoom.php';
require_once '../models/User.php';
require_once '../models/AiBookingSuccess.php';

$database = new Database();
$db = $database->getConnection();

$booking = new Booking($db);
$meetingRoom = new MeetingRoom($db);
$user = new User($db);
$aiBookingSuccess = new AiBookingSuccess($db);
// IMPORTANT: Lazy-load MongoDB model only for Mongo-specific endpoints
function getAiBookingMongoInstance() {
    if (!extension_loaded('mongodb')) {
        return null;
    }
    require_once __DIR__ . '/../models/AiBookingMongo.php';
    try {
        return new AiBookingMongo();
    } catch (Throwable $e) {
        error_log('Failed to init AiBookingMongo: ' . $e->getMessage());
        return null;
    }
}

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Get the endpoint (last part of URL)
$endpoint = end($pathParts);
// Get previous segment if needed (e.g., ai-booking-mongo/{id})
$prevSegment = (count($pathParts) >= 2) ? $pathParts[count($pathParts) - 2] : '';

// Debug logging
error_log("API Request - Method: $method, Path: $path, Endpoint: $endpoint, PrevSegment: $prevSegment");
error_log("Full REQUEST_URI: " . $_SERVER['REQUEST_URI']);
error_log("Path parts: " . json_encode($pathParts));



try {
    switch ($method) {
        case 'GET':
            if ($endpoint === 'bookings') {
                // Get all bookings from ai_booking_data table
                $result = $booking->getAllBookings();
                echo json_encode([
                    'status' => 'success',
                    'data' => $result
                ]);
            } elseif (is_numeric($endpoint)) {
                // Get specific booking by ID
                $result = $booking->getBookingById($endpoint);
                if ($result) {
                    echo json_encode([
                        'status' => 'success',
                        'data' => $result
                    ]);
                } else {
                    http_response_code(404);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'Booking not found'
                    ]);
                }
            } elseif ($endpoint === 'user') {
                // Get bookings by user ID
                $userId = $_GET['user_id'] ?? null;
                if ($userId) {
                    $result = $booking->getBookingsByUserId($userId);
                    echo json_encode([
                        'status' => 'success',
                        'data' => $result
                    ]);
                } else {
                    http_response_code(400);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'User ID required'
                    ]);
                }
            } elseif ($endpoint === 'rooms') {
                // Get all meeting rooms
                $result = $meetingRoom->getAllRooms();
                echo json_encode([
                    'status' => 'success',
                    'data' => $result
                ]);
            } elseif ($endpoint === 'availability') {
                // Check room availability
                $roomId = $_GET['room_id'] ?? null;
                $date = $_GET['date'] ?? null;
                $startTime = $_GET['start_time'] ?? null;
                $endTime = $_GET['end_time'] ?? null;
                
                if ($roomId && $date && $startTime && $endTime) {
                    $result = $booking->checkRoomAvailability($roomId, $date, $startTime, $endTime);
                    echo json_encode([
                        'status' => 'success',
                        'data' => $result
                    ]);
                } else {
                    http_response_code(400);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'Room ID, date, start time, and end time required'
                    ]);
                }
            } elseif ($endpoint === 'conversations') {
                // Get AI conversations
                $userId = $_GET['user_id'] ?? null;
                $sessionId = $_GET['session_id'] ?? null;
                
                $result = $booking->getAIConversations($userId, $sessionId);
                echo json_encode([
                    'status' => 'success',
                    'data' => $result
                ]);
            } elseif ($endpoint === 'ai-user') {
                // Get AI bookings from MongoDB by user ID
                $mongo = getAiBookingMongoInstance();
                if ($mongo === null) {
                    http_response_code(503);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'MongoDB extension not available'
                    ]);
                    break;
                }
                $userId = $_GET['user_id'] ?? null;
                if ($userId) {
                    $result = $mongo->getBookingsByUserId($userId);
                    echo json_encode([
                        'status' => 'success',
                        'data' => $result
                    ]);
                } else {
                    http_response_code(400);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'User ID required'
                    ]);
                }
            } elseif ($endpoint === 'ai-conversations-mongo') {
                // Get AI conversations from MongoDB
                $mongo = getAiBookingMongoInstance();
                if ($mongo === null) {
                    http_response_code(503);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'MongoDB extension not available'
                    ]);
                    break;
                }
                $userId = $_GET['user_id'] ?? null;
                $sessionId = $_GET['session_id'] ?? null;
                $result = $mongo->getConversations($userId, $sessionId);
                echo json_encode([
                    'status' => 'success',
                    'data' => $result
                ]);
            } elseif ($endpoint === 'auto-complete') {
                // Auto-complete expired bookings
                $currentTime = date('Y-m-d H:i:s');
                $totalUpdated = 0;
                $expiredBookings = [];
                
                // 1. Auto-complete AI bookings from ai_booking_data table
                $aiQuery = "SELECT id, topic, meeting_date, meeting_time, end_time 
                           FROM ai_booking_data 
                           WHERE booking_state = 'BOOKED' 
                           AND CONCAT(meeting_date, ' ', COALESCE(end_time, ADDTIME(meeting_time, SEC_TO_TIME(duration * 60)))) < :current_time";
                
                $aiStmt = $db->prepare($aiQuery);
                $aiStmt->bindParam(':current_time', $currentTime);
                $aiStmt->execute();
                
                $expiredAiBookings = $aiStmt->fetchAll(PDO::FETCH_ASSOC);
                
                if (!empty($expiredAiBookings)) {
                    // Update AI bookings to completed
                    $aiUpdateQuery = "UPDATE ai_booking_data 
                                     SET booking_state = 'COMPLETED', updated_at = CURRENT_TIMESTAMP 
                                     WHERE booking_state = 'BOOKED' 
                                     AND CONCAT(meeting_date, ' ', COALESCE(end_time, ADDTIME(meeting_time, SEC_TO_TIME(duration * 60)))) < :current_time";
                    
                    $aiUpdateStmt = $db->prepare($aiUpdateQuery);
                    $aiUpdateStmt->bindParam(':current_time', $currentTime);
                    
                    if ($aiUpdateStmt->execute()) {
                        $aiAffectedRows = $aiUpdateStmt->rowCount();
                        $totalUpdated += $aiAffectedRows;
                        $expiredBookings = array_merge($expiredBookings, $expiredAiBookings);
                    }
                }
                
                // 2. Auto-complete regular bookings from bookings table
                $regularQuery = "SELECT id, topic, meeting_date, start_time, end_time 
                                FROM bookings 
                                WHERE status = 'active' 
                                AND CONCAT(meeting_date, ' ', COALESCE(end_time, ADDTIME(start_time, '01:00:00'))) < :current_time";
                
                $regularStmt = $db->prepare($regularQuery);
                $regularStmt->bindParam(':current_time', $currentTime);
                $regularStmt->execute();
                
                $expiredRegularBookings = $regularStmt->fetchAll(PDO::FETCH_ASSOC);
                
                if (!empty($expiredRegularBookings)) {
                    // Update regular bookings to completed
                    $regularUpdateQuery = "UPDATE bookings 
                                           SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
                                           WHERE status = 'active' 
                                           AND CONCAT(meeting_date, ' ', COALESCE(end_time, ADDTIME(start_time, '01:00:00'))) < :current_time";
                    
                    $regularUpdateStmt = $db->prepare($regularUpdateQuery);
                    $regularUpdateStmt->bindParam(':current_time', $currentTime);
                    
                    if ($regularUpdateStmt->execute()) {
                        $regularAffectedRows = $regularUpdateStmt->rowCount();
                        $totalUpdated += $regularAffectedRows;
                        $expiredBookings = array_merge($expiredBookings, $expiredRegularBookings);
                    }
                }
                
                if ($totalUpdated === 0) {
                    echo json_encode([
                        'status' => 'success',
                        'message' => 'No expired bookings found',
                        'data' => []
                    ]);
                } else {
                    echo json_encode([
                        'status' => 'success',
                        'message' => "Updated {$totalUpdated} bookings to completed",
                        'data' => $expiredBookings
                    ]);
                }
            } elseif ($endpoint === 'ai-success') {
                // Get AI success bookings by user ID
                $userId = $_GET['user_id'] ?? null;
                if ($userId) {
                    $result = $aiBookingSuccess->getSuccessBookingsByUserId($userId);
                    echo json_encode([
                        'status' => 'success',
                        'data' => $result
                    ]);
                } else {
                    http_response_code(400);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'User ID required'
                    ]);
                }
            } elseif ($endpoint === 'ai-success-all') {
                // Get all AI success bookings
                $result = $aiBookingSuccess->getAllSuccessBookings();
                echo json_encode([
                    'status' => 'success',
                    'data' => $result
                ]);
            } elseif ($endpoint === 'ai-success-session') {
                // Get AI success booking by session ID
                $sessionId = $_GET['session_id'] ?? null;
                if ($sessionId) {
                    $result = $aiBookingSuccess->getSuccessBookingBySessionId($sessionId);
                    if ($result) {
                        echo json_encode([
                            'status' => 'success',
                            'data' => $result
                        ]);
                    } else {
                        http_response_code(404);
                        echo json_encode([
                            'status' => 'error',
                            'message' => 'Success booking not found'
                        ]);
                    }
                } else {
                    http_response_code(400);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'Session ID required'
                    ]);
                }
            } elseif ($endpoint === 'ai-data') {
                // Get AI booking data by user ID (from ai_booking_data table)
                $userId = $_GET['user_id'] ?? null;
                if ($userId) {
                    // Use AiBookingSuccess model to get data from ai_bookings_success table
                    $result = $aiBookingSuccess->getBookingsByUserId($userId);
                    echo json_encode([
                        'status' => 'success',
                        'data' => $result
                    ]);
                } else {
                    http_response_code(400);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'User ID required'
                    ]);
                }
            } elseif ($endpoint === 'room-bookings') {
                // Get bookings for a specific room
                $roomId = $_GET['room_id'] ?? null;
                $date = $_GET['date'] ?? date('Y-m-d');
                
                if ($roomId) {
                    $result = $booking->getRoomBookings($roomId, $date);
                    echo json_encode([
                        'status' => 'success',
                        'data' => $result
                    ]);
                } else {
                    http_response_code(400);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'Room ID required'
                    ]);
                }
            } else {
                http_response_code(404);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Endpoint not found'
                ]);
            }
            break;

        case 'POST':
            if ($endpoint === 'bookings') {
                // Create new booking (form-based)
                $data = json_decode(file_get_contents('php://input'), true);
                
                // Validate required fields (PIC wajib diisi)
                $requiredFields = ['user_id', 'room_id', 'topic', 'meeting_date', 'meeting_time', 'duration', 'participants', 'pic', 'meeting_type'];
                foreach ($requiredFields as $field) {
                    if (!isset($data[$field]) || empty($data[$field])) {
                        http_response_code(400);
                        echo json_encode([
                            'status' => 'error',
                            'message' => "Field '$field' is required"
                        ]);
                        exit;
                    }
                }

                // Check if room is available
                $isAvailable = $booking->checkRoomAvailability(
                    $data['room_id'], 
                    $data['meeting_date'], 
                    $data['meeting_time'], 
                    $data['duration']
                );

                if (!$isAvailable['available']) {
                    http_response_code(409);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'Room is not available for the selected time',
                        'data' => $isAvailable
                    ]);
                    exit;
                }

                // Create booking
                $result = $booking->createBooking($data);
                if ($result) {
                    echo json_encode([
                        'status' => 'success',
                        'message' => 'Booking created successfully',
                        'data' => $result
                    ]);
                } else {
                    http_response_code(500);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'Failed to create booking'
                    ]);
                }
            } elseif ($endpoint === 'form-booking') {
                // Create booking from form
                $data = json_decode(file_get_contents('php://input'), true);
                
                error_log("Form Booking request received: " . json_encode($data));
                
                // Validate form booking data (only essential fields)
                $requiredFields = ['user_id', 'session_id', 'room_id'];
                foreach ($requiredFields as $field) {
                    if (!isset($data[$field]) || empty($data[$field])) {
                        http_response_code(400);
                        echo json_encode([
                            'status' => 'error',
                            'message' => "Field '$field' is required"
                        ]);
                        exit;
                    }
                }

                // Check availability
                $isAvailable = $booking->checkRoomAvailability(
                    $data['room_id'], 
                    $data['meeting_date'], 
                    $data['meeting_time'], 
                    $data['duration']
                );

                if (!$isAvailable['available']) {
                    http_response_code(409);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'Room is not available for the selected time'
                    ]);
                    exit;
                }

                // Create form booking in ai_booking_data table only
                $result = $booking->createBooking($data);
                if ($result) {
                    echo json_encode([
                        'status' => 'success',
                        'message' => 'Form booking created successfully',
                        'data' => $result
                    ]);
                } else {
                    http_response_code(500);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'Failed to create form booking'
                    ]);
                }
            } elseif ($endpoint === 'ai-booking') {
                // Create booking from AI agent
                $data = json_decode(file_get_contents('php://input'), true);
                
                error_log("AI Booking request received: " . json_encode($data));
                
                // Validate AI booking data (only essential fields)
                $requiredFields = ['user_id', 'session_id', 'room_id'];
                foreach ($requiredFields as $field) {
                    if (!isset($data[$field]) || empty($data[$field])) {
                        http_response_code(400);
                        echo json_encode([
                            'status' => 'error',
                            'message' => "Field '$field' is required"
                        ]);
                        exit;
                    }
                }

                // Check availability with fallback logic
                $isAvailable = $booking->checkRoomAvailability(
                    $data['room_id'], 
                    $data['meeting_date'], 
                    $data['meeting_time'], 
                    $data['duration']
                );

                if (!$isAvailable['available']) {
                    error_log("Room not available, trying to find alternative time slots");
                    
                    // Try to find alternative time slots within 2 hours
                    $originalTime = $data['meeting_time'];
                    $timeParts = explode(':', $originalTime);
                    $originalHour = intval($timeParts[0]);
                    $originalMinute = intval($timeParts[1]);
                    
                    $alternativeFound = false;
                    
                    // Try 30-minute intervals for 2 hours
                    for ($offset = 30; $offset <= 120; $offset += 30) {
                        $newMinutes = $originalHour * 60 + $originalMinute + $offset;
                        $newHour = floor($newMinutes / 60);
                        $newMinute = $newMinutes % 60;
                        
                        // Check if within working hours (9-17)
                        if ($newHour >= 9 && $newHour <= 17) {
                            $newTime = sprintf('%02d:%02d:00', $newHour, $newMinute);
                            
                            $checkAlternative = $booking->checkRoomAvailability(
                                $data['room_id'], 
                                $data['meeting_date'], 
                                $newTime, 
                                $data['duration']
                            );
                            
                            if ($checkAlternative['available']) {
                                error_log("Found alternative time: $newTime");
                                $data['meeting_time'] = $newTime;
                                $alternativeFound = true;
                                break;
                            }
                        }
                    }
                    
                    if (!$alternativeFound) {
                        // Try to find alternative room with same capacity
                        error_log("No alternative time found, trying alternative room");
                        $currentRoom = $meetingRoom->getRoomById($data['room_id']);
                        $currentCapacity = $currentRoom['capacity'] ?? 10;
                        
                        $allRooms = $meetingRoom->getAllRooms();
                        foreach ($allRooms as $room) {
                            if ($room['id'] != $data['room_id'] && $room['capacity'] >= $currentCapacity) {
                                $checkAlternativeRoom = $booking->checkRoomAvailability(
                                    $room['id'], 
                                    $data['meeting_date'], 
                                    $data['meeting_time'], 
                                    $data['duration']
                                );
                                
                                if ($checkAlternativeRoom['available']) {
                                    error_log("Found alternative room: " . $room['name']);
                                    $data['room_id'] = $room['id'];
                                    $alternativeFound = true;
                                    break;
                                }
                            }
                        }
                    }
                    
                    if (!$alternativeFound) {
                        http_response_code(409);
                        echo json_encode([
                            'status' => 'error',
                            'message' => 'Room is not available for the selected time and no alternatives found',
                            'data' => $isAvailable
                        ]);
                        exit;
                    }
                }

                // Create AI booking
                $result = $booking->createAIBooking($data);
                if ($result) {
                    // Save AI conversation
                    $booking->saveAIConversation($data['user_id'], $data['session_id'], $data);
                    
                    // Save to ai_bookings_success table
                    require_once '../models/AiBookingSuccess.php';
                    $aiBookingSuccess = new AiBookingSuccess($db);
                    
                    // Get room name
                    $roomName = '';
                    if (isset($data['room_id'])) {
                        $roomResult = $meetingRoom->getRoomById($data['room_id']);
                        if ($roomResult) {
                            $roomName = $roomResult['name'] ?? $roomResult['room_name'] ?? '';
                        }
                    }
                    
                    // Prepare data for ai_bookings_success table
                    $successData = [
                        'user_id' => $data['user_id'],
                        'session_id' => $data['session_id'],
                        'room_id' => $data['room_id'],
                        'room_name' => $roomName,
                        'topic' => $data['topic'],
                        'pic' => $data['pic'] ?? '-',
                        'participants' => $data['participants'],
                        'meeting_date' => $data['meeting_date'],
                        'meeting_time' => $data['meeting_time'],
                        'duration' => $data['duration'],
                        'meeting_type' => $data['meeting_type'] ?? 'internal'
                    ];
                    
                    error_log("Saving to ai_bookings_success table: " . json_encode($successData));
                    
                    $successResult = $aiBookingSuccess->createSuccessBooking($successData);
                    
                    if ($successResult) {
                        error_log("AI booking saved successfully to ai_bookings_success table with ID: $successResult");
                    } else {
                        error_log("Failed to save AI booking to ai_bookings_success table");
                    }
                    
                    echo json_encode([
                        'status' => 'success',
                        'message' => 'AI booking created successfully',
                        'data' => $result,
                        'success_booking_id' => $successResult
                    ]);
                } else {
                    http_response_code(500);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'Failed to create AI booking'
                    ]);
                }
            } elseif ($endpoint === 'ai-booking-success') {
                // Save successful AI booking to ai_bookings_success table
                $data = json_decode(file_get_contents('php://input'), true);
                
                // Validate required fields (only essential ones)
                $requiredFields = ['user_id', 'session_id', 'room_id'];
                foreach ($requiredFields as $field) {
                    if (!isset($data[$field]) || empty($data[$field])) {
                        http_response_code(400);
                        echo json_encode([
                            'status' => 'error',
                            'message' => "Field '$field' is required"
                        ]);
                        exit;
                    }
                }

                // Save to ai_bookings_success table
                require_once '../models/AiBookingSuccess.php';
                $aiBookingSuccess = new AiBookingSuccess($db);
                
                // Get room name
                $roomName = '';
                if (isset($data['room_id'])) {
                    $roomResult = $meetingRoom->getRoomById($data['room_id']);
                    if ($roomResult) {
                        $roomName = $roomResult['name'] ?? $roomResult['room_name'] ?? '';
                    }
                }
                
                // Prepare data for ai_bookings_success table
                $successData = [
                    'user_id' => $data['user_id'],
                    'session_id' => $data['session_id'],
                    'room_id' => $data['room_id'],
                    'room_name' => $roomName,
                    'topic' => $data['topic'],
                    'pic' => $data['pic'] ?? '-',
                    'participants' => $data['participants'],
                    'meeting_date' => $data['meeting_date'],
                    'meeting_time' => $data['meeting_time'],
                    'duration' => $data['duration'],
                    'meeting_type' => $data['meeting_type'] ?? 'internal'
                ];
                
                $result = $aiBookingSuccess->createSuccessBooking($successData);
                if ($result) {
                    echo json_encode([
                        'status' => 'success',
                        'message' => 'AI booking saved to success table',
                        'data' => $result
                    ]);
                } else {
                    http_response_code(500);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'Failed to save AI booking to success table'
                    ]);
                }
            } elseif ($endpoint === 'ai-booking-mongo') {
                // Create AI booking in MongoDB
                $data = json_decode(file_get_contents('php://input'), true);
                
                // Validate AI booking data
                $requiredFields = ['user_id', 'session_id', 'room_id', 'topic', 'meeting_date', 'meeting_time', 'duration', 'participants', 'meeting_type'];
                foreach ($requiredFields as $field) {
                    if (!isset($data[$field]) || empty($data[$field])) {
                        http_response_code(400);
                        echo json_encode([
                            'status' => 'error',
                            'message' => "Field '$field' is required"
                        ]);
                        exit;
                    }
                }

                // Create AI booking in MongoDB
                $mongo = getAiBookingMongoInstance();
                if ($mongo === null) {
                    http_response_code(503);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'MongoDB extension not available'
                    ]);
                    break;
                }
                $result = $mongo->createAIBooking($data);
                if ($result) {
                    // Save AI conversation to MongoDB
                    $mongo->saveConversation(
                        $data['user_id'], 
                        $data['session_id'], 
                        "AI Agent created booking: " . $data['topic'],
                        'Booking created successfully',
                        $data['booking_state'] ?? 'BOOKED',
                        json_encode($data)
                    );
                    
                    echo json_encode([
                        'status' => 'success',
                        'message' => 'AI booking created successfully in MongoDB',
                        'data' => $result
                    ]);
                } else {
                    http_response_code(500);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'Failed to create AI booking in MongoDB'
                    ]);
                }
            } elseif ($endpoint === 'ai-conversations-mongo') {
                // Save AI conversation to MongoDB
                $data = json_decode(file_get_contents('php://input'), true);
                
                $requiredFields = ['user_id', 'session_id', 'message', 'response', 'booking_state'];
                foreach ($requiredFields as $field) {
                    if (!isset($data[$field])) {
                        http_response_code(400);
                        echo json_encode([
                            'status' => 'error',
                            'message' => "Field '$field' is required"
                        ]);
                        exit;
                    }
                }

                $result = $aiBookingMongo->saveConversation(
                    $data['user_id'],
                    $data['session_id'],
                    $data['message'],
                    $data['response'],
                    $data['booking_state'],
                    $data['booking_data'] ?? ''
                );

                if ($result) {
                    echo json_encode([
                        'status' => 'success',
                        'message' => 'AI conversation saved to MongoDB'
                    ]);
                } else {
                    http_response_code(500);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'Failed to save AI conversation to MongoDB'
                    ]);
                }
            } elseif ($endpoint === 'rooms') {
                $data = json_decode(file_get_contents('php://input'), true);
                
                // Check if this is an update request
                if (isset($data['action']) && $data['action'] === 'update') {
                    // Update room
                    error_log("Update room request received: " . json_encode($data));
                    
                    if (!$data || !isset($data['id'])) {
                        http_response_code(400);
                        echo json_encode([
                            'status' => 'error',
                            'message' => 'Room ID required'
                        ]);
                        exit;
                    }
                    
                    $result = $meetingRoom->updateRoom($data);
                    if ($result) {
                        echo json_encode([
                            'status' => 'success',
                            'message' => 'Room updated successfully',
                            'data' => $result
                        ]);
                    } else {
                        http_response_code(500);
                        echo json_encode([
                            'status' => 'error',
                            'message' => 'Failed to update room'
                        ]);
                    }
                } else {
                    // Create new room
                    error_log("Create room request received: " . json_encode($data));
                    
                    // Validate required fields
                    $requiredFields = ['name', 'capacity', 'address'];
                    foreach ($requiredFields as $field) {
                        if (!isset($data[$field]) || empty($data[$field])) {
                            http_response_code(400);
                            echo json_encode([
                                'status' => 'error',
                                'message' => "Field '$field' is required"
                            ]);
                            exit;
                        }
                    }
                    
                    // Create room
                    $result = $meetingRoom->createRoom($data);
                    if ($result) {
                        echo json_encode([
                            'status' => 'success',
                            'message' => 'Room created successfully',
                            'data' => $result
                        ]);
                    } else {
                        http_response_code(500);
                        echo json_encode([
                            'status' => 'error',
                            'message' => 'Failed to create room'
                        ]);
                    }
                }
            } else {
                http_response_code(404);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Endpoint not found'
                ]);
            }
            break;

        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Debug logging
            error_log('PUT request - Endpoint: ' . $endpoint . ', Data: ' . json_encode($data));
            error_log('PUT request - Checking room update conditions...');
            error_log('Endpoint === rooms: ' . ($endpoint === 'rooms' ? 'true' : 'false'));
            error_log('Has name field: ' . (isset($data['name']) ? 'true' : 'false'));
            error_log('Has floor field: ' . (isset($data['floor']) ? 'true' : 'false'));
            error_log('Has capacity field: ' . (isset($data['capacity']) ? 'true' : 'false'));
            error_log('Has address field: ' . (isset($data['address']) ? 'true' : 'false'));
            
            // Check if this is a room update request
            if ($endpoint === 'rooms' || (isset($data['name']) && isset($data['floor']) && isset($data['capacity']) && isset($data['address']))) {
                // This is a room update request
                if (!$data || !isset($data['id'])) {
                    http_response_code(400);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'Room ID required'
                    ]);
                    break;
                }
                
                $result = $meetingRoom->updateRoom($data);
                error_log('Update room result: ' . json_encode($result));
                
                if ($result) {
                    echo json_encode([
                        'status' => 'success',
                        'message' => 'Room updated successfully',
                        'data' => $result
                    ]);
                } else {
                    http_response_code(500);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'Failed to update room'
                    ]);
                }
            } elseif (is_numeric($endpoint)) {
                // Update booking
                $data = json_decode(file_get_contents('php://input'), true);
                $data['id'] = $endpoint;
                
                $result = $booking->updateBooking($data);
                if ($result) {
                    echo json_encode([
                        'status' => 'success',
                        'message' => 'Booking updated successfully',
                        'data' => $result
                    ]);
                } else {
                    http_response_code(500);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'Failed to update booking'
                    ]);
                }
            } else {
                error_log('PUT request - No matching condition found');
                error_log('PUT request - Endpoint: ' . $endpoint . ', Data keys: ' . json_encode(array_keys($data)));
                http_response_code(404);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Endpoint not found for PUT request',
                    'debug' => [
                        'endpoint' => $endpoint,
                        'data_keys' => array_keys($data),
                        'has_room_fields' => isset($data['name']) && isset($data['floor']) && isset($data['capacity']) && isset($data['address'])
                    ]
                ]);
            }
            break;

        case 'DELETE':
            if (is_numeric($endpoint)) {
                // Delete booking (MySQL)
                $result = $booking->deleteBooking($endpoint);
                if ($result) {
                    echo json_encode([
                        'status' => 'success',
                        'message' => 'Booking deleted successfully'
                    ]);
                } else {
                    http_response_code(500);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'Failed to delete booking'
                    ]);
                }
            } elseif ($endpoint === 'ai-cancel') {
                // Cancel AI booking from ai_bookings_success table
                $aiId = $_GET['id'] ?? null;
                if (!$aiId || !is_numeric($aiId)) {
                    http_response_code(400);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'AI booking ID required'
                    ]);
                    break;
                }
                
                try {
                    // Log untuk debug
                    error_log("API: Attempting to delete AI booking with ID: $aiId");
                    
                    // Lakukan delete langsung tanpa transaction
                    $deleteStmt = $db->prepare("DELETE FROM ai_bookings_success WHERE id = ?");
                    $result = $deleteStmt->execute([$aiId]);
                    $rowCount = $deleteStmt->rowCount();
                    
                    error_log("API: Delete result: " . ($result ? 'true' : 'false') . ", Rows affected: $rowCount");
                    
                    if ($result && $rowCount > 0) {
                        echo json_encode([
                            'status' => 'success',
                            'message' => 'AI booking cancelled successfully',
                            'debug' => [
                                'id' => $aiId,
                                'rows_affected' => $rowCount
                            ]
                        ]);
                    } else {
                        http_response_code(404);
                        echo json_encode([
                            'status' => 'error',
                            'message' => 'AI booking not found or already deleted',
                            'debug' => [
                                'id' => $aiId,
                                'result' => $result,
                                'row_count' => $rowCount
                            ]
                        ]);
                    }
                } catch (Exception $e) {
                    error_log("API: Error deleting AI booking: " . $e->getMessage());
                    http_response_code(500);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'Internal server error',
                        'debug' => $e->getMessage()
                    ]);
                }
            } elseif ($prevSegment === 'ai-booking-mongo' && preg_match('/^[a-f0-9]{24}$/i', $endpoint)) {
                // Cancel AI booking in MongoDB
                $mongo = getAiBookingMongoInstance();
                if ($mongo === null) {
                    http_response_code(503);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'MongoDB extension not available'
                    ]);
                    break;
                }
                $ok = $mongo->cancelBooking($endpoint);
                if ($ok) {
                    echo json_encode([
                        'status' => 'success',
                        'message' => 'AI booking cancelled'
                    ]);
                } else {
                    http_response_code(500);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'Failed to cancel AI booking'
                    ]);
                }
            } elseif ($endpoint === 'rooms') {
                // Delete room
                $roomId = $_GET['id'] ?? null;
                if (!$roomId || !is_numeric($roomId)) {
                    http_response_code(400);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'Room ID required'
                    ]);
                    break;
                }
                
                $result = $meetingRoom->deleteRoom($roomId);
                if ($result) {
                    echo json_encode([
                        'status' => 'success',
                        'message' => 'Room deleted successfully'
                    ]);
                } else {
                    http_response_code(500);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'Failed to delete room'
                    ]);
                }
            } else {
                http_response_code(404);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Endpoint not found'
                ]);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode([
                'status' => 'error',
                'message' => 'Method not allowed'
            ]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Internal server error',
        'debug' => $e->getMessage()
    ]);
}

$database->closeConnection();
?>
