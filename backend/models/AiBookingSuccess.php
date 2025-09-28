<?php
/**
 * Model untuk menangani data pemesanan AI yang berhasil
 */

class AiBookingSuccess {
    private $conn;
    private $table_name = "ai_bookings_success";

    public function __construct($db) {
        // Check if $db is a Database instance or PDO connection
        if ($db instanceof Database) {
            $this->conn = $db->getConnection();
        } else {
            // $db is already a PDO connection
            $this->conn = $db;
        }
    }

    /**
     * Menyimpan data pemesanan yang berhasil
     */
    public function createSuccessBooking($data) {
        try {
            error_log("Creating success booking with data: " . json_encode($data));
            
            $query = "INSERT INTO " . $this->table_name . " 
                     (user_id, session_id, room_id, room_name, topic, pic, participants, 
                      meeting_date, meeting_time, end_time, duration, meeting_type, booking_state) 
                     VALUES 
                     (:user_id, :session_id, :room_id, :room_name, :topic, :pic, :participants, 
                      :meeting_date, :meeting_time, :end_time, :duration, :meeting_type, :booking_state)";

            $stmt = $this->conn->prepare($query);

            // Bind parameters with default values
            $user_id = $data['user_id'];
            $session_id = $data['session_id'];
            $room_id = $data['room_id'];
            $room_name = $data['room_name'] ?? '';
            $topic = $data['topic'] ?? '';
            $pic = $data['pic'] ?? '-';
            $participants = $data['participants'] ?? 0;
            $meeting_date = $data['meeting_date'] ?? date('Y-m-d');
            $meeting_time = $data['meeting_time'] ?? '09:00:00';
            $duration = $data['duration'] ?? 60;
            
            // Calculate end_time from meeting_time + duration
            $end_time = $data['end_time'] ?? null;
            if (!$end_time && $meeting_time && $duration) {
                try {
                    $startTime = new DateTime($meeting_time);
                    $startTime->add(new DateInterval('PT' . $duration . 'M'));
                    $end_time = $startTime->format('H:i:s');
                } catch (Exception $e) {
                    error_log("Error calculating end_time: " . $e->getMessage());
                    $end_time = null;
                }
            }
            
            $meeting_type = $data['meeting_type'] ?? 'internal';
            
            // Set booking state
            $booking_state = 'BOOKED';
            
            error_log("Binding parameters: user_id=$user_id, session_id=$session_id, room_id=$room_id, room_name=$room_name, topic=$topic, pic=$pic, participants=$participants, meeting_date=$meeting_date, meeting_time=$meeting_time, end_time=$end_time, duration=$duration, meeting_type=$meeting_type");
            
            $stmt->bindParam(":user_id", $user_id);
            $stmt->bindParam(":session_id", $session_id);
            $stmt->bindParam(":room_id", $room_id);
            $stmt->bindParam(":room_name", $room_name);
            $stmt->bindParam(":topic", $topic);
            $stmt->bindParam(":pic", $pic);
            $stmt->bindParam(":participants", $participants);
            $stmt->bindParam(":meeting_date", $meeting_date);
            $stmt->bindParam(":meeting_time", $meeting_time);
            $stmt->bindParam(":end_time", $end_time);
            $stmt->bindParam(":duration", $duration);
            $stmt->bindParam(":meeting_type", $meeting_type);
            $stmt->bindParam(":booking_state", $booking_state);

            if ($stmt->execute()) {
                $insertId = $this->conn->lastInsertId();
                error_log("Success booking created with ID: $insertId");
                return $insertId;
            } else {
                $errorInfo = $stmt->errorInfo();
                error_log("Failed to execute statement: " . json_encode($errorInfo));
                return false;
            }
        } catch (PDOException $e) {
            error_log("Error creating success booking: " . $e->getMessage());
            error_log("PDO Error Code: " . $e->getCode());
            error_log("PDO Error Info: " . json_encode($e->errorInfo));
            return false;
        } catch (Exception $e) {
            error_log("General error creating success booking: " . $e->getMessage());
            error_log("Exception Code: " . $e->getCode());
            return false;
        }
    }

