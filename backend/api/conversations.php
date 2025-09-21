<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get the request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['REQUEST_URI'];

// Parse the path to get the endpoint
$pathParts = explode('/', trim($path, '/'));
$endpoint = end($pathParts);

// Simple in-memory storage for conversations (in production, use database)
$conversations = [];

// Handle different endpoints
switch ($method) {
    case 'GET':
        if ($endpoint === 'conversations') {
            // Get all conversations
            echo json_encode([
                'status' => 'success',
                'data' => $conversations
            ]);
        } elseif (strpos($path, '/conversations/') !== false) {
            // Get specific conversation by session ID
            $sessionId = $endpoint;
            $conversation = null;
            
            // Find conversation by session ID
            foreach ($conversations as $conv) {
                if ($conv['sessionId'] === $sessionId) {
                    $conversation = $conv;
                    break;
                }
            }
            
            if ($conversation) {
                echo json_encode([
                    'status' => 'success',
                    'data' => $conversation
                ]);
            } else {
                http_response_code(404);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Conversation not found'
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
        if ($endpoint === 'conversations') {
            // Create new conversation
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                http_response_code(400);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Invalid JSON input'
                ]);
                exit();
            }
            
            // Generate ID
            $id = 'conv_' . uniqid();
            
            // Create conversation object
            $conversation = [
                'id' => $id,
                'sessionId' => $input['sessionId'] ?? 'session-' . uniqid(),
                'userId' => $input['userId'] ?? 'user-1',
                'startTime' => $input['startTime'] ?? date('c'),
                'endTime' => $input['endTime'] ?? null,
                'messages' => $input['messages'] ?? [],
                'status' => $input['status'] ?? 'active',
                'bookingStatus' => $input['bookingStatus'] ?? 'none',
                'extractedBookingData' => $input['extractedBookingData'] ?? null,
                'createdAt' => date('c'),
                'updatedAt' => date('c')
            ];
            
            // Store conversation (in production, save to database)
            $conversations[] = $conversation;
            
            echo json_encode([
                'status' => 'success',
                'data' => $conversation
            ]);
        } else {
            http_response_code(404);
            echo json_encode([
                'status' => 'error',
                'message' => 'Endpoint not found'
            ]);
        }
        break;
        
    case 'PUT':
        if (strpos($path, '/conversations/') !== false) {
            // Update conversation
            $sessionId = $endpoint;
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                http_response_code(400);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Invalid JSON input'
                ]);
                exit();
            }
            
            // Find and update conversation
            $found = false;
            foreach ($conversations as &$conv) {
                if ($conv['sessionId'] === $sessionId) {
                    $conv = array_merge($conv, $input);
                    $conv['updatedAt'] = date('c');
                    $found = true;
                    break;
                }
            }
            
            if ($found) {
                echo json_encode([
                    'status' => 'success',
                    'data' => $conv
                ]);
            } else {
                http_response_code(404);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Conversation not found'
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
?>





