<?php
/**
 * Meeting Room Service for Spacio Meeting Room Booker
 */

require_once '../config/database.php';

class MeetingRoomService {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    /**
     * Get all meeting rooms
     */
    public function getAllRooms() {
        try {
            $conn = $this->db->getConnection();
            
            $query = "SELECT * FROM meeting_rooms ORDER BY room_name";
            $stmt = $conn->prepare($query);
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
     * Get available rooms for a specific time period
     */
    public function getAvailableRooms($start_time, $end_time, $exclude_reservation_id = null) {
        try {
            $conn = $this->db->getConnection();
            
            $query = "SELECT mr.* FROM meeting_rooms mr 
                      WHERE mr.is_available = 1 
                      AND mr.is_maintenance = 0
                      AND mr.id NOT IN (
                          SELECT DISTINCT r.room_id 
                          FROM reservations r 
                          WHERE r.status != 'cancelled'
                          AND (
                              (r.start_time < :end_time AND r.end_time > :start_time)
                              OR (r.start_time = :start_time)
                              OR (r.end_time = :end_time)
                          )
                          " . ($exclude_reservation_id ? "AND r.id != :exclude_id" : "") . "
                      )
                      ORDER BY mr.room_name";
            
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':start_time', $start_time);
            $stmt->bindParam(':end_time', $end_time);
            if ($exclude_reservation_id) {
                $stmt->bindParam(':exclude_id', $exclude_reservation_id);
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
     * Get room by ID
     */
    public function getRoomById($room_id) {
        try {
            $conn = $this->db->getConnection();
            
            $query = "SELECT * FROM meeting_rooms WHERE id = :room_id";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':room_id', $room_id);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                return [
                    'success' => true,
                    'data' => $stmt->fetch()
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Room not found'
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
     * Create new meeting room (admin only)
     */
    public function createRoom($room_data) {
        try {
            $conn = $this->db->getConnection();
            
            $query = "INSERT INTO meeting_rooms (room_name, room_number, capacity, room_type, 
                      floor_number, building, description, amenities, hourly_rate) 
                      VALUES (:room_name, :room_number, :capacity, :room_type, 
                      :floor_number, :building, :description, :amenities, :hourly_rate)";
            
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':room_name', $room_data['room_name']);
            $stmt->bindParam(':room_number', $room_data['room_number']);
            $stmt->bindParam(':capacity', $room_data['capacity']);
            $stmt->bindParam(':room_type', $room_data['room_type']);
            $stmt->bindParam(':floor_number', $room_data['floor_number']);
            $stmt->bindParam(':building', $room_data['building']);
            $stmt->bindParam(':description', $room_data['description']);
            $stmt->bindParam(':amenities', $room_data['amenities']);
            $stmt->bindParam(':hourly_rate', $room_data['hourly_rate']);
            
            if ($stmt->execute()) {
                return [
                    'success' => true,
                    'message' => 'Room created successfully',
                    'room_id' => $conn->lastInsertId()
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to create room'
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
     * Update meeting room (admin only)
     */
    public function updateRoom($room_id, $room_data) {
        try {
            $conn = $this->db->getConnection();
            
            $query = "UPDATE meeting_rooms SET 
                      room_name = :room_name, room_number = :room_number, 
                      capacity = :capacity, room_type = :room_type, 
                      floor_number = :floor_number, building = :building, 
                      description = :description, amenities = :amenities, 
                      hourly_rate = :hourly_rate, is_available = :is_available, 
                      is_maintenance = :is_maintenance 
                      WHERE id = :room_id";
            
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':room_id', $room_id);
            $stmt->bindParam(':room_name', $room_data['room_name']);
            $stmt->bindParam(':room_number', $room_data['room_number']);
            $stmt->bindParam(':capacity', $room_data['capacity']);
            $stmt->bindParam(':room_type', $room_data['room_type']);
            $stmt->bindParam(':floor_number', $room_data['floor_number']);
            $stmt->bindParam(':building', $room_data['building']);
            $stmt->bindParam(':description', $room_data['description']);
            $stmt->bindParam(':amenities', $room_data['amenities']);
            $stmt->bindParam(':hourly_rate', $room_data['hourly_rate']);
            $stmt->bindParam(':is_available', $room_data['is_available']);
            $stmt->bindParam(':is_maintenance', $room_data['is_maintenance']);
            
            if ($stmt->execute()) {
                return [
                    'success' => true,
                    'message' => 'Room updated successfully'
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to update room'
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
     * Delete meeting room (admin only)
     */
    public function deleteRoom($room_id) {
        try {
            $conn = $this->db->getConnection();
            
            // Check if room has active reservations
            $checkQuery = "SELECT COUNT(*) as count FROM reservations 
                          WHERE room_id = :room_id AND status IN ('pending', 'confirmed')";
            $checkStmt = $conn->prepare($checkQuery);
            $checkStmt->bindParam(':room_id', $room_id);
            $checkStmt->execute();
            $result = $checkStmt->fetch();
            
            if ($result['count'] > 0) {
                return [
                    'success' => false,
                    'message' => 'Cannot delete room with active reservations'
                ];
            }
            
            $query = "DELETE FROM meeting_rooms WHERE id = :room_id";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':room_id', $room_id);
            
            if ($stmt->execute()) {
                return [
                    'success' => true,
                    'message' => 'Room deleted successfully'
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to delete room'
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
     * Get rooms by type
     */
    public function getRoomsByType($room_type) {
        try {
            $conn = $this->db->getConnection();
            
            $query = "SELECT * FROM meeting_rooms WHERE room_type = :room_type AND is_available = 1 ORDER BY room_name";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':room_type', $room_type);
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
     * Search rooms by criteria
     */
    public function searchRooms($search_term, $capacity_min = null, $capacity_max = null, $room_type = null) {
        try {
            $conn = $this->db->getConnection();
            
            $where_conditions = ["is_available = 1"];
            $params = [];
            
            if ($search_term) {
                $where_conditions[] = "(room_name LIKE :search_term OR room_number LIKE :search_term OR description LIKE :search_term)";
                $params[':search_term'] = "%$search_term%";
            }
            
            if ($capacity_min !== null) {
                $where_conditions[] = "capacity >= :capacity_min";
                $params[':capacity_min'] = $capacity_min;
            }
            
            if ($capacity_max !== null) {
                $where_conditions[] = "capacity <= :capacity_max";
                $params[':capacity_max'] = $capacity_max;
            }
            
            if ($room_type) {
                $where_conditions[] = "room_type = :room_type";
                $params[':room_type'] = $room_type;
            }
            
            $where_clause = implode(' AND ', $where_conditions);
            $query = "SELECT * FROM meeting_rooms WHERE $where_clause ORDER BY room_name";
            
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
}

// API endpoints for meeting rooms
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $roomService = new MeetingRoomService();
    
    if (isset($_GET['action'])) {
        switch ($_GET['action']) {
            case 'get_all':
                $result = $roomService->getAllRooms();
                echo json_encode($result);
                break;
                
            case 'get_by_id':
                if (isset($_GET['room_id'])) {
                    $result = $roomService->getRoomById($_GET['room_id']);
                    echo json_encode($result);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Room ID required']);
                }
                break;
                
            case 'get_available':
                if (isset($_GET['start_time']) && isset($_GET['end_time'])) {
                    $exclude_id = isset($_GET['exclude_id']) ? $_GET['exclude_id'] : null;
                    $result = $roomService->getAvailableRooms($_GET['start_time'], $_GET['end_time'], $exclude_id);
                    echo json_encode($result);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Start time and end time required']);
                }
                break;
                
            case 'get_by_type':
                if (isset($_GET['room_type'])) {
                    $result = $roomService->getRoomsByType($_GET['room_type']);
                    echo json_encode($result);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Room type required']);
                }
                break;
                
            case 'search':
                $search_term = isset($_GET['search']) ? $_GET['search'] : '';
                $capacity_min = isset($_GET['capacity_min']) ? $_GET['capacity_min'] : null;
                $capacity_max = isset($_GET['capacity_max']) ? $_GET['capacity_max'] : null;
                $room_type = isset($_GET['room_type']) ? $_GET['room_type'] : null;
                
                $result = $roomService->searchRooms($search_term, $capacity_min, $capacity_max, $room_type);
                echo json_encode($result);
                break;
                
            default:
                echo json_encode(['success' => false, 'message' => 'Invalid action']);
        }
    } else {
        // Default: get all rooms
        $result = $roomService->getAllRooms();
        echo json_encode($result);
    }
}

// POST requests for admin operations
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $roomService = new MeetingRoomService();
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (isset($input['action'])) {
        switch ($input['action']) {
            case 'create':
                if (isset($input['room_data'])) {
                    $result = $roomService->createRoom($input['room_data']);
                    echo json_encode($result);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Room data required']);
                }
                break;
                
            case 'update':
                if (isset($input['room_id']) && isset($input['room_data'])) {
                    $result = $roomService->updateRoom($input['room_id'], $input['room_data']);
                    echo json_encode($result);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Room ID and room data required']);
                }
                break;
                
            case 'delete':
                if (isset($input['room_id'])) {
                    $result = $roomService->deleteRoom($input['room_id']);
                    echo json_encode($result);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Room ID required']);
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



