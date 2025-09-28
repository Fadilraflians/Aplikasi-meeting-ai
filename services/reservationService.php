<?php
/**
 * Reservation Service for Spacio Meeting Room Booker
 */

require_once '../config/database.php';

class ReservationService {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    /**
     * Create new reservation
     */
    public function createReservation($reservation_data) {
        try {
            $conn = $this->db->getConnection();
            
            // Check if room is available for the specified time
            $availableRooms = $this->getAvailableRoomsForTime(
                $reservation_data['room_id'],
                $reservation_data['start_time'],
                $reservation_data['end_time']
            );
            
            if (empty($availableRooms)) {
                return [
                    'success' => false,
                    'message' => 'Room is not available for the specified time period'
                ];
            }
            
            // Validate time (end time must be after start time)
            if (strtotime($reservation_data['end_time']) <= strtotime($reservation_data['start_time'])) {
                return [
                    'success' => false,
                    'message' => 'End time must be after start time'
                ];
            }
            
            $query = "INSERT INTO reservations (room_id, user_id, title, description, 
                      start_time, end_time, attendees, meeting_type, status) 
                      VALUES (:room_id, :user_id, :title, :description, 
                      :start_time, :end_time, :attendees, :meeting_type, 'pending')";
            
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':room_id', $reservation_data['room_id']);
            $stmt->bindParam(':user_id', $reservation_data['user_id']);
            $stmt->bindParam(':title', $reservation_data['title']);
            $stmt->bindParam(':description', $reservation_data['description']);
            $stmt->bindParam(':start_time', $reservation_data['start_time']);
            $stmt->bindParam(':end_time', $reservation_data['end_time']);
            $stmt->bindParam(':attendees', $reservation_data['attendees']);
            $stmt->bindParam(':meeting_type', $reservation_data['meeting_type']);
            
