<?php
/**
 * AI Booking API Endpoint
 * Handles saving and retrieving booking data from AI assistant
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
        if (!isset($data['user_id']) || !isset($data['session_id'])) {
            echo json_encode([
                'success' => false,
                'message' => 'Missing required fields'
            ]);
            exit;
        }
        
        // Save or update booking data
        try {
            // Check if record exists
            $checkQuery = "SELECT id FROM ai_booking_data 
                           WHERE user_id = :user_id AND session_id = :session_id";
            
            $checkStmt = $conn->prepare($checkQuery);
            $checkStmt->bindParam(':user_id', $data['user_id']);
            $checkStmt->bindParam(':session_id', $data['session_id']);
            $checkStmt->execute();
            
            // Get room_id if room_name is provided
            $roomId = null;
            if (isset($data['room_name'])) {
                $roomQuery = "SELECT id FROM meeting_rooms WHERE room_name = :room_name";
                $roomStmt = $conn->prepare($roomQuery);
                $roomStmt->bindParam(':room_name', $data['room_name']);
                $roomStmt->execute();
                
                if ($roomStmt->rowCount() > 0) {
                    $room = $roomStmt->fetch(PDO::FETCH_ASSOC);
                    $roomId = $room['id'];
                }
            } elseif (isset($data['room_id'])) {
                $roomId = $data['room_id'];
            }
            
            if ($checkStmt->rowCount() > 0) {
                // Update existing record
                $existingRecord = $checkStmt->fetch(PDO::FETCH_ASSOC);
                
                $updateQuery = "UPDATE ai_booking_data 
                               SET room_id = :room_id, 
                                   topic = :topic, 
                                   meeting_date = :meeting_date, 
                                   meeting_time = :meeting_time, 
                                   duration = :duration, 
                                   participants = :participants, 
                                   meeting_type = :meeting_type, 
                                   food_order = :food_order, 
                                   booking_state = :booking_state, 
                                   updated_at = CURRENT_TIMESTAMP 
                               WHERE id = :id";
                
                $updateStmt = $conn->prepare($updateQuery);
                $updateStmt->bindParam(':id', $existingRecord['id']);
                $updateStmt->bindParam(':room_id', $roomId);
                $updateStmt->bindParam(':topic', $data['topic']);
                $updateStmt->bindParam(':meeting_date', $data['meeting_date']);
                // Format meeting_time to ensure it's in valid TIME format (HH:MM:SS)
                $meetingTime = isset($data['meeting_time']) ? trim($data['meeting_time']) : null;
                // Remove any non-time characters and ensure proper format
                if ($meetingTime && preg_match('/^(\d{1,2}):(\d{1,2})(?::\d{1,2})?$/', $meetingTime, $matches)) {
                    $formattedTime = sprintf('%02d:%02d:00', $matches[1], $matches[2]);
                    $updateStmt->bindParam(':meeting_time', $formattedTime);
                } else {
                    $defaultTime = '09:00:00';
                    $updateStmt->bindParam(':meeting_time', $defaultTime);
                }
                $updateStmt->bindParam(':duration', $data['duration']);
                $updateStmt->bindParam(':participants', $data['participants']);
                $updateStmt->bindParam(':meeting_type', $data['meeting_type']);
                $updateStmt->bindParam(':food_order', $data['food_order']);
                $updateStmt->bindParam(':booking_state', $data['booking_state']);
                
                if ($updateStmt->execute()) {
                    echo json_encode([
                        'success' => true,
                        'message' => 'Booking data updated successfully',
                        'booking_id' => $existingRecord['id']
                    ]);
                } else {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Failed to update booking data'
                    ]);
                }
            } else {
                // Insert new record
                $insertQuery = "INSERT INTO ai_booking_data 
                               (user_id, session_id, room_id, topic, meeting_date, meeting_time, 
                                duration, participants, meeting_type, food_order, booking_state) 
                               VALUES 
                               (:user_id, :session_id, :room_id, :topic, :meeting_date, :meeting_time, 
                                :duration, :participants, :meeting_type, :food_order, :booking_state)";
                
                $insertStmt = $conn->prepare($insertQuery);
                $insertStmt->bindParam(':user_id', $data['user_id']);
                $insertStmt->bindParam(':session_id', $data['session_id']);
                $insertStmt->bindParam(':room_id', $roomId);
                $insertStmt->bindParam(':topic', $data['topic']);
                $insertStmt->bindParam(':meeting_date', $data['meeting_date']);
                // Format meeting_time to ensure it's in valid TIME format (HH:MM:SS)
                $meetingTime = isset($data['meeting_time']) ? trim($data['meeting_time']) : null;
                // Remove any non-time characters and ensure proper format
                if ($meetingTime && preg_match('/^(\d{1,2}):(\d{1,2})(?::\d{1,2})?$/', $meetingTime, $matches)) {
                    $formattedTime = sprintf('%02d:%02d:00', $matches[1], $matches[2]);
                    $insertStmt->bindParam(':meeting_time', $formattedTime);
                } else {
                    $defaultTime = '09:00:00';
                    $insertStmt->bindParam(':meeting_time', $defaultTime);
                }
                $insertStmt->bindParam(':duration', $data['duration']);
                $insertStmt->bindParam(':participants', $data['participants']);
                $insertStmt->bindParam(':meeting_type', $data['meeting_type']);
                $insertStmt->bindParam(':food_order', $data['food_order']);
                $insertStmt->bindParam(':booking_state', $data['booking_state']);
                
                if ($insertStmt->execute()) {
                    echo json_encode([
                        'success' => true,
                        'message' => 'Booking data saved successfully',
                        'booking_id' => $conn->lastInsertId()
                    ]);
                } else {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Failed to save booking data'
                    ]);
                }
            }
            
            // If booking state is BOOKED, create actual reservation
            if ($data['booking_state'] === 'BOOKED' && $roomId && isset($data['meeting_date']) && isset($data['meeting_time'])) {
                createReservation($conn, $data, $roomId);
            }
        } catch (PDOException $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Database error: ' . $e->getMessage()
            ]);
        }
        break;
        
    case 'GET':
        // Get booking data for a user and session
        if (!isset($_GET['user_id'])) {
            echo json_encode([
                'success' => false,
                'message' => 'Missing required parameters'
            ]);
            exit;
        }
        
        try {
            $query = "SELECT abd.*, mr.room_name 
                      FROM ai_booking_data abd 
                      LEFT JOIN meeting_rooms mr ON abd.room_id = mr.id 
                      WHERE abd.user_id = :user_id";
            
            $params = [':user_id' => $_GET['user_id']];
            
            // Add session_id filter if provided
            if (isset($_GET['session_id'])) {
                $query .= " AND abd.session_id = :session_id";
                $params[':session_id'] = $_GET['session_id'];
            }
            
            $query .= " ORDER BY abd.updated_at DESC";
            
            $stmt = $conn->prepare($query);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();
            
            $bookingData = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'data' => $bookingData
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
 * Create actual reservation in reservations table
 */
