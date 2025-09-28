<?php
/**
 * AI Conversation API Endpoint
 * Handles saving conversation history and booking data from AI assistant
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include database connection
require_once '../../config/database.php';

// Initialize database connection
$database = new Database();
$conn = $database->getConnection();

if (!$conn) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed'
    ]);
    exit;
}

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

// Handle different request methods
switch ($method) {
    case 'POST':
        // Get JSON data from request body
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            echo json_encode([
                'success' => false,
                'message' => 'Invalid JSON data'
            ]);
            exit;
        }
        
        // Check required fields
        if (!isset($data['user_id']) || !isset($data['session_id']) || !isset($data['message'])) {
            echo json_encode([
                'success' => false,
                'message' => 'Missing required fields'
            ]);
            exit;
        }
        
        // Save conversation to database
        try {
            $query = "INSERT INTO ai_conversations (user_id, session_id, message, response, booking_state, booking_data) 
                      VALUES (:user_id, :session_id, :message, :response, :booking_state, :booking_data)";
            
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':user_id', $data['user_id']);
            $stmt->bindParam(':session_id', $data['session_id']);
            $stmt->bindParam(':message', $data['message']);
            $stmt->bindParam(':response', $data['response']);
            $stmt->bindParam(':booking_state', $data['booking_state']);
            
            // Convert booking data to JSON string
            $bookingData = isset($data['booking_data']) ? json_encode($data['booking_data']) : null;
            $stmt->bindParam(':booking_data', $bookingData);
            
            if ($stmt->execute()) {
                // If booking data exists and state is BOOKED, update ai_booking_data table
                if (isset($data['booking_data']) && isset($data['booking_state']) && $data['booking_state'] === 'BOOKED') {
                    updateBookingData($conn, $data);
                }
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Conversation saved successfully',
                    'conversation_id' => $conn->lastInsertId()
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to save conversation'
                ]);
            }
        } catch (PDOException $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Database error: ' . $e->getMessage()
            ]);
        }
        break;
        
    case 'GET':
        // Get conversation history for a user and session
        if (!isset($_GET['user_id']) || !isset($_GET['session_id'])) {
            echo json_encode([
                'success' => false,
                'message' => 'Missing required parameters'
            ]);
            exit;
        }
        
        try {
            $query = "SELECT * FROM ai_conversations 
                      WHERE user_id = :user_id AND session_id = :session_id 
                      ORDER BY created_at ASC";
            
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':user_id', $_GET['user_id']);
            $stmt->bindParam(':session_id', $_GET['session_id']);
            $stmt->execute();
            
            $conversations = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'data' => $conversations
            ]);
        } catch (PDOException $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Database error: ' . $e->getMessage()
            ]);
        }
        break;
        
    default:
        echo json_encode([
            'success' => false,
            'message' => 'Method not allowed'
        ]);
        break;
}

/**
 * Update booking data in ai_booking_data table
 */
