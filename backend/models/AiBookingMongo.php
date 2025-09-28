<?php
/**
 * AI Booking MongoDB Model
 * Handles MongoDB operations for AI Agent bookings
 */

require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../config/mongo.php';

class AiBookingMongo {
    private $db;
    private $collection;
    private $conversationsCollection;

    public function __construct() {
        $mongoDb = new MongoDatabase();
        $this->db = $mongoDb->getDb();
        $this->collection = $this->db->selectCollection('ai_bookings');
        $this->conversationsCollection = $this->db->selectCollection('ai_conversations');
    }

    /**
     * Create AI booking in MongoDB
     */
    public function createAIBooking($data) {
        try {
            $document = [
                'user_id' => (int)$data['user_id'],
                'session_id' => $data['session_id'],
                'room_id' => (int)$data['room_id'],
                'room_name' => $data['room_name'] ?? '',
                'topic' => $data['topic'],
                'meeting_date' => $data['meeting_date'],
                'meeting_time' => $data['meeting_time'],
                'duration' => (int)$data['duration'],
                'participants' => (int)$data['participants'],
                'meeting_type' => $data['meeting_type'],
                'food_order' => $data['food_order'],
                'booking_state' => $data['booking_state'] ?? 'BOOKED',
                'created_at' => new MongoDB\BSON\UTCDateTime(),
                'updated_at' => new MongoDB\BSON\UTCDateTime()
            ];

            $result = $this->collection->insertOne($document);
            
            if ($result->getInsertedCount() > 0) {
                $document['_id'] = $result->getInsertedId();
                return $document;
            }
            return false;
        } catch (Exception $e) {
            error_log("Error creating AI booking in MongoDB: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get AI bookings by user ID
     */
    public function getBookingsByUserId($userId) {
        try {
            $cursor = $this->collection->find(
                ['user_id' => (int)$userId],
                ['sort' => ['created_at' => -1]]
            );
            
            $bookings = [];
            foreach ($cursor as $document) {
                $bookings[] = $this->formatBookingForAPI($document);
            }
            
            return $bookings;
        } catch (Exception $e) {
            error_log("Error getting AI bookings by user ID: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get all AI bookings
     */
    public function getAllBookings() {
        try {
            $cursor = $this->collection->find(
                [],
                ['sort' => ['created_at' => -1]]
            );
            
            $bookings = [];
            foreach ($cursor as $document) {
                $bookings[] = $this->formatBookingForAPI($document);
            }
            
            return $bookings;
        } catch (Exception $e) {
            error_log("Error getting all AI bookings: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Update booking
     */
    public function updateBooking($id, $data) {
        try {
            $updateData = array_merge($data, ['updated_at' => new MongoDB\BSON\UTCDateTime()]);
            
            $result = $this->collection->updateOne(
                ['_id' => new MongoDB\BSON\ObjectId($id)],
                ['$set' => $updateData]
            );
            
            return $result->getModifiedCount() > 0;
        } catch (Exception $e) {
            error_log("Error updating AI booking: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Cancel booking (soft delete)
     */
    public function cancelBooking($id) {
        try {
            return $this->updateBooking($id, ['booking_state' => 'CANCELLED']);
        } catch (Exception $e) {
            error_log("Error cancelling AI booking: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Save AI conversation
     */
    public function saveConversation($userId, $sessionId, $message, $response, $bookingState, $bookingData) {
        try {
            $document = [
                'user_id' => (int)$userId,
                'session_id' => $sessionId,
                'message' => $message,
                'response' => $response,
                'booking_state' => $bookingState,
                'booking_data' => $bookingData,
                'created_at' => new MongoDB\BSON\UTCDateTime()
            ];

            $result = $this->conversationsCollection->insertOne($document);
            return $result->getInsertedCount() > 0;
        } catch (Exception $e) {
            error_log("Error saving AI conversation: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get conversations
     */
    public function getConversations($userId = null, $sessionId = null) {
        try {
            $filter = [];
            if ($userId) $filter['user_id'] = (int)$userId;
            if ($sessionId) $filter['session_id'] = $sessionId;
            
            $cursor = $this->conversationsCollection->find(
                $filter,
                ['sort' => ['created_at' => -1]]
            );
            
            $conversations = [];
            foreach ($cursor as $document) {
                $conversations[] = $this->formatConversationForAPI($document);
            }
            
            return $conversations;
        } catch (Exception $e) {
            error_log("Error getting AI conversations: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Check room availability (similar to MySQL version)
     */
    public function checkRoomAvailability($roomId, $date, $startTime, $duration) {
        try {
            // Calculate end time
            $startDateTime = new DateTime($date . ' ' . $startTime);
            $endDateTime = clone $startDateTime;
            $endDateTime->add(new DateInterval('PT' . $duration . 'M'));
            
            $conflictingBookings = $this->collection->countDocuments([
                'room_id' => (int)$roomId,
                'meeting_date' => $date,
                'booking_state' => ['$ne' => 'CANCELLED'],
                '$or' => [
                    [
                        'meeting_time' => ['$lte' => $startTime],
                        // This would need more complex date/time calculation in MongoDB
                        // For simplicity, we'll do a basic check
                    ]
                ]
            ]);

            return [
                'available' => $conflictingBookings == 0,
                'conflicting_bookings' => $conflictingBookings,
                'room_id' => $roomId,
                'date' => $date,
                'start_time' => $startTime,
                'duration' => $duration
            ];
        } catch (Exception $e) {
            error_log("Error checking room availability in MongoDB: " . $e->getMessage());
            return ['available' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Format booking document for API response
     */
    private function formatBookingForAPI($document) {
        return [
            'id' => (string)$document['_id'],
            'user_id' => $document['user_id'],
            'session_id' => $document['session_id'],
            'room_id' => $document['room_id'],
            'room_name' => $document['room_name'] ?? '',
            'topic' => $document['topic'],
            'meeting_date' => $document['meeting_date'],
            'meeting_time' => $document['meeting_time'],
            'duration' => $document['duration'],
            'participants' => $document['participants'],
            'meeting_type' => $document['meeting_type'],
            'food_order' => $document['food_order'],
            'booking_state' => $document['booking_state'],
            'created_at' => $document['created_at']->toDateTime()->format('Y-m-d H:i:s'),
            'updated_at' => $document['updated_at']->toDateTime()->format('Y-m-d H:i:s')
        ];
    }

    /**
     * Format conversation document for API response
     */
    private function formatConversationForAPI($document) {
        return [
            'id' => (string)$document['_id'],
            'user_id' => $document['user_id'],
            'session_id' => $document['session_id'],
            'message' => $document['message'],
            'response' => $document['response'],
            'booking_state' => $document['booking_state'],
            'booking_data' => $document['booking_data'],
            'created_at' => $document['created_at']->toDateTime()->format('Y-m-d H:i:s')
        ];
    }
}
?>