function createReservation($conn, $data, $roomId) {
    try {
        // Calculate end time based on duration (default 1 hour)
        $duration = isset($data['duration']) ? $data['duration'] : 60; // minutes
        $startDateTime = $data['meeting_date'] . ' ' . $data['meeting_time'];
        $endDateTime = date('Y-m-d H:i:s', strtotime($startDateTime . ' +' . $duration . ' minutes'));
        
        $query = "INSERT INTO reservations 
                  (room_id, user_id, title, description, start_time, end_time, 
                   attendees, meeting_type, food_order, status, created_by_ai) 
                  VALUES 
                  (:room_id, :user_id, :title, :description, :start_time, :end_time, 
                   :attendees, :meeting_type, :food_order, 'confirmed', 1)";
        
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':room_id', $roomId);
        $stmt->bindParam(':user_id', $data['user_id']);
        $stmt->bindParam(':title', $data['topic']);
        $description = 'Dibuat melalui AI Assistant';
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':start_time', $startDateTime);
        $stmt->bindParam(':end_time', $endDateTime);
        $stmt->bindParam(':attendees', $data['participants']);
        $stmt->bindParam(':meeting_type', $data['meeting_type']);
        $stmt->bindParam(':food_order', $data['food_order']);
        
        $stmt->execute();
        return $conn->lastInsertId();
    } catch (PDOException $e) {
        // Log error but don't stop execution
        error_log('Error creating reservation: ' . $e->getMessage());
        return false;
    }
}