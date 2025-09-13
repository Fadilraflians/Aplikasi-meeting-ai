<?php
/**
 * Meeting Rooms API Endpoint
 * Menyediakan API untuk mengakses data ruangan meeting dari database
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
require_once '../models/MeetingRoom.php';

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
            
        case 'get_available':
            $startTime = $_GET['start_time'] ?? null;
            $endTime = $_GET['end_time'] ?? null;
            if (!$startTime || !$endTime) {
                sendResponse(false, 'Start time and end time required', null, 400);
                return;
            }
            
            // Get available rooms for the time period
            $availableRooms = getAvailableRoomsForTime($meetingRoom, $startTime, $endTime);
            sendResponse(true, 'Available rooms retrieved successfully', $availableRooms);
            break;
            
        case 'get_by_capacity':
            $minCapacity = $_GET['min_capacity'] ?? null;
            $maxCapacity = $_GET['max_capacity'] ?? null;
            if (!$minCapacity) {
                sendResponse(false, 'Minimum capacity required', null, 400);
                return;
            }
            $rooms = $meetingRoom->getRoomsByCapacity($minCapacity, $maxCapacity);
            sendResponse(true, 'Rooms retrieved successfully', $rooms);
            break;
            
        case 'get_by_floor':
            $floor = $_GET['floor'] ?? null;
            if (!$floor) {
                sendResponse(false, 'Floor required', null, 400);
                return;
            }
            $rooms = $meetingRoom->getRoomsByFloor($floor);
            sendResponse(true, 'Rooms retrieved successfully', $rooms);
            break;
            
        case 'get_by_facilities':
            $facilities = $_GET['facilities'] ?? null;
            if (!$facilities) {
                sendResponse(false, 'Facilities required', null, 400);
                return;
            }
            $facilitiesArray = explode(',', $facilities);
            $rooms = $meetingRoom->getRoomsByFacilities($facilitiesArray);
            sendResponse(true, 'Rooms retrieved successfully', $rooms);
            break;
            
        case 'search':
            $criteria = [
                'name' => $_GET['name'] ?? '',
                'floor' => $_GET['floor'] ?? '',
                'min_capacity' => $_GET['min_capacity'] ?? null,
                'max_capacity' => $_GET['max_capacity'] ?? null,
                'facilities' => $_GET['facilities'] ? explode(',', $_GET['facilities']) : []
            ];
            $rooms = $meetingRoom->searchRooms($criteria);
            sendResponse(true, 'Search results retrieved successfully', $rooms);
            break;
            
        case 'get_statistics':
            $roomId = $_GET['room_id'] ?? null;
            $stats = $meetingRoom->getRoomStatistics($roomId);
            sendResponse(true, 'Statistics retrieved successfully', $stats);
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
            $roomId = $input['room_id'] ?? null;
            $roomData = $input['room_data'] ?? null;
            if (!$roomId || !$roomData) {
                sendResponse(false, 'Room ID and room data required', null, 400);
                return;
            }
            $roomData['id'] = $roomId;
            $room = $meetingRoom->updateRoom($roomData);
            if ($room) {
                sendResponse(true, 'Room updated successfully', $room);
            } else {
                sendResponse(false, 'Failed to update room', null, 500);
            }
            break;
            
        case 'delete':
            $roomId = $input['room_id'] ?? null;
            if (!$roomId) {
                sendResponse(false, 'Room ID required', null, 400);
                return;
            }
            $result = $meetingRoom->deleteRoom($roomId);
            if ($result) {
                sendResponse(true, 'Room deleted successfully', null);
            } else {
                sendResponse(false, 'Failed to delete room', null, 500);
            }
            break;
            
        default:
            sendResponse(false, 'Invalid action', null, 400);
    }
}

function getAvailableRoomsForTime($meetingRoom, $startTime, $endTime) {
    try {
        // Get all rooms
        $allRooms = $meetingRoom->getAllRooms();
        
        // Filter rooms that are available during the specified time
        $availableRooms = [];
        
        foreach ($allRooms as $room) {
            // Check if room is available during the time period
            $availability = $meetingRoom->getRoomAvailability($room['id'], date('Y-m-d'), $startTime);
            
            // Simple availability check - in real implementation, you'd check against bookings
            if ($room['is_available'] && !$room['is_maintenance']) {
                $availableRooms[] = $room;
            }
        }
        
        return $availableRooms;
    } catch (Exception $e) {
        error_log("Error getting available rooms: " . $e->getMessage());
        return [];
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