    /**
     * Mengambil semua pemesanan yang berhasil berdasarkan user_id
     */
    public function getSuccessBookingsByUserId($userId) {
        try {
            $query = "SELECT abs.*, mr.image_url 
                     FROM " . $this->table_name . " abs
                     LEFT JOIN meeting_rooms mr ON abs.room_id = mr.id
                     WHERE abs.user_id = :user_id 
                     ORDER BY abs.created_at DESC";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":user_id", $userId);
            $stmt->execute();

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error getting success bookings by user ID: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Mengambil pemesanan berdasarkan session_id
     */
    public function getSuccessBookingBySessionId($sessionId) {
        try {
            $query = "SELECT * FROM " . $this->table_name . " 
                     WHERE session_id = :session_id 
                     ORDER BY created_at DESC 
                     LIMIT 1";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":session_id", $sessionId);
            $stmt->execute();

            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error getting success booking by session ID: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Mengambil semua pemesanan yang berhasil
     */
    public function getAllSuccessBookings() {
        try {
            $query = "SELECT * FROM " . $this->table_name . " 
                     ORDER BY created_at DESC";
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute();

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error getting all success bookings: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Mengupdate status pemesanan
     */
    public function updateBookingState($id, $bookingState) {
        try {
            $query = "UPDATE " . $this->table_name . " 
                     SET booking_state = :booking_state, updated_at = CURRENT_TIMESTAMP 
                     WHERE id = :id";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":booking_state", $bookingState);
            $stmt->bindParam(":id", $id);

            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Error updating booking state: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Menyelesaikan pemesanan AI
     */
    public function completeBooking($id) {
        try {
            $query = "UPDATE " . $this->table_name . " 
                     SET booking_state = 'COMPLETED', updated_at = CURRENT_TIMESTAMP 
                     WHERE id = :id";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":id", $id);
            
            if ($stmt->execute()) {
                return $stmt->rowCount() > 0;
            }
            return false;
        } catch (PDOException $e) {
            error_log("Error completing AI booking: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Menghapus pemesanan berdasarkan ID
     */
    public function deleteSuccessBooking($id, $cancelReason = null) {
        try {
            if ($cancelReason) {
                // Update booking state to CANCELLED and save reason (DO NOT DELETE)
                $query = "UPDATE " . $this->table_name . " 
                         SET booking_state = 'CANCELLED', cancel_reason = :cancel_reason, updated_at = CURRENT_TIMESTAMP 
                         WHERE id = :id";
                
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(":id", $id);
                $stmt->bindParam(":cancel_reason", $cancelReason);
                
                $result = $stmt->execute();
                $rowCount = $stmt->rowCount();
                
                error_log("UPDATE query executed for ID: $id with reason: $cancelReason, Result: " . ($result ? 'true' : 'false') . ", Rows affected: $rowCount");
                
                return $result && $rowCount > 0;
            } else {
                // Original delete without reason
                $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
                
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(":id", $id);

                $result = $stmt->execute();
                $rowCount = $stmt->rowCount();
                
                // Log untuk debug
                error_log("DELETE query executed for ID: $id, Result: " . ($result ? 'true' : 'false') . ", Rows affected: $rowCount");
                
                return $result && $rowCount > 0;
            }
        } catch (PDOException $e) {
            error_log("Error deleting success booking: " . $e->getMessage());
            return false;
        }
    }


    /**
     * Alias untuk deleteSuccessBooking untuk kompatibilitas dengan API
     */
    public function deleteBooking($id, $cancelReason = null) {
        return $this->deleteSuccessBooking($id, $cancelReason);
    }

    /**
     * Get bookings by user ID
     */
    public function getBookingsByUserId($userId) {
        try {
            $query = "SELECT b.*, 
                             COALESCE(r.room_name, b.room_name) as room_name, 
                             r.capacity as room_capacity, 
                             r.image_url
                      FROM " . $this->table_name . " b
                      LEFT JOIN meeting_rooms r ON b.room_id = r.id
                      WHERE b.user_id = :user_id 
                        AND b.booking_state = 'BOOKED' AND b.booking_state != 'COMPLETED'
                      ORDER BY b.created_at DESC";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":user_id", $userId);
            $stmt->execute();

            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            error_log("AI Bookings - Found " . count($result) . " bookings for user $userId");
            
            return $result;
        } catch (PDOException $e) {
            error_log("Error getting AI bookings by user ID: " . $e->getMessage());
            return [];
        }
    }
}
?>

