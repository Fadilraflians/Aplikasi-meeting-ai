<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

class RispatAPI {
    private $db;
    private $uploadDir = '../uploads/rispat/';

    public function __construct() {
        $this->db = getConnection();
        $this->createUploadDirectories();
    }

    private function createUploadDirectories() {
        if (!file_exists($this->uploadDir)) {
            mkdir($this->uploadDir, 0755, true);
        }
    }

    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $pathParts = explode('/', trim($path, '/'));

        switch ($method) {
            case 'POST':
                $this->uploadRispat();
                break;
            case 'GET':
                if (isset($_GET['booking_id'])) {
                    $this->getRispatByBookingId($_GET['booking_id']);
                } else {
                    $this->sendResponse(['error' => 'Booking ID required'], 400);
                }
                break;
            case 'DELETE':
                if (isset($pathParts[2])) {
                    $this->deleteRispat($pathParts[2]);
                } else {
                    $this->sendResponse(['error' => 'Rispat ID required'], 400);
                }
                break;
            default:
                $this->sendResponse(['error' => 'Method not allowed'], 405);
        }
    }

    private function uploadRispat() {
        if (!isset($_FILES['file']) || !isset($_POST['booking_id']) || !isset($_POST['uploaded_by'])) {
            $this->sendResponse(['error' => 'Missing required fields'], 400);
            return;
        }

        $file = $_FILES['file'];
        $bookingId = (int)$_POST['booking_id'];
        $uploadedBy = $_POST['uploaded_by'];

        // Validate file extension
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx'];
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        
        if (!in_array($extension, $allowedExtensions)) {
            $this->sendResponse(['error' => 'File type not allowed. Supported: JPG, PNG, GIF, WEBP, PDF, DOC, DOCX'], 400);
            return;
        }

        $maxSize = 10 * 1024 * 1024; // 10MB
        if ($file['size'] > $maxSize) {
            $this->sendResponse(['error' => 'File too large. Maximum size is 10MB.'], 400);
            return;
        }

        // Generate unique filename
        $filename = 'rispat_' . uniqid() . '.' . $extension;
        $filePath = $this->uploadDir . $filename;

        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            $this->sendResponse(['error' => 'Failed to upload file'], 500);
            return;
        }

        // Determine file type based on extension
        $fileType = 'document'; // Default
        if (in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
            $fileType = 'image';
        } elseif ($extension === 'pdf') {
            $fileType = 'pdf';
        } elseif (in_array($extension, ['doc', 'docx'])) {
            $fileType = 'word';
        }

        // Truncate MIME type if too long (max 100 chars)
        $mimeType = $file['type'];
        if (strlen($mimeType) > 100) {
            $mimeType = substr($mimeType, 0, 100);
        }

        try {
            // Try to insert with old column names first (more compatible)
            $stmt = $this->db->prepare("
                INSERT INTO rispat (booking_id, file_name, original_name, file_path, file_size, file_type, uploaded_by)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $bookingId,
                $filename,
                $file['name'],
                '/uploads/rispat/' . $filename,
                $file['size'],
                $fileType,
                $uploadedBy
            ]);
        } catch (PDOException $e) {
            // If old columns don't exist, try with new column names
            if (strpos($e->getMessage(), 'Unknown column') !== false) {
                try {
                    $stmt = $this->db->prepare("
                        INSERT INTO rispat (booking_id, filename, original_filename, file_path, file_size, file_type, mime_type, uploaded_by)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ");
                    $stmt->execute([
                        $bookingId,
                        $filename,
                        $file['name'],
                        '/uploads/rispat/' . $filename,
                        $file['size'],
                        $fileType,
                        $mimeType,
                        $uploadedBy
                    ]);
                } catch (PDOException $e2) {
                    // Delete uploaded file if database insert fails
                    if (file_exists($filePath)) {
                        unlink($filePath);
                    }
                    $this->sendResponse(['error' => 'Database error: ' . $e2->getMessage()], 500);
                    return;
                }
            } else {
                // Delete uploaded file if database insert fails
                if (file_exists($filePath)) {
                    unlink($filePath);
                }
                $this->sendResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
                return;
            }
        }

        $rispatId = $this->db->lastInsertId();

        $this->sendResponse([
            'success' => true,
            'message' => 'File uploaded successfully',
            'rispat' => [
                'id' => $rispatId,
                'filename' => $filename,
                'original_filename' => $file['name'],
                'file_type' => $fileType,
                'file_size' => $file['size']
            ]
        ]);
    }

    private function getRispatByBookingId($bookingId) {
        try {
            // Try with old column names first
            $stmt = $this->db->prepare("
                SELECT 
                    r.id, r.booking_id, r.file_name, r.original_name, r.file_path,
                    r.file_size, r.file_type, r.uploaded_at, r.uploaded_by
                FROM rispat r
                WHERE r.booking_id = ? AND r.status = 'active'
                ORDER BY r.uploaded_at DESC
            ");
            $stmt->execute([$bookingId]);
            $rispat = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Format response with consistent column names
            $formattedRispat = array_map(function($item) {
                return [
                    'id' => $item['id'],
                    'booking_id' => $item['booking_id'],
                    'filename' => $item['file_name'],
                    'original_filename' => $item['original_name'],
                    'file_path' => $item['file_path'],
                    'file_size' => $item['file_size'],
                    'file_type' => $item['file_type'],
                    'uploaded_at' => $item['uploaded_at'],
                    'uploaded_by' => $item['uploaded_by']
                ];
            }, $rispat);
            
            $this->sendResponse(['rispat' => $formattedRispat]);
        } catch (PDOException $e) {
            // If old columns don't exist, try with new column names
            if (strpos($e->getMessage(), 'Unknown column') !== false) {
                try {
                    $stmt = $this->db->prepare("
                        SELECT 
                            r.id, r.booking_id, r.filename, r.original_filename, r.file_path,
                            r.file_size, r.file_type, r.mime_type, r.uploaded_at, r.uploaded_by
                        FROM rispat r
                        WHERE r.booking_id = ? AND r.status = 'active'
                        ORDER BY r.uploaded_at DESC
                    ");
                    $stmt->execute([$bookingId]);
                    $rispat = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    $this->sendResponse(['rispat' => $rispat]);
                } catch (PDOException $e2) {
                    $this->sendResponse(['error' => 'Database error: ' . $e2->getMessage()], 500);
                }
            } else {
                $this->sendResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
            }
        }
    }

    private function deleteRispat($rispatId) {
        try {
            $stmt = $this->db->prepare("UPDATE rispat SET status = 'deleted' WHERE id = ?");
            $stmt->execute([$rispatId]);
            $this->sendResponse(['message' => 'Rispat deleted successfully']);
        } catch (PDOException $e) {
            $this->sendResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }

    private function sendResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        echo json_encode($data);
        exit();
    }
}

$api = new RispatAPI();
$api->handleRequest();
?>
