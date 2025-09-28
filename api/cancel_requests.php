<?php
/**
 * Cancel Requests API
 * Handles CRUD operations for cancellation requests
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

function sendResponse($success, $message, $data = null, $httpCode = 200) {
    http_response_code($httpCode);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        sendResponse(false, 'Database connection failed', null, 500);
        return;
    }
    
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? null;
    
    switch ($method) {
        case 'POST':
            if ($action === 'create') {
                // Create new cancel request
                $input = json_decode(file_get_contents('php://input'), true);
                
                if (!$input || !isset($input['booking_id']) || !isset($input['requester_name']) || 
                    !isset($input['owner_name']) || !isset($input['reason'])) {
                    sendResponse(false, 'Missing required fields', null, 400);
                    return;
                }
                
                $bookingId = $input['booking_id'];
                $bookingType = $input['booking_type'] ?? 'form';
                
                // Get owner data from users table
                $ownerQuery = "SELECT id FROM users WHERE full_name = ? LIMIT 1";
                $ownerStmt = $db->prepare($ownerQuery);
                $ownerStmt->execute([$input['owner_name']]);
                $ownerData = $ownerStmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$ownerData) {
                    sendResponse(false, 'Owner not found', null, 404);
                    return;
                }
                
                // Insert cancel request
                $query = "INSERT INTO cancel_requests (booking_id, booking_type, requester_id, requester_name, owner_id, owner_name, reason)
                         VALUES (?, ?, ?, ?, ?, ?, ?)";
                
                $stmt = $db->prepare($query);
                if ($stmt->execute([
                    $bookingId,
                    $bookingType,
                    $input['requester_id'] ?? 1,
                    $input['requester_name'],
                    $ownerData['id'],
                    $input['owner_name'],
                    $input['reason']
                ])) {
                    $requestId = $db->lastInsertId();
                    sendResponse(true, 'Cancel request sent successfully', ['request_id' => $requestId]);
                } else {
                    sendResponse(false, 'Failed to create cancel request', null, 500);
                }
                
            } elseif ($action === 'respond') {
                // Respond to cancel request (approve/reject) - NO AUTO-CANCEL
                $input = json_decode(file_get_contents('php://input'), true);
                
                if (!$input || !isset($input['request_id']) || !isset($input['status'])) {
                    sendResponse(false, 'Missing required fields', null, 400);
                    return;
                }
                
                $query = "UPDATE cancel_requests SET status = ?, response_message = ? WHERE id = ?";
                $stmt = $db->prepare($query);
                if ($stmt->execute([
                    $input['status'],
                    $input['response_message'] ?? null,
                    $input['request_id']
                ])) {
                    sendResponse(true, 'Response updated successfully');
                } else {
                    sendResponse(false, 'Failed to update response', null, 500);
                }
                
            } else {
                sendResponse(false, 'Invalid action', null, 400);
            }
            break;
            
        case 'GET':
            if ($action === 'get_by_owner') {
                // Get cancel requests for a specific owner
                $ownerName = $_GET['owner_name'] ?? null;
                
                if (!$ownerName) {
                    sendResponse(false, 'Owner name required', null, 400);
                    return;
                }
                
                $query = "SELECT cr.*, 
                                CASE 
                                    WHEN cr.booking_type = 'ai' THEN abs.topic
                                    ELSE b.topic
                                END as booking_topic,
                                CASE 
                                    WHEN cr.booking_type = 'ai' THEN abs.meeting_date
                                    ELSE b.meeting_date
                                END as meeting_date
                         FROM cancel_requests cr
                         LEFT JOIN ai_bookings_success abs ON cr.booking_id = abs.id AND cr.booking_type = 'ai'
                         LEFT JOIN bookings b ON cr.booking_id = b.id AND cr.booking_type = 'form'
                         WHERE cr.owner_name = ? AND cr.status = 'pending'
                         ORDER BY cr.created_at DESC";
                
                $stmt = $db->prepare($query);
                $stmt->execute([$ownerName]);
                $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                sendResponse(true, 'Cancel requests retrieved successfully', $result);
                
            } elseif ($action === 'get_by_requester') {
                // Get cancel requests made by a specific requester
                $requesterName = $_GET['requester_name'] ?? null;
                
                if (!$requesterName) {
                    sendResponse(false, 'Requester name required', null, 400);
                    return;
                }
                
                $query = "SELECT cr.*, 
                                CASE 
                                    WHEN cr.booking_type = 'ai' THEN abs.topic
                                    ELSE b.topic
                                END as booking_topic,
                                CASE 
                                    WHEN cr.booking_type = 'ai' THEN abs.meeting_date
                                    ELSE b.meeting_date
                                END as meeting_date
                         FROM cancel_requests cr
                         LEFT JOIN ai_bookings_success abs ON cr.booking_id = abs.id AND cr.booking_type = 'ai'
                         LEFT JOIN bookings b ON cr.booking_id = b.id AND cr.booking_type = 'form'
                         WHERE cr.requester_name = ?
                         ORDER BY cr.created_at DESC";
                
                $stmt = $db->prepare($query);
                $stmt->execute([$requesterName]);
                $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                sendResponse(true, 'Cancel requests retrieved successfully', $result);
                
            } elseif ($action === 'get_all') {
                // Get all cancel requests
                $query = "SELECT cr.*, 
                                CASE 
                                    WHEN cr.booking_type = 'ai' THEN abs.topic
                                    ELSE b.topic
                                END as booking_topic,
                                CASE 
                                    WHEN cr.booking_type = 'ai' THEN abs.meeting_date
                                    ELSE b.meeting_date
                                END as meeting_date
                         FROM cancel_requests cr
                         LEFT JOIN ai_bookings_success abs ON cr.booking_id = abs.id AND cr.booking_type = 'ai'
                         LEFT JOIN bookings b ON cr.booking_id = b.id AND cr.booking_type = 'form'
                         ORDER BY cr.created_at DESC";
                
                $stmt = $db->prepare($query);
                $stmt->execute();
                $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                sendResponse(true, 'All cancel requests retrieved successfully', $result);
                
            } else {
                sendResponse(false, 'Invalid action', null, 400);
            }
            break;
            
        default:
            sendResponse(false, 'Method not allowed', null, 405);
            break;
    }
    
} catch (Exception $e) {
    error_log("Cancel requests API error: " . $e->getMessage());
    sendResponse(false, 'Internal server error', null, 500);
}
?>