function updateBookingData($conn, $data) {
    try {
        // Check if record exists
        $checkQuery = "SELECT id FROM ai_booking_data 
                       WHERE user_id = :user_id AND session_id = :session_id";
        
        $checkStmt = $conn->prepare($checkQuery);
        $checkStmt->bindParam(':user_id', $data['user_id']);
        $checkStmt->bindParam(':session_id', $data['session_id']);
        $checkStmt->execute();
        
        $bookingData = $data['booking_data'];
        $roomId = null;
        
        // If room name is provided, get room_id
        if (isset($bookingData['roomName'])) {
            $roomQuery = "SELECT id FROM meeting_rooms WHERE room_name = :room_name";
            $roomStmt = $conn->prepare($roomQuery);
            $roomStmt->bindParam(':room_name', $bookingData['roomName']);
            $roomStmt->execute();
            
            if ($roomStmt->rowCount() > 0) {
                $room = $roomStmt->fetch(PDO::FETCH_ASSOC);
                $roomId = $room['id'];
            }
        }
        
        // Parse date and time
        $meetingDate = isset($bookingData['date']) ? $bookingData['date'] : null;
        $meetingTime = isset($bookingData['time']) ? trim($bookingData['time']) : null;

        // Normalize meeting_time to HH:MM:SS if possible
        if ($meetingTime) {
            // If time is a range like "09:00 - 10:00", take the start time
            if (preg_match('/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/', $meetingTime, $m)) {
                $meetingTime = $m[1];
            }
            // Ensure proper format HH:MM:SS
            if (preg_match('/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/', $meetingTime, $matches)) {
                $meetingTime = sprintf('%02d:%02d:00', $matches[1], $matches[2]);
            } else {
                $meetingTime = '09:00:00';
            }
        }
        $participants = isset($bookingData['participants']) ? $bookingData['participants'] : null;
        $topic = isset($bookingData['topic']) ? $bookingData['topic'] : null;
        $meetingType = isset($bookingData['meetingType']) ? $bookingData['meetingType'] : 'internal';
        $foodOrder = isset($bookingData['foodOrder']) ? $bookingData['foodOrder'] : 'tidak';
        $bookingState = isset($data['booking_state']) ? $data['booking_state'] : 'IDLE';
        
        if ($checkStmt->rowCount() > 0) {
            // Update existing record
            $existingRecord = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            $updateQuery = "UPDATE ai_booking_data 
                           SET room_id = :room_id, 
                               topic = :topic, 
                               meeting_date = :meeting_date, 
                               meeting_time = :meeting_time, 
                               participants = :participants, 
                               meeting_type = :meeting_type, 
                               food_order = :food_order, 
                               booking_state = :booking_state, 
                               updated_at = CURRENT_TIMESTAMP 
                           WHERE id = :id";
            
            $updateStmt = $conn->prepare($updateQuery);
            $updateStmt->bindParam(':id', $existingRecord['id']);
            $updateStmt->bindParam(':room_id', $roomId);
            $updateStmt->bindParam(':topic', $topic);
            $updateStmt->bindParam(':meeting_date', $meetingDate);
            $updateStmt->bindParam(':meeting_time', $meetingTime);
            $updateStmt->bindParam(':participants', $participants);
            $updateStmt->bindParam(':meeting_type', $meetingType);
            $updateStmt->bindParam(':food_order', $foodOrder);
            $updateStmt->bindParam(':booking_state', $bookingState);
            $updateStmt->execute();
        } else {
            // Insert new record
            $insertQuery = "INSERT INTO ai_booking_data 
                           (user_id, session_id, room_id, topic, meeting_date, meeting_time, 
                            participants, meeting_type, food_order, booking_state) 
                           VALUES 
                           (:user_id, :session_id, :room_id, :topic, :meeting_date, :meeting_time, 
                            :participants, :meeting_type, :food_order, :booking_state)";
            
            $insertStmt = $conn->prepare($insertQuery);
            $insertStmt->bindParam(':user_id', $data['user_id']);
            $insertStmt->bindParam(':session_id', $data['session_id']);
            $insertStmt->bindParam(':room_id', $roomId);
            $insertStmt->bindParam(':topic', $topic);
            $insertStmt->bindParam(':meeting_date', $meetingDate);
            $insertStmt->bindParam(':meeting_time', $meetingTime);
            $insertStmt->bindParam(':participants', $participants);
            $insertStmt->bindParam(':meeting_type', $meetingType);
            $insertStmt->bindParam(':food_order', $foodOrder);
            $insertStmt->bindParam(':booking_state', $bookingState);
            $insertStmt->execute();
        }
        
        // If booking state is BOOKED, create actual reservation
        if ($bookingState === 'BOOKED' && $roomId && $meetingDate && $meetingTime) {
            createReservation($conn, $data, $roomId);
        }
        
        return true;
    } catch (PDOException $e) {
        // Log error but don't stop execution
        error_log('Error updating booking data: ' . $e->getMessage());
        return false;
    }
}

/**
 * Create actual reservation in reservations table
 */
function createReservation($conn, $data, $roomId) {
    try {
        $bookingData = $data['booking_data'];
        
        // Calculate end time (default 1 hour duration)
        $startDateTime = $bookingData['date'] . ' ' . $bookingData['time'];
        $endDateTime = date('Y-m-d H:i:s', strtotime($startDateTime . ' +1 hour'));
        
        $query = "INSERT INTO reservations 
                  (room_id, user_id, title, description, start_time, end_time, 
                   attendees, meeting_type, food_order, status, created_by_ai) 
                  VALUES 
                  (:room_id, :user_id, :title, :description, :start_time, :end_time, 
                   :attendees, :meeting_type, :food_order, 'confirmed', 1)";
        
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':room_id', $roomId);
        $stmt->bindParam(':user_id', $data['user_id']);
        $stmt->bindParam(':title', $bookingData['topic']);
        $description = 'Dibuat melalui AI Assistant';
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':start_time', $startDateTime);
        $stmt->bindParam(':end_time', $endDateTime);
        $stmt->bindParam(':attendees', $bookingData['participants']);
        $meetingType = isset($bookingData['meetingType']) ? $bookingData['meetingType'] : 'internal';
        $stmt->bindParam(':meeting_type', $meetingType);
        $foodOrder = isset($bookingData['foodOrder']) ? $bookingData['foodOrder'] : 'tidak';
        $stmt->bindParam(':food_order', $foodOrder);
        
        $stmt->execute();
        return true;
    } catch (PDOException $e) {
        // Log error but don't stop execution
        error_log('Error creating reservation: ' . $e->getMessage());
        return false;
    }
}