            if ($stmt->execute()) {
                return [
                    'success' => true,
                    'message' => 'Reservation created successfully',
                    'reservation_id' => $conn->lastInsertId()
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to create reservation'
                ];
            }
            
        } catch (PDOException $e) {
            return [
                'success' => false,
                'message' => 'Database error: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get all reservations for a user
     */
    public function getUserReservations($user_id) {
        try {
            $conn = $this->db->getConnection();
            
            $query = "SELECT r.*, mr.room_name, mr.room_number, mr.capacity 
                      FROM reservations r 
                      JOIN meeting_rooms mr ON r.room_id = mr.id 
                      WHERE r.user_id = :user_id 
                      ORDER BY r.start_time DESC";
            
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':user_id', $user_id);
            $stmt->execute();
            
            return [
                'success' => true,
                'data' => $stmt->fetchAll()
            ];
            
        } catch (PDOException $e) {
            return [
                'success' => false,
                'message' => 'Database error: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get all reservations for a room
     */
    public function getRoomReservations($room_id, $date = null) {
        try {
            $conn = $this->db->getConnection();
            
            $where_clause = "r.room_id = :room_id";
            $params = [':room_id' => $room_id];
            
            if ($date) {
                $where_clause .= " AND DATE(r.start_time) = :date";
                $params[':date'] = $date;
            }
            
            $query = "SELECT r.*, u.full_name as booked_by, u.email as booker_email 
                      FROM reservations r 
                      JOIN users u ON r.user_id = u.id 
                      WHERE $where_clause 
                      ORDER BY r.start_time ASC";
            
            $stmt = $conn->prepare($query);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();
            
            return [
                'success' => true,
                'data' => $stmt->fetchAll()
            ];
            
        } catch (PDOException $e) {
            return [
                'success' => false,
                'message' => 'Database error: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get reservation by ID
     */
    public function getReservationById($reservation_id) {
        try {
            $conn = $this->db->getConnection();
            
            $query = "SELECT r.*, mr.room_name, mr.room_number, mr.capacity, 
                      u.full_name as booked_by, u.email as booker_email 
                      FROM reservations r 
                      JOIN meeting_rooms mr ON r.room_id = mr.id 
                      JOIN users u ON r.user_id = u.id 
                      WHERE r.id = :reservation_id";
            
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':reservation_id', $reservation_id);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                return [
                    'success' => true,
                    'data' => $stmt->fetch()
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Reservation not found'
                ];
            }
            
        } catch (PDOException $e) {
            return [
                'success' => false,
                'message' => 'Database error: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Update reservation
     */
    public function updateReservation($reservation_id, $reservation_data) {
        try {
            $conn = $this->db->getConnection();
            
            // Check if room is available for the new time (excluding current reservation)
            if (isset($reservation_data['room_id']) && isset($reservation_data['start_time']) && isset($reservation_data['end_time'])) {
                $availableRooms = $this->getAvailableRoomsForTime(
                    $reservation_data['room_id'],
                    $reservation_data['start_time'],
                    $reservation_data['end_time'],
                    $reservation_id
                );
                
                if (empty($availableRooms)) {
                    return [
                        'success' => false,
                        'message' => 'Room is not available for the specified time period'
                    ];
                }
            }
            
            $updateFields = [];
            $params = [':reservation_id' => $reservation_id];
            
            if (isset($reservation_data['title'])) {
                $updateFields[] = "title = :title";
                $params[':title'] = $reservation_data['title'];
            }
            if (isset($reservation_data['description'])) {
                $updateFields[] = "description = :description";
                $params[':description'] = $reservation_data['description'];
            }
            if (isset($reservation_data['start_time'])) {
                $updateFields[] = "start_time = :start_time";
                $params[':start_time'] = $reservation_data['start_time'];
            }
            if (isset($reservation_data['end_time'])) {
                $updateFields[] = "end_time = :end_time";
                $params[':end_time'] = $reservation_data['end_time'];
            }
            if (isset($reservation_data['attendees'])) {
                $updateFields[] = "attendees = :attendees";
                $params[':attendees'] = $reservation_data['attendees'];
            }
            if (isset($reservation_data['meeting_type'])) {
                $updateFields[] = "meeting_type = :meeting_type";
                $params[':meeting_type'] = $reservation_data['meeting_type'];
            }
            if (isset($reservation_data['status'])) {
                $updateFields[] = "status = :status";
                $params[':status'] = $reservation_data['status'];
            }
            
            if (empty($updateFields)) {
                return [
                    'success' => false,
                    'message' => 'No fields to update'
                ];
            }
            
            $query = "UPDATE reservations SET " . implode(', ', $updateFields) . " WHERE id = :reservation_id";
            $stmt = $conn->prepare($query);
            
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            
            if ($stmt->execute()) {
                return [
                    'success' => true,
                    'message' => 'Reservation updated successfully'
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to update reservation'
                ];
            }
            
        } catch (PDOException $e) {
            return [
                'success' => false,
                'message' => 'Database error: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Cancel reservation
     */
    public function cancelReservation($reservation_id, $user_id = null) {
        try {
            $conn = $this->db->getConnection();
            
            $where_clause = "id = :reservation_id";
            $params = [':reservation_id' => $reservation_id];
            
            // If user_id is provided, ensure user can only cancel their own reservations
            if ($user_id) {
                $where_clause .= " AND user_id = :user_id";
                $params[':user_id'] = $user_id;
            }
            
            $query = "UPDATE reservations SET status = 'cancelled' WHERE $where_clause";
            $stmt = $conn->prepare($query);
            
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            
            if ($stmt->execute() && $stmt->rowCount() > 0) {
                return [
                    'success' => true,
                    'message' => 'Reservation cancelled successfully'
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to cancel reservation or reservation not found'
                ];
            }
            
        } catch (PDOException $e) {
            return [
                'success' => false,
                'message' => 'Database error: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get available rooms for a specific time period
     */
    private function getAvailableRoomsForTime($room_id, $start_time, $end_time, $exclude_reservation_id = null) {
        try {
            $conn = $this->db->getConnection();
            
            $query = "SELECT COUNT(*) as count FROM reservations 
                      WHERE room_id = :room_id 
                      AND status != 'cancelled'
                      AND (
                          (start_time < :end_time AND end_time > :start_time)
                          OR (start_time = :start_time)
                          OR (end_time = :end_time)
                      )";
            
            if ($exclude_reservation_id) {
                $query .= " AND id != :exclude_id";
            }
            
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':room_id', $room_id);
            $stmt->bindParam(':start_time', $start_time);
            $stmt->bindParam(':end_time', $end_time);
            if ($exclude_reservation_id) {
                $stmt->bindParam(':exclude_id', $exclude_reservation_id);
            }
            $stmt->execute();
            
            $result = $stmt->fetch();
            return $result['count'] == 0;
            
        } catch (PDOException $e) {
            return false;
        }
    }

    /**
     * Get upcoming reservations
     */
    public function getUpcomingReservations($user_id = null, $limit = 10) {
        try {
            $conn = $this->db->getConnection();
            
            $where_clause = "r.start_time > NOW() AND r.status IN ('pending', 'confirmed')";
            $params = [];
            
            if ($user_id) {
                $where_clause .= " AND r.user_id = :user_id";
                $params[':user_id'] = $user_id;
            }
            
            $query = "SELECT r.*, mr.room_name, mr.room_number, u.full_name as booked_by 
                      FROM reservations r 
                      JOIN meeting_rooms mr ON r.room_id = mr.id 
                      JOIN users u ON r.user_id = u.id 
                      WHERE $where_clause 
                      ORDER BY r.start_time ASC 
                      LIMIT :limit";
            
            $stmt = $conn->prepare($query);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            
            return [
                'success' => true,
                'data' => $stmt->fetchAll()
            ];
            
        } catch (PDOException $e) {
            return [
                'success' => false,
                'message' => 'Database error: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get reservation statistics
     */
    public function getReservationStats($user_id = null) {
        try {
            $conn = $this->db->getConnection();
            
            $where_clause = "1=1";
            $params = [];
            
            if ($user_id) {
                $where_clause .= " AND user_id = :user_id";
                $params[':user_id'] = $user_id;
            }
            
            $query = "SELECT 
                        COUNT(*) as total_reservations,
                        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
                        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
                        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
                      FROM reservations 
                      WHERE $where_clause";
            
            $stmt = $conn->prepare($query);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();
            
            return [
                'success' => true,
                'data' => $stmt->fetch()
            ];
            
        } catch (PDOException $e) {
            return [
                'success' => false,
                'message' => 'Database error: ' . $e->getMessage()
            ];
        }
    }
}

// API endpoints for reservations
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $reservationService = new ReservationService();
    
    if (isset($_GET['action'])) {
        switch ($_GET['action']) {
            case 'get_by_id':
                if (isset($_GET['reservation_id'])) {
                    $result = $reservationService->getReservationById($_GET['reservation_id']);
                    echo json_encode($result);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Reservation ID required']);
                }
                break;
                
            case 'get_user_reservations':
                if (isset($_GET['user_id'])) {
                    $result = $reservationService->getUserReservations($_GET['user_id']);
                    echo json_encode($result);
                } else {
                    echo json_encode(['success' => false, 'message' => 'User ID required']);
                }
                break;
                
            case 'get_room_reservations':
                if (isset($_GET['room_id'])) {
                    $date = isset($_GET['date']) ? $_GET['date'] : null;
                    $result = $reservationService->getRoomReservations($_GET['room_id'], $date);
                    echo json_encode($result);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Room ID required']);
                }
                break;
                
            case 'get_upcoming':
                $user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;
                $limit = isset($_GET['limit']) ? $_GET['limit'] : 10;
                $result = $reservationService->getUpcomingReservations($user_id, $limit);
                echo json_encode($result);
                break;
                
            case 'get_stats':
                $user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;
                $result = $reservationService->getReservationStats($user_id);
                echo json_encode($result);
                break;
                
            default:
                echo json_encode(['success' => false, 'message' => 'Invalid action']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Action required']);
    }
}

// POST requests for reservation operations
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $reservationService = new ReservationService();
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (isset($input['action'])) {
        switch ($input['action']) {
            case 'create':
                if (isset($input['reservation_data'])) {
                    $result = $reservationService->createReservation($input['reservation_data']);
                    echo json_encode($result);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Reservation data required']);
                }
                break;
                
            case 'update':
                if (isset($input['reservation_id']) && isset($input['reservation_data'])) {
                    $result = $reservationService->updateReservation($input['reservation_id'], $input['reservation_data']);
                    echo json_encode($result);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Reservation ID and data required']);
                }
                break;
                
            case 'cancel':
                if (isset($input['reservation_id'])) {
                    $user_id = isset($input['user_id']) ? $input['user_id'] : null;
                    $result = $reservationService->cancelReservation($input['reservation_id'], $user_id);
                    echo json_encode($result);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Reservation ID required']);
                }
                break;
                
            default:
                echo json_encode(['success' => false, 'message' => 'Invalid action']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Action required']);
    }
}
?>



