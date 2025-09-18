<?php
// Simple API for conversations
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();
if (!isset($_SESSION['conversations'])) {
    $_SESSION['conversations'] = [];
}

$method = $_SERVER['REQUEST_METHOD'];
$session_id = $_GET['sessionId'] ?? null;
$action = $_GET['action'] ?? null;

// Log request
error_log("API: $method, sessionId=$session_id, action=$action");

if ($method === 'GET' && $session_id) {
    if (isset($_SESSION['conversations'][$session_id])) {
        echo json_encode(['status' => 'success', 'data' => $_SESSION['conversations'][$session_id]]);
    } else {
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
        echo json_encode(['status' => 'success', 'data' => $new_conv]);
    }
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $session_id = $input['sessionId'] ?? 'session-' . uniqid();
    
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
    
    $_SESSION['conversations'][$session_id] = $conversation;
    echo json_encode(['status' => 'success', 'data' => $conversation]);
} elseif ($method === 'PUT' && $session_id) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if ($action === 'updateBooking') {
        if (isset($_SESSION['conversations'][$session_id])) {
            $_SESSION['conversations'][$session_id]['bookingStatus'] = $input['status'] ?? 'none';
            $_SESSION['conversations'][$session_id]['extractedBookingData'] = $input['bookingData'] ?? null;
            $_SESSION['conversations'][$session_id]['updatedAt'] = date('c');
            echo json_encode(['status' => 'success', 'data' => $_SESSION['conversations'][$session_id]]);
        } else {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Conversation not found']);
        }
    } else {
        if (isset($_SESSION['conversations'][$session_id])) {
            $_SESSION['conversations'][$session_id] = array_merge($_SESSION['conversations'][$session_id], $input);
            $_SESSION['conversations'][$session_id]['updatedAt'] = date('c');
            echo json_encode(['status' => 'success', 'data' => $_SESSION['conversations'][$session_id]]);
        } else {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Conversation not found']);
        }
    }
} else {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid request']);
}
?>



