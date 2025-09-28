<?php
/**
 * Meeting Room Model
 * Handles all database operations for meeting rooms
 */

class MeetingRoom {
    private $conn;
    private $table_name = "meeting_rooms";

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Get all meeting rooms (including inactive ones)
     */
    public function getAllRooms() {
        try {
            // Check if is_active field exists
            $checkQuery = "SHOW COLUMNS FROM " . $this->table_name . " LIKE 'is_active'";
            $checkStmt = $this->conn->prepare($checkQuery);
            $checkStmt->execute();
            $hasIsActiveField = $checkStmt->rowCount() > 0;
            
            if ($hasIsActiveField) {
                // Include all rooms (active and inactive) and include is_active field
                $query = "SELECT id, room_name, room_number, capacity, floor, building, description, features, image_url, is_available, is_maintenance, is_active, created_at, updated_at
                          FROM " . $this->table_name . "
                          ORDER BY room_name";
            } else {
                // Fallback to is_available field
                $query = "SELECT id, room_name, room_number, capacity, floor, building, description, features, image_url, is_available, is_maintenance, created_at, updated_at
                          FROM " . $this->table_name . "
                          WHERE is_available = 1
                          ORDER BY room_name";
            }
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            $rooms = $stmt->fetchAll();
            
            // Ensure is_active field is present in all results
            if (!$hasIsActiveField) {
                foreach ($rooms as &$room) {
                    $room['is_active'] = $room['is_available'];
                }
            }
            
            return $rooms;
        } catch (PDOException $e) {
            error_log("Error getting all rooms: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get room by ID
     */
    public function getRoomById($id) {
        try {
            // Check if is_active field exists
            $checkQuery = "SHOW COLUMNS FROM " . $this->table_name . " LIKE 'is_active'";
            $checkStmt = $this->conn->prepare($checkQuery);
            $checkStmt->execute();
            $hasIsActiveField = $checkStmt->rowCount() > 0;
            
            if ($hasIsActiveField) {
                $query = "SELECT id, room_name, room_number, capacity, floor, building, description, features, image_url, is_available, is_maintenance, is_active, created_at, updated_at
                          FROM " . $this->table_name . " WHERE id = :id";
            } else {
                $query = "SELECT id, room_name, room_number, capacity, floor, building, description, features, image_url, is_available, is_maintenance, created_at, updated_at
                          FROM " . $this->table_name . " WHERE id = :id AND is_available = 1";
            }
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":id", $id);
            $stmt->execute();
            $room = $stmt->fetch();
            
            // Ensure is_active field is present
            if ($room && !$hasIsActiveField) {
                $room['is_active'] = $room['is_available'];
            }
            
            return $room;
        } catch (PDOException $e) {
            error_log("Error getting room by ID: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get room by name
     */
    public function getRoomByName($name) {
        try {
            $query = "SELECT id, room_name AS name, room_number, capacity, floor, building, description, features, image_url, is_available, is_maintenance, created_at, updated_at
                      FROM " . $this->table_name . " WHERE room_name = :name AND is_available = 1";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":name", $name);
            $stmt->execute();

            return $stmt->fetch();
        } catch (PDOException $e) {
            error_log("Error getting room by name: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get rooms by capacity
     */
    public function getRoomsByCapacity($minCapacity, $maxCapacity = null) {
        try {
            if ($maxCapacity) {
                $query = "SELECT * FROM " . $this->table_name . " 
                         WHERE capacity >= :min_capacity AND capacity <= :max_capacity AND is_active = true 
                         ORDER BY capacity, name";
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(":min_capacity", $minCapacity);
                $stmt->bindParam(":max_capacity", $maxCapacity);
            } else {
                $query = "SELECT * FROM " . $this->table_name . " 
                         WHERE capacity >= :min_capacity AND is_active = true 
                         ORDER BY capacity, name";
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(":min_capacity", $minCapacity);
            }

            $stmt->execute();
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Error getting rooms by capacity: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get rooms by floor
     */
    public function getRoomsByFloor($floor) {
        try {
            $query = "SELECT * FROM " . $this->table_name . " 
                     WHERE floor = :floor AND is_active = true 
                     ORDER BY name";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":floor", $floor);
            $stmt->execute();

            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Error getting rooms by floor: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get rooms by facilities
     */
    public function getRoomsByFacilities($facilities) {
        try {
            if (is_array($facilities)) {
                $facilities = json_encode($facilities);
            }

            $query = "SELECT * FROM " . $this->table_name . " 
                     WHERE JSON_CONTAINS(facilities, :facilities) AND is_active = true 
                     ORDER BY name";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":facilities", $facilities);
            $stmt->execute();

            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Error getting rooms by facilities: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Create new meeting room
     */
    public function createRoom($data) {
        try {
            // Convert facilities array to JSON string if it's an array
            $facilities = $data['facilities'];
            if (is_array($facilities)) {
                $facilities = json_encode($facilities);
            } else if (is_string($facilities)) {
                // If it's a string, keep it as is
                $facilities = $facilities;
            } else {
                $facilities = '';
            }

            error_log("Create room - Data: " . json_encode($data));
            error_log("Create room - Facilities: " . $facilities);

            $query = "INSERT INTO " . $this->table_name . " 
                     (room_name, floor, capacity, building, features, image_url, is_available, is_maintenance, created_at, updated_at)
                     VALUES (:name, '-', :capacity, :address, :facilities, :image_url, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)";

            error_log("Create room - Query: " . $query);

            $stmt = $this->conn->prepare($query);

            // Bind parameters
            $imageUrl = $data['image_url'] ?? '/images/meeting-rooms/default-room.jpg';
            $stmt->bindParam(":name", $data['name']);
            $stmt->bindParam(":capacity", $data['capacity']);
            $stmt->bindParam(":address", $data['address']);
            $stmt->bindParam(":facilities", $facilities);
            $stmt->bindParam(":image_url", $imageUrl);

            $result = $stmt->execute();
            error_log("Create room - Execute result: " . ($result ? 'true' : 'false'));
            
            if ($result) {
                $newRoomId = $this->conn->lastInsertId();
                $newRoom = $this->getRoomById($newRoomId);
                error_log("Create room - New room: " . json_encode($newRoom));
                return $newRoom;
            }
            return false;
        } catch (PDOException $e) {
            error_log("Error creating room: " . $e->getMessage());
            error_log("Error creating room - Stack trace: " . $e->getTraceAsString());
            return false;
        }
    }

    /**
     * Update meeting room
     */
    public function updateRoom($data) {
        try {
            // Convert facilities array to JSON string if it's an array
            $facilities = $data['facilities'];
            if (is_array($facilities)) {
                $facilities = json_encode($facilities);
            } else if (is_string($facilities)) {
                // If it's a string, keep it as is
                $facilities = $facilities;
            } else {
                $facilities = '';
            }

            error_log("Update room - Data: " . json_encode($data));
            error_log("Update room - Facilities: " . $facilities);

            $query = "UPDATE " . $this->table_name . "
                    SET room_name = :name, floor = :floor, capacity = :capacity,
                        building = :address, features = :facilities, 
                        image_url = :image_url, updated_at = CURRENT_TIMESTAMP
                    WHERE id = :id";

            error_log("Update room - Query: " . $query);

            $stmt = $this->conn->prepare($query);

            // Bind parameters
            $imageUrl = $data['image_url'] ?? null;
            $stmt->bindParam(":id", $data['id']);
            $stmt->bindParam(":name", $data['name']);
            $stmt->bindParam(":floor", $data['floor']);
            $stmt->bindParam(":capacity", $data['capacity']);
            $stmt->bindParam(":address", $data['address']);
            $stmt->bindParam(":facilities", $facilities);
            $stmt->bindParam(":image_url", $imageUrl);

            $result = $stmt->execute();
            error_log("Update room - Execute result: " . ($result ? 'true' : 'false'));
            
            if ($result) {
                $updatedRoom = $this->getRoomById($data['id']);
                error_log("Update room - Updated room: " . json_encode($updatedRoom));
                return $updatedRoom;
            }
            return false;
        } catch (PDOException $e) {
            error_log("Error updating room: " . $e->getMessage());
            error_log("Error updating room - Stack trace: " . $e->getTraceAsString());
            return false;
        }
    }

    /**
     * Delete meeting room (hard delete)
     */
    public function deleteRoom($id) {
        try {
            // First check if room has any active bookings
            $checkQuery = "SELECT COUNT(*) as booking_count FROM bookings 
                          WHERE room_id = :id AND status IN ('BOOKED', 'CONFIRMED', 'ONGOING')";
            $checkStmt = $this->conn->prepare($checkQuery);
            $checkStmt->bindParam(":id", $id);
            $checkStmt->execute();
            $result = $checkStmt->fetch();
            
            if ($result && $result['booking_count'] > 0) {
                error_log("Cannot delete room $id: has active bookings");
                return false;
            }
            
            // Delete the room completely from database
            $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":id", $id);

            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Error deleting room: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get room availability for a specific date
     */
    public function getRoomAvailability($roomId, $date) {
        try {
            $query = "SELECT ra.time_slot, ra.is_available, b.topic, b.start_time, b.end_time
                     FROM room_availability ra
                     LEFT JOIN bookings b ON ra.booking_id = b.id
                     WHERE ra.room_id = :room_id AND ra.date = :date
                     ORDER BY ra.time_slot";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":room_id", $roomId);
            $stmt->bindParam(":date", $date);
            $stmt->execute();

            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Error getting room availability: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get room statistics
     */
    public function getRoomStatistics($roomId = null) {
        try {
            if ($roomId) {
                $query = "SELECT 
                            r.name,
                            COUNT(b.id) as total_bookings,
                            COUNT(CASE WHEN b.status_id = 1 THEN 1 END) as pending_bookings,
                            COUNT(CASE WHEN b.status_id = 2 THEN 1 END) as confirmed_bookings,
                            COUNT(CASE WHEN b.status_id = 3 THEN 1 END) as cancelled_bookings,
                            COUNT(CASE WHEN b.status_id = 4 THEN 1 END) as completed_bookings,
                            AVG(b.participants) as avg_participants
                         FROM meeting_rooms r
                         LEFT JOIN bookings b ON r.id = b.room_id
                         WHERE r.id = :room_id AND r.is_active = true
                         GROUP BY r.id, r.name";
                
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(":room_id", $roomId);
            } else {
                $query = "SELECT 
                            r.name,
                            COUNT(b.id) as total_bookings,
                            COUNT(CASE WHEN b.status_id = 1 THEN 1 END) as pending_bookings,
                            COUNT(CASE WHEN b.status_id = 2 THEN 1 END) as confirmed_bookings,
                            COUNT(CASE WHEN b.status_id = 3 THEN 1 END) as cancelled_bookings,
                            COUNT(CASE WHEN b.status_id = 4 THEN 1 END) as completed_bookings,
                            AVG(b.participants) as avg_participants
                         FROM meeting_rooms r
                         LEFT JOIN bookings b ON r.id = b.room_id
                         WHERE r.is_active = true
                         GROUP BY r.id, r.name
                         ORDER BY total_bookings DESC";
                
                $stmt = $this->conn->prepare($query);
            }

            $stmt->execute();
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Error getting room statistics: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Search rooms by criteria
     */
    public function searchRooms($criteria) {
        try {
            $whereConditions = ["is_active = true"];
            $params = [];

            if (!empty($criteria['name'])) {
                $whereConditions[] = "name LIKE :name";
                $params[':name'] = '%' . $criteria['name'] . '%';
            }

            if (!empty($criteria['floor'])) {
                $whereConditions[] = "floor = :floor";
                $params[':floor'] = $criteria['floor'];
            }

            if (!empty($criteria['min_capacity'])) {
                $whereConditions[] = "capacity >= :min_capacity";
                $params[':min_capacity'] = $criteria['min_capacity'];
            }

            if (!empty($criteria['max_capacity'])) {
                $whereConditions[] = "capacity <= :max_capacity";
                $params[':max_capacity'] = $criteria['max_capacity'];
            }

            if (!empty($criteria['facilities'])) {
                $whereConditions[] = "JSON_CONTAINS(facilities, :facilities)";
                $params[':facilities'] = json_encode($criteria['facilities']);
            }

            $whereClause = implode(' AND ', $whereConditions);
            $query = "SELECT * FROM " . $this->table_name . " WHERE " . $whereClause . " ORDER BY name";

            $stmt = $this->conn->prepare($query);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();

            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Error searching rooms: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Update room status (activate/deactivate)
     */
    public function updateRoomStatus($id, $isActive) {
        try {
            // First check if is_active field exists, if not use is_available field
            $checkQuery = "SHOW COLUMNS FROM " . $this->table_name . " LIKE 'is_active'";
            $checkStmt = $this->conn->prepare($checkQuery);
            $checkStmt->execute();
            $hasIsActiveField = $checkStmt->rowCount() > 0;
            
            if ($hasIsActiveField) {
                $query = "UPDATE " . $this->table_name . " 
                         SET is_active = :is_active, updated_at = CURRENT_TIMESTAMP 
                         WHERE id = :id";
            } else {
                // Fallback to is_available field
                $query = "UPDATE " . $this->table_name . " 
                         SET is_available = :is_active, updated_at = CURRENT_TIMESTAMP 
                         WHERE id = :id";
            }
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":id", $id);
            $stmt->bindParam(":is_active", $isActive, PDO::PARAM_BOOL);

            $result = $stmt->execute();
            
            if ($result) {
                // Get updated room data
                $getQuery = "SELECT id, room_name, room_number, capacity, floor, building, description, features, image_url, is_available, is_maintenance, created_at, updated_at";
                if ($hasIsActiveField) {
                    $getQuery .= ", is_active";
                }
                $getQuery .= " FROM " . $this->table_name . " WHERE id = :id";
                
                $getStmt = $this->conn->prepare($getQuery);
                $getStmt->bindParam(":id", $id);
                $getStmt->execute();
                
                $roomData = $getStmt->fetch();
                
                // Ensure is_active field is present in response
                if ($roomData && !$hasIsActiveField) {
                    $roomData['is_active'] = $roomData['is_available'];
                }
                
                return $roomData;
            }
            return false;
        } catch (PDOException $e) {
            error_log("Error updating room status: " . $e->getMessage());
            return false;
        }
    }

}
?>
