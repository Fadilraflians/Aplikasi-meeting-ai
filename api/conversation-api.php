<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../vendor/autoload.php';

use MongoDB\Client;
use MongoDB\BSON\ObjectId;

// MongoDB connection
$mongoClient = new Client('mongodb://localhost:27017');
$db = $mongoClient->selectDatabase('spacio_ai_conversations');
$collection = $db->selectCollection('conversations');

// Helper function to send JSON response
function sendResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit();
}

// Helper function to send error response
function sendError($message, $status = 400) {
    sendResponse(['error' => $message], $status);
}

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Route handling
try {
    switch ($method) {
        case 'GET':
            if (count($pathParts) >= 2 && $pathParts[1] === 'conversations') {
                if (count($pathParts) === 2) {
                    // GET /conversations - Get all conversations
                    $conversations = $collection->find([])->toArray();
                    $result = [];
                    foreach ($conversations as $conv) {
                        $result[] = [
                            'id' => (string)$conv['_id'],
                            'sessionId' => $conv['sessionId'],
                            'userId' => $conv['userId'] ?? null,
                            'startTime' => $conv['startTime']->toDateTime()->format('Y-m-d H:i:s'),
                            'endTime' => isset($conv['endTime']) ? $conv['endTime']->toDateTime()->format('Y-m-d H:i:s') : null,
                            'status' => $conv['status'],
                            'bookingStatus' => $conv['bookingStatus'] ?? 'none',
                            'messageCount' => count($conv['messages']),
                            'extractedBookingData' => $conv['extractedBookingData'] ?? null
                        ];
                    }
                    sendResponse(['conversations' => $result]);
                } elseif (count($pathParts) === 3) {
                    // GET /conversations/{sessionId} - Get specific conversation
                    $sessionId = $pathParts[2];
                    $conversation = $collection->findOne(['sessionId' => $sessionId]);
                    
                    if (!$conversation) {
                        sendError('Conversation not found', 404);
                    }
                    
                    $result = [
                        'id' => (string)$conversation['_id'],
                        'sessionId' => $conversation['sessionId'],
                        'userId' => $conversation['userId'] ?? null,
                        'startTime' => $conversation['startTime']->toDateTime()->format('Y-m-d H:i:s'),
                        'endTime' => isset($conversation['endTime']) ? $conversation['endTime']->toDateTime()->format('Y-m-d H:i:s') : null,
                        'status' => $conversation['status'],
                        'bookingStatus' => $conversation['bookingStatus'] ?? 'none',
                        'messages' => $conversation['messages'],
                        'extractedBookingData' => $conversation['extractedBookingData'] ?? null
                    ];
                    sendResponse($result);
                } elseif (count($pathParts) === 4 && $pathParts[3] === 'stats') {
                    // GET /conversations/{sessionId}/stats - Get conversation stats
                    $sessionId = $pathParts[2];
                    $conversation = $collection->findOne(['sessionId' => $sessionId]);
                    
                    if (!$conversation) {
                        sendError('Conversation not found', 404);
                    }
                    
                    $stats = [
                        'messageCount' => count($conversation['messages']),
                        'duration' => isset($conversation['endTime']) ? 
                            $conversation['endTime']->toDateTime()->getTimestamp() - $conversation['startTime']->toDateTime()->getTimestamp() : null,
                        'bookingCompleteness' => isset($conversation['extractedBookingData']) ? 
                            count(array_filter($conversation['extractedBookingData'])) / 7 * 100 : 0,
                        'userMessages' => count(array_filter($conversation['messages'], function($msg) {
                            return $msg['role'] === 'user';
                        })),
                        'aiMessages' => count(array_filter($conversation['messages'], function($msg) {
                            return $msg['role'] === 'ai';
                        }))
                    ];
                    sendResponse($stats);
                }
            } elseif (count($pathParts) >= 2 && $pathParts[1] === 'bookings') {
                if (count($pathParts) === 2) {
                    // GET /bookings - Get all completed bookings
                    $bookings = $collection->find(['bookingStatus' => 'completed'])->toArray();
                    $result = [];
                    foreach ($bookings as $booking) {
                        if (isset($booking['extractedBookingData'])) {
                            $result[] = [
                                'id' => (string)$booking['_id'],
                                'sessionId' => $booking['sessionId'],
                                'userId' => $booking['userId'] ?? null,
                                'bookingData' => $booking['extractedBookingData'],
                                'completedAt' => $booking['updatedAt']->toDateTime()->format('Y-m-d H:i:s')
                            ];
                        }
                    }
                    sendResponse(['bookings' => $result]);
                } elseif (count($pathParts) === 3 && $pathParts[2] === 'stats') {
                    // GET /bookings/stats - Get booking statistics
                    $totalConversations = $collection->countDocuments([]);
                    $completedBookings = $collection->countDocuments(['bookingStatus' => 'completed']);
                    $inProgressBookings = $collection->countDocuments(['bookingStatus' => 'in_progress']);
                    
                    $stats = [
                        'totalConversations' => $totalConversations,
                        'completedBookings' => $completedBookings,
                        'inProgressBookings' => $inProgressBookings,
                        'successRate' => $totalConversations > 0 ? ($completedBookings / $totalConversations) * 100 : 0
                    ];
                    sendResponse($stats);
                }
            } elseif (count($pathParts) >= 2 && $pathParts[1] === 'analytics') {
                // GET /analytics - Get conversation analytics
                $conversations = $collection->find(['bookingStatus' => 'completed'])->toArray();
                
                $analytics = [
                    'totalCompletedBookings' => count($conversations),
                    'averageMessagesPerConversation' => 0,
                    'mostCommonTopics' => [],
                    'mostCommonRooms' => [],
                    'averageBookingTime' => 0
                ];
                
                if (count($conversations) > 0) {
                    // Calculate average messages per conversation
                    $totalMessages = 0;
                    $totalBookingTime = 0;
                    $validBookingTimes = 0;
                    $topics = [];
                    $rooms = [];
                    
                    foreach ($conversations as $conv) {
                        $totalMessages += count($conv['messages']);
                        
                        if (isset($conv['endTime']) && isset($conv['startTime'])) {
                            $bookingTime = $conv['endTime']->toDateTime()->getTimestamp() - 
                                          $conv['startTime']->toDateTime()->getTimestamp();
                            $totalBookingTime += $bookingTime;
                            $validBookingTimes++;
                        }
                        
                        if (isset($conv['extractedBookingData']['topic'])) {
                            $topic = $conv['extractedBookingData']['topic'];
                            $topics[$topic] = ($topics[$topic] ?? 0) + 1;
                        }
                        
                        if (isset($conv['extractedBookingData']['roomName'])) {
                            $room = $conv['extractedBookingData']['roomName'];
                            $rooms[$room] = ($rooms[$room] ?? 0) + 1;
                        }
                    }
                    
                    $analytics['averageMessagesPerConversation'] = $totalMessages / count($conversations);
                    $analytics['averageBookingTime'] = $validBookingTimes > 0 ? $totalBookingTime / $validBookingTimes : 0;
                    
                    // Sort and get top 5 topics
                    arsort($topics);
                    $analytics['mostCommonTopics'] = array_slice(array_map(function($topic, $count) {
                        return ['topic' => $topic, 'count' => $count];
                    }, array_keys($topics), array_values($topics)), 0, 5);
                    
                    // Sort and get top 5 rooms
                    arsort($rooms);
                    $analytics['mostCommonRooms'] = array_slice(array_map(function($room, $count) {
                        return ['room' => $room, 'count' => $count];
                    }, array_keys($rooms), array_values($rooms)), 0, 5);
                }
                
                sendResponse($analytics);
            } else {
                sendError('Invalid endpoint', 404);
            }
            break;
            
        case 'POST':
            if (count($pathParts) >= 2 && $pathParts[1] === 'conversations') {
                // POST /conversations - Create new conversation
                $input = json_decode(file_get_contents('php://input'), true);
                
                if (!$input || !isset($input['sessionId'])) {
                    sendError('Session ID is required', 400);
                }
                
                $conversation = [
                    'sessionId' => $input['sessionId'],
                    'userId' => $input['userId'] ?? null,
                    'startTime' => new MongoDB\BSON\UTCDateTime(),
                    'messages' => [],
                    'status' => 'active',
                    'bookingStatus' => 'none',
                    'createdAt' => new MongoDB\BSON\UTCDateTime(),
                    'updatedAt' => new MongoDB\BSON\UTCDateTime()
                ];
                
                $result = $collection->insertOne($conversation);
                sendResponse(['id' => (string)$result->getInsertedId()], 201);
            } else {
                sendError('Invalid endpoint', 404);
            }
            break;
            
        case 'PUT':
            if (count($pathParts) >= 3 && $pathParts[1] === 'conversations') {
                // PUT /conversations/{sessionId} - Update conversation
                $sessionId = $pathParts[2];
                $input = json_decode(file_get_contents('php://input'), true);
                
                if (!$input) {
                    sendError('Invalid input data', 400);
                }
                
                $updateData = ['updatedAt' => new MongoDB\BSON\UTCDateTime()];
                
                if (isset($input['status'])) {
                    $updateData['status'] = $input['status'];
                }
                
                if (isset($input['bookingStatus'])) {
                    $updateData['bookingStatus'] = $input['bookingStatus'];
                }
                
                if (isset($input['extractedBookingData'])) {
                    $updateData['extractedBookingData'] = $input['extractedBookingData'];
                }
                
                if (isset($input['endTime'])) {
                    $updateData['endTime'] = new MongoDB\BSON\UTCDateTime(strtotime($input['endTime']) * 1000);
                }
                
                $result = $collection->updateOne(
                    ['sessionId' => $sessionId],
                    ['$set' => $updateData]
                );
                
                if ($result->getMatchedCount() === 0) {
                    sendError('Conversation not found', 404);
                }
                
                sendResponse(['success' => true]);
            } else {
                sendError('Invalid endpoint', 404);
            }
            break;
            
        default:
            sendError('Method not allowed', 405);
    }
} catch (Exception $e) {
    sendError('Internal server error: ' . $e->getMessage(), 500);
}
?>






