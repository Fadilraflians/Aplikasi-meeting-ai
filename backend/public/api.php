<?php
/**
 * Simple API Endpoint for Conversations
 * Handles all conversation-related requests
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

// Start session for in-memory storage
session_start();
if (!isset($_SESSION['conversations'])) {
    $_SESSION['conversations'] = [];
}
$conversations = &$_SESSION['conversations'];

$method = $_SERVER['REQUEST_METHOD'];
$session_id = $_GET['sessionId'] ?? null;
$action = $_GET['action'] ?? null;

// Log request for debugging
error_log("API Request: $method, sessionId=$session_id, action=$action");

switch ($method) {
    case 'GET':
        if ($session_id) {
            // Get single conversation
            if (isset($conversations[$session_id])) {
                echo json_encode([
                    'status' => 'success',
                    'data' => $conversations[$session_id]
                ]);
            } else {
                // Create new conversation if not exists
                $new_conv = [
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
                $conversations[$session_id] = $new_conv;
                echo json_encode([
                    'status' => 'success',
                    'data' => $new_conv
                ]);
            }
        } else {
            // Get all conversations or filter by bookingStatus
            $filtered_conversations = array_values($conversations);
            if (isset($_GET['bookingStatus'])) {
                $status_filter = $_GET['bookingStatus'];
                $filtered_conversations = array_filter($filtered_conversations, function($conv) use ($status_filter) {
                    return ($conv['bookingStatus'] ?? 'none') === $status_filter;
                });
            }
            echo json_encode([
                'status' => 'success',
                'data' => $filtered_conversations
            ]);
        }
        break;

    case 'POST':
        // Create new conversation or add message
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Invalid JSON input'
            ]);
            exit();
        }

        if ($action === 'addMessage' && $session_id) {
            if (isset($conversations[$session_id])) {
                $conversations[$session_id]['messages'][] = $input;
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
            // Create new conversation
            $new_session_id = $input['sessionId'] ?? 'session-' . uniqid();
            $conversations[$new_session_id] = array_merge([
                'sessionId' => $new_session_id,
                'userId' => 'user-' . uniqid(),
                'startTime' => date('c'),
                'messages' => [],
                'status' => 'active',
                'bookingStatus' => 'none',
                'extractedBookingData' => null,
                'createdAt' => date('c'),
                'updatedAt' => date('c')
            ], $input);
            echo json_encode([
                'status' => 'success',
                'data' => $conversations[$new_session_id]
            ]);
        }
        break;

    case 'PUT':
        if ($session_id) {
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
                if ($action === 'updateBooking') {
                    $conversations[$session_id]['bookingStatus'] = $input['status'] ?? 'none';
                    $conversations[$session_id]['extractedBookingData'] = $input['bookingData'] ?? null;
                } else {
                    // Regular update, merge input data
                    $conversations[$session_id] = array_merge($conversations[$session_id], $input);
                }
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

    case 'DELETE':
        if ($session_id) {
            if (isset($conversations[$session_id])) {
                unset($conversations[$session_id]);
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Conversation deleted'
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
            'message' => 'Method Not Allowed'
        ]);
        break;
}
?>