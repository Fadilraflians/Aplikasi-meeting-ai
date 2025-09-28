<?php
/**
 * User Model
 * Handles all database operations for users
 */

class User {
    private $conn;
    private $table_name = "users";

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Create new user
     */
    public function createUser($data) {
        try {
            $query = "INSERT INTO " . $this->table_name . "
                    (username, email, password_hash, full_name, department, position, phone)
                    VALUES (:username, :email, :password_hash, :full_name, :department, :position, :phone)";

            $stmt = $this->conn->prepare($query);

            // Hash password
            $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);

            // Bind parameters
            $stmt->bindParam(":username", $data['username']);
            $stmt->bindParam(":email", $data['email']);
            $stmt->bindParam(":password_hash", $passwordHash);
            $stmt->bindParam(":full_name", $data['full_name']);
            $stmt->bindParam(":department", $data['department'] ?? null);
            $stmt->bindParam(":position", $data['position'] ?? null);
            $stmt->bindParam(":phone", $data['phone'] ?? null);

            if ($stmt->execute()) {
                $userId = $this->conn->lastInsertId();
                return $this->getUserById($userId);
            }
            return false;
        } catch (PDOException $e) {
            error_log("Error creating user: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get user by ID
     */
    public function getUserById($id) {
        try {
            $query = "SELECT id, username, email, full_name, department, position, phone, created_at, updated_at
                     FROM " . $this->table_name . " WHERE id = :id";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":id", $id);
            $stmt->execute();

            return $stmt->fetch();
        } catch (PDOException $e) {
            error_log("Error getting user by ID: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get user by username
     */
    public function getUserByUsername($username) {
        try {
            $query = "SELECT * FROM " . $this->table_name . " WHERE username = :username";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":username", $username);
            $stmt->execute();

            return $stmt->fetch();
        } catch (PDOException $e) {
            error_log("Error getting user by username: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get user by email
     */
    public function getUserByEmail($email) {
        try {
            $query = "SELECT * FROM " . $this->table_name . " WHERE email = :email";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":email", $email);
            $stmt->execute();

            return $stmt->fetch();
        } catch (PDOException $e) {
            error_log("Error getting user by email: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Authenticate user
     */
    public function authenticateUser($username, $password) {
        try {
            $user = $this->getUserByUsername($username);
            if (!$user) {
                return false;
            }

            if (password_verify($password, $user['password_hash'])) {
                // Remove password hash from response
                unset($user['password_hash']);
                return $user;
            }
            return false;
        } catch (PDOException $e) {
            error_log("Error authenticating user: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Update user
     */
    public function updateUser($data) {
        try {
            $query = "UPDATE " . $this->table_name . "
                    SET full_name = :full_name, department = :department, 
                        position = :position, phone = :phone, 
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = :id";

            $stmt = $this->conn->prepare($query);

            // Bind parameters
            $stmt->bindParam(":id", $data['id']);
            $stmt->bindParam(":full_name", $data['full_name']);
            $stmt->bindParam(":department", $data['department'] ?? null);
            $stmt->bindParam(":position", $data['position'] ?? null);
            $stmt->bindParam(":phone", $data['phone'] ?? null);

            if ($stmt->execute()) {
                return $this->getUserById($data['id']);
            }
            return false;
        } catch (PDOException $e) {
            error_log("Error updating user: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Change password
     */
    public function changePassword($userId, $newPassword) {
        try {
            $query = "UPDATE " . $this->table_name . "
                    SET password_hash = :password_hash, updated_at = CURRENT_TIMESTAMP
                    WHERE id = :id";

            $stmt = $this->conn->prepare($query);

            // Hash new password
            $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);

            // Bind parameters
            $stmt->bindParam(":id", $userId);
            $stmt->bindParam(":password_hash", $passwordHash);

            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Error changing password: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Delete user
     */
    public function deleteUser($id) {
        try {
            $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":id", $id);

            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Error deleting user: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get all users
     */
    public function getAllUsers() {
        try {
            $query = "SELECT id, username, email, full_name, department, position, phone, created_at, updated_at
                     FROM " . $this->table_name . " ORDER BY created_at DESC";
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute();

            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Error getting all users: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Search users
     */
    public function searchUsers($criteria) {
        try {
            $whereConditions = [];
            $params = [];

            if (!empty($criteria['username'])) {
                $whereConditions[] = "username LIKE :username";
                $params[':username'] = '%' . $criteria['username'] . '%';
            }

            if (!empty($criteria['email'])) {
                $whereConditions[] = "email LIKE :email";
                $params[':email'] = '%' . $criteria['email'] . '%';
            }

            if (!empty($criteria['full_name'])) {
                $whereConditions[] = "full_name LIKE :full_name";
                $params[':full_name'] = '%' . $criteria['full_name'] . '%';
            }

            if (!empty($criteria['department'])) {
                $whereConditions[] = "department = :department";
                $params[':department'] = $criteria['department'];
            }

            if (!empty($criteria['position'])) {
                $whereConditions[] = "position = :position";
                $params[':position'] = $criteria['position'];
            }

            $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
            $query = "SELECT id, username, email, full_name, department, position, phone, created_at, updated_at
                     FROM " . $this->table_name . " " . $whereClause . " ORDER BY created_at DESC";

            $stmt = $this->conn->prepare($query);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();

            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Error searching users: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get user statistics
     */
    public function getUserStatistics($userId = null) {
        try {
            if ($userId) {
                $query = "SELECT 
                            u.username,
                            u.full_name,
                            COUNT(b.id) as total_bookings,
                            COUNT(CASE WHEN b.status_id = 1 THEN 1 END) as pending_bookings,
                            COUNT(CASE WHEN b.status_id = 2 THEN 1 END) as confirmed_bookings,
                            COUNT(CASE WHEN b.status_id = 3 THEN 1 END) as cancelled_bookings,
                            COUNT(CASE WHEN b.status_id = 4 THEN 1 END) as completed_bookings,
                            AVG(b.participants) as avg_participants,
                            SUM(CASE WHEN b.ai_agent_created = 1 THEN 1 ELSE 0 END) as ai_bookings,
                            SUM(CASE WHEN b.form_created = 1 THEN 1 ELSE 0 END) as form_bookings
                         FROM users u
                         LEFT JOIN bookings b ON u.id = b.user_id
                         WHERE u.id = :user_id
                         GROUP BY u.id, u.username, u.full_name";
                
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(":user_id", $userId);
            } else {
                $query = "SELECT 
                            u.username,
                            u.full_name,
                            COUNT(b.id) as total_bookings,
                            COUNT(CASE WHEN b.status_id = 1 THEN 1 END) as pending_bookings,
                            COUNT(CASE WHEN b.status_id = 2 THEN 1 END) as confirmed_bookings,
                            COUNT(CASE WHEN b.status_id = 3 THEN 1 END) as cancelled_bookings,
                            COUNT(CASE WHEN b.status_id = 4 THEN 1 END) as completed_bookings,
                            AVG(b.participants) as avg_participants,
                            SUM(CASE WHEN b.ai_agent_created = 1 THEN 1 ELSE 0 END) as ai_bookings,
                            SUM(CASE WHEN b.form_created = 1 THEN 1 ELSE 0 END) as form_bookings
                         FROM users u
                         LEFT JOIN bookings b ON u.id = b.user_id
                         GROUP BY u.id, u.username, u.full_name
                         ORDER BY total_bookings DESC";
                
                $stmt = $this->conn->prepare($query);
            }

            $stmt->execute();
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Error getting user statistics: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Check if username exists
     */
    public function usernameExists($username, $excludeId = null) {
        try {
            $query = "SELECT COUNT(*) as count FROM " . $this->table_name . " WHERE username = :username";
            $params = [":username" => $username];

            if ($excludeId) {
                $query .= " AND id != :exclude_id";
                $params[":exclude_id"] = $excludeId;
            }

            $stmt = $this->conn->prepare($query);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();

            $result = $stmt->fetch();
            return $result['count'] > 0;
        } catch (PDOException $e) {
            error_log("Error checking username existence: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Check if email exists
     */
    public function emailExists($email, $excludeId = null) {
        try {
            $query = "SELECT COUNT(*) as count FROM " . $this->table_name . " WHERE email = :email";
            $params = [":email" => $email];

            if ($excludeId) {
                $query .= " AND id != :exclude_id";
                $params[":exclude_id"] = $excludeId;
            }

            $stmt = $this->conn->prepare($query);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();

            $result = $stmt->fetch();
            return $result['count'] > 0;
        } catch (PDOException $e) {
            error_log("Error checking email existence: " . $e->getMessage());
            return false;
        }
    }
}
?>
