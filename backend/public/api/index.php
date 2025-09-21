<?php
/**
 * API Router
 * Routes API requests to appropriate endpoints
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

// Get the request URI and method
$request_uri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// Remove query string and decode
$path = parse_url($request_uri, PHP_URL_PATH);
$path = urldecode($path);

// Remove leading slash and split into parts
$path_parts = explode('/', trim($path, '/'));
array_shift($path_parts); // Remove 'api' from the beginning

// Route to appropriate endpoint
if (count($path_parts) >= 1) {
    $endpoint = $path_parts[0];
    
    switch ($endpoint) {
        case 'conversations':
            // Handle conversations endpoint
            if (count($path_parts) >= 2) {
                // GET /api/conversations/{sessionId}
                $session_id = $path_parts[1];
                handleConversationRequest($method, $session_id);
            } else {
                // GET /api/conversations
                handleConversationsRequest($method);
            }
            break;
            
        default:
            http_response_code(404);
            echo json_encode([
                'status' => 'error',
                'message' => 'Endpoint not found: ' . $endpoint
            ]);
            break;
    }
} else {
    http_response_code(404);
    echo json_encode([
        'status' => 'error',
        'message' => 'No endpoint specified'
    ]);
}

// Handle conversations list request
function handleConversationsRequest($method) {
    if ($method === 'GET') {
        // Return all conversations
        echo json_encode([
            'status' => 'success',
            'data' => []
        ]);
    } else {
        http_response_code(405);
        echo json_encode([
            'status' => 'error',
            'message' => 'Method not allowed'
        ]);
    }
}

// Handle specific conversation request
function handleConversationRequest($method, $session_id) {
    // Start session for storage
    session_start();
    if (!isset($_SESSION['conversations'])) {
        $_SESSION['conversations'] = [];
    }
    
    $conversations = &$_SESSION['conversations'];
    
    switch ($method) {
        case 'GET':
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
            break;
            
        case 'POST':
            // Create or update conversation
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                http_response_code(400);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Invalid JSON input'
                ]);
                exit();
            }
            
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
            break;
            
        default:
            http_response_code(405);
            echo json_encode([
                'status' => 'error',
                'message' => 'Method not allowed'
            ]);
            break;
    }
}
?>




