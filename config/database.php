<?php
/**
 * Database configuration for Spacio Meeting Room Booker
 * Updated for better connection handling and error reporting
 */

class Database {
    private $host = 'localhost';
    private $db_name = 'spacio_meeting_db';
    private $username = 'root';
    private $password = '';
    private $conn;

    public function getConnection() {
        $this->conn = null;

        try {
            // Set timezone to Asia/Jakarta
            date_default_timezone_set('Asia/Jakarta');
            
            // Create PDO connection with proper error handling
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4",
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
                ]
            );
            
            return $this->conn;
            
        } catch(PDOException $exception) {
            // Log error for debugging
            error_log("Database connection error: " . $exception->getMessage());
            
            // Return null on connection failure
            return null;
        }
    }

    public function closeConnection() {
        $this->conn = null;
    }

    // Test connection method
    public function testConnection() {
        try {
            $conn = $this->getConnection();
            if ($conn) {
                $stmt = $conn->query("SELECT 1");
                return $stmt->fetch() ? true : false;
            }
            return false;
        } catch (Exception $e) {
            return false;
        }
    }

    // Get database info
    public function getDatabaseInfo() {
        try {
            $conn = $this->getConnection();
            if ($conn) {
                $stmt = $conn->query("SELECT DATABASE() as current_db, VERSION() as mysql_version");
                return $stmt->fetch();
            }
            return null;
        } catch (Exception $e) {
            return null;
        }
    }


}

// Database configuration constants
define('DB_HOST', 'localhost');
define('DB_NAME', 'spacio_meeting_db');
define('DB_USER', 'root');
define('DB_PASS', '');

// Alternative connection function with better error handling
function getDBConnection() {
    try {
        $pdo = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
            ]
        );
        return $pdo;
    } catch(PDOException $e) {
        error_log("Database connection failed: " . $e->getMessage());
        return null;
    }
}

// Connection test function
function testDatabaseConnection() {
    try {
        $pdo = getDBConnection();
        if ($pdo) {
            $stmt = $pdo->query("SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = '" . DB_NAME . "'");
            $result = $stmt->fetch();
            return [
                'success' => true,
                'table_count' => $result['table_count'],
                'message' => 'Database connection successful'
            ];
        } else {
            return [
                'success' => false,
                'message' => 'Failed to establish database connection'
            ];
        }
    } catch (Exception $e) {
        return [
            'success' => false,
            'message' => 'Database connection error: ' . $e->getMessage()
        ];
    }
}


?>
