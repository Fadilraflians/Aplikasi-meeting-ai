<?php
/**
 * Simple Conversations API
 * Direct endpoint for conversations
 */

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Start session for storage
session_start();
if (!isset($_SESSION['conversations'])) {
    $_SESSION['conversations'] = [];
}

$conversations = &$_SESSION['conversations'];
$method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];

// Parse URL to get session ID
$path_parts = explode('/', trim($request_uri, '/'));
$session_id = null;

// Look for session ID in the URL
foreach ($path_parts as $part) {
    if (strpos($part, 'session-') === 0) {
        $session_id = $part;
        break;
    }
}

// Handle different methods
switch ($method) {
    case 'GET':
        if ($session_id) {
            // Get specific conversation
            if (isset($conversations[$session_id])) {
                echo json_encode([
                    'status' => 'success',
                    'data' => $conversations[$session_id]
                ]);
            } else {
                // Return empty conversation for new session
                $new_conversation = [
                    'sessionId' => $session_id,
                    'userId' => 'user-1',
                    'startTime' => date('c'),
                    'messages' => [],
                    'status' => 'active',
                    'bookingStatus' => 'none',
                    'extractedBookingData' => null,
                    'createdAt' => date('c'),
                    'updatedAt' => date('c')
                ];
                
                echo json_encode([
                    'status' => 'success',
                    'data' => $new_conversation
                ]);
            }
        } else {
            // Get all conversations
            echo json_encode([
                'status' => 'success',
                'data' => array_values($conversations)
            ]);
        }
        break;
        
    case 'POST':
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
        
        $session_id = $input['sessionId'] ?? 'session-' . uniqid();
        
        // Create conversation object
        $conversation = [
            'id' => 'conv_' . uniqid(),
            'sessionId' => $session_id,
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
        
        // Store conversation
        $conversations[$session_id] = $conversation;
        
        echo json_encode([
            'status' => 'success',
            'data' => $conversation
        ]);
        break;
        
    case 'PUT':
        if ($session_id) {
            // Update conversation
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                http_response_code(400);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Invalid JSON input'
                ]);
                exit();
            }
            
            if (isset($conversations[$session_id])) {
                $conversations[$session_id] = array_merge($conversations[$session_id], $input);
                $conversations[$session_id]['updatedAt'] = date('c');
                
                echo json_encode([
                    'status' => 'success',
                    'data' => $conversations[$session_id]
                ]);
            } else {
                http_response_code(404);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Conversation not found'
                ]);
            }
        } else {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Session ID required'
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