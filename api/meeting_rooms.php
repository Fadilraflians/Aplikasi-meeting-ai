<?php
/**
 * Meeting Rooms API
 * API untuk mengakses data ruangan meeting dari frontend
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
require_once '../backend/models/MeetingRoom.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    $meetingRoom = new MeetingRoom($db);
    
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? '';
    
    switch ($method) {
        case 'GET':
            handleGetRequest($meetingRoom, $action);
            break;
        case 'POST':
            handlePostRequest($meetingRoom);
            break;
        case 'DELETE':
            handleDeleteRequest($meetingRoom);
            break;
        default:
            sendResponse(false, 'Method not allowed', null, 405);
    }
    
} catch (Exception $e) {
    error_log("Meeting Rooms API Error: " . $e->getMessage());
    sendResponse(false, 'Internal server error', null, 500);
}

function handleGetRequest($meetingRoom, $action) {
    switch ($action) {
        case 'get_all':
            $rooms = $meetingRoom->getAllRooms();
            sendResponse(true, 'Rooms retrieved successfully', $rooms);
            break;
            
        case 'get_by_id':
            $roomId = $_GET['room_id'] ?? null;
            if (!$roomId) {
                sendResponse(false, 'Room ID required', null, 400);
                return;
            }
            $room = $meetingRoom->getRoomById($roomId);
            if ($room) {
                sendResponse(true, 'Room retrieved successfully', $room);
            } else {
                sendResponse(false, 'Room not found', null, 404);
            }
            break;
            
        default:
            // Default: get all rooms
            $rooms = $meetingRoom->getAllRooms();
            sendResponse(true, 'Rooms retrieved successfully', $rooms);
    }
}

function handlePostRequest($meetingRoom) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendResponse(false, 'Invalid JSON input', null, 400);
        return;
    }
    
    $action = $input['action'] ?? '';
    
    switch ($action) {
        case 'create':
            $roomData = $input['room_data'] ?? null;
            if (!$roomData) {
                sendResponse(false, 'Room data required', null, 400);
                return;
            }
            $room = $meetingRoom->createRoom($roomData);
            if ($room) {
                sendResponse(true, 'Room created successfully', $room);
            } else {
                sendResponse(false, 'Failed to create room', null, 500);
            }
            break;
            
        case 'update':
            $roomData = $input;
            if (!$roomData || !isset($roomData['id'])) {
                sendResponse(false, 'Room ID required', null, 400);
                return;
            }
            $room = $meetingRoom->updateRoom($roomData);
            if ($room) {
                sendResponse(true, 'Room updated successfully', $room);
            } else {
                sendResponse(false, 'Failed to update room', null, 500);
            }
            break;
            
        default:
            sendResponse(false, 'Invalid action', null, 400);
    }
}

function handleDeleteRequest($meetingRoom) {
    // Get room ID from query parameter
    $roomId = $_GET['id'] ?? null;
    
    if (!$roomId) {
        sendResponse(false, 'Room ID required', null, 400);
        return;
    }
    
    // Validate room ID
    if (!is_numeric($roomId)) {
        sendResponse(false, 'Invalid room ID', null, 400);
        return;
    }
    
    // Check if room exists
    $room = $meetingRoom->getRoomById($roomId);
    if (!$room) {
        sendResponse(false, 'Room not found', null, 404);
        return;
    }
    
    // Delete the room
    $result = $meetingRoom->deleteRoom($roomId);
    if ($result) {
        sendResponse(true, 'Room deleted successfully', null);
    } else {
        sendResponse(false, 'Failed to delete room', null, 500);
    }
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
