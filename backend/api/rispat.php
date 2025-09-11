<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

class RispatAPI {
    private $db;
    private $uploadDir = '../uploads/rispat/';
    private $thumbnailDir = '../uploads/rispat/thumbnails/';

    public function __construct() {
        $this->db = getConnection();
        $this->createUploadDirectories();
    }

    private function createUploadDirectories() {
        if (!file_exists($this->uploadDir)) {
            mkdir($this->uploadDir, 0755, true);
        }
        if (!file_exists($this->thumbnailDir)) {
            mkdir($this->thumbnailDir, 0755, true);
        }
    }

    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $pathParts = explode('/', trim($path, '/'));

        try {
            switch ($method) {
                case 'GET':
                    if (isset($pathParts[3]) && $pathParts[3] === 'booking') {
                        $this->getRispatByBookingId($pathParts[4]);
                    } elseif (isset($pathParts[3]) && $pathParts[3] === 'image') {
                        $this->getRispatImage($pathParts[4]);
                    } elseif (isset($pathParts[3]) && $pathParts[3] === 'thumbnail') {
                        $this->getRispatThumbnail($pathParts[4]);
                    } else {
                        $this->getAllRispat();
                    }
                    break;
                case 'POST':
                    if (isset($pathParts[3]) && $pathParts[3] === 'upload') {
                        $this->uploadRispat();
                    } else {
                        $this->createRispat();
                    }
                    break;
                case 'DELETE':
                    $this->deleteRispat($pathParts[3]);
                    break;
                default:
                    $this->sendResponse(['error' => 'Method not allowed'], 405);
            }
        } catch (Exception $e) {
            $this->sendResponse(['error' => $e->getMessage()], 500);
        }
    }

    private function getRispatByBookingId($bookingId) {
        $stmt = $this->db->prepare("
            SELECT 
                r.id, r.booking_id, r.filename, r.original_filename, r.file_path,
                r.file_size, r.file_type, r.mime_type, r.uploaded_at, r.uploaded_by,
                rm.image_width, rm.image_height, rm.camera_model, rm.taken_at,
                rm.location, rm.description, rm.tags
            FROM rispat r
            LEFT JOIN rispat_metadata rm ON r.id = rm.rispat_id
            WHERE r.booking_id = ? AND r.status = 'active'
            ORDER BY r.uploaded_at DESC
        ");
        $stmt->execute([$bookingId]);
        $rispat = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $this->sendResponse(['rispat' => $rispat]);
    }

    private function getAllRispat() {
        $stmt = $this->db->prepare("
            SELECT 
                r.id, r.booking_id, r.filename, r.original_filename, r.file_path,
                r.file_size, r.file_type, r.mime_type, r.uploaded_at, r.uploaded_by,
                rm.image_width, rm.image_height, rm.camera_model, rm.taken_at,
                rm.location, rm.description, rm.tags
            FROM rispat r
            LEFT JOIN rispat_metadata rm ON r.id = rm.rispat_id
            WHERE r.status = 'active'
            ORDER BY r.uploaded_at DESC
        ");
        $stmt->execute();
        $rispat = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $this->sendResponse(['rispat' => $rispat]);
    }

    private function uploadRispat() {
        if (!isset($_FILES['file']) || !isset($_POST['booking_id'])) {
            $this->sendResponse(['error' => 'File and booking_id are required'], 400);
            return;
        }

        $file = $_FILES['file'];
        $bookingId = $_POST['booking_id'];
        $uploadedBy = $_POST['uploaded_by'] ?? 'user';

        // Validate file
        $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($file['type'], $allowedTypes)) {
            $this->sendResponse(['error' => 'Invalid file type. Only images are allowed.'], 400);
            return;
        }

        $maxSize = 10 * 1024 * 1024; // 10MB
        if ($file['size'] > $maxSize) {
            $this->sendResponse(['error' => 'File too large. Maximum size is 10MB.'], 400);
            return;
        }

        // Generate unique filename
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'rispat_' . uniqid() . '.' . $extension;
        $filePath = $this->uploadDir . $filename;

        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            $this->sendResponse(['error' => 'Failed to upload file'], 500);
            return;
        }

        // Get image metadata
        $imageInfo = getimagesize($filePath);
        $imageWidth = $imageInfo[0] ?? null;
        $imageHeight = $imageInfo[1] ?? null;

        // Create thumbnail
        $this->createThumbnail($filePath, $filename, 300);

        // Save to database
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
            'image',
            $file['type'],
            $uploadedBy
        ]);

        $rispatId = $this->db->lastInsertId();

        // Save metadata
        if ($imageWidth && $imageHeight) {
            $stmt = $this->db->prepare("
                INSERT INTO rispat_metadata (rispat_id, image_width, image_height)
                VALUES (?, ?, ?)
            ");
            $stmt->execute([$rispatId, $imageWidth, $imageHeight]);
        }

        // Get the created rispat
        $stmt = $this->db->prepare("
            SELECT 
                r.id, r.booking_id, r.filename, r.original_filename, r.file_path,
                r.file_size, r.file_type, r.mime_type, r.uploaded_at, r.uploaded_by,
                rm.image_width, rm.image_height, rm.camera_model, rm.taken_at,
                rm.location, rm.description, rm.tags
            FROM rispat r
            LEFT JOIN rispat_metadata rm ON r.id = rm.rispat_id
            WHERE r.id = ?
        ");
        $stmt->execute([$rispatId]);
        $rispat = $stmt->fetch(PDO::FETCH_ASSOC);

        $this->sendResponse(['rispat' => $rispat, 'message' => 'File uploaded successfully']);
    }

    private function createThumbnail($sourcePath, $filename, $maxSize) {
        $thumbnailPath = $this->thumbnailDir . $filename;
        
        $imageInfo = getimagesize($sourcePath);
        $sourceWidth = $imageInfo[0];
        $sourceHeight = $imageInfo[1];
        $mimeType = $imageInfo['mime'];

        // Calculate thumbnail dimensions
        $ratio = min($maxSize / $sourceWidth, $maxSize / $sourceHeight);
        $thumbWidth = intval($sourceWidth * $ratio);
        $thumbHeight = intval($sourceHeight * $ratio);

        // Create source image
        switch ($mimeType) {
            case 'image/jpeg':
                $sourceImage = imagecreatefromjpeg($sourcePath);
                break;
            case 'image/png':
                $sourceImage = imagecreatefrompng($sourcePath);
                break;
            case 'image/gif':
                $sourceImage = imagecreatefromgif($sourcePath);
                break;
            case 'image/webp':
                $sourceImage = imagecreatefromwebp($sourcePath);
                break;
            default:
                return false;
        }

        // Create thumbnail
        $thumbnail = imagecreatetruecolor($thumbWidth, $thumbHeight);
        imagecopyresampled($thumbnail, $sourceImage, 0, 0, 0, 0, $thumbWidth, $thumbHeight, $sourceWidth, $sourceHeight);

        // Save thumbnail
        switch ($mimeType) {
            case 'image/jpeg':
                imagejpeg($thumbnail, $thumbnailPath, 85);
                break;
            case 'image/png':
                imagepng($thumbnail, $thumbnailPath);
                break;
            case 'image/gif':
                imagegif($thumbnail, $thumbnailPath);
                break;
            case 'image/webp':
                imagewebp($thumbnail, $thumbnailPath, 85);
                break;
        }

        imagedestroy($sourceImage);
        imagedestroy($thumbnail);

        return true;
    }

    private function getRispatImage($filename) {
        $filePath = $this->uploadDir . $filename;
        
        if (!file_exists($filePath)) {
            http_response_code(404);
            echo json_encode(['error' => 'File not found']);
            return;
        }

        $mimeType = mime_content_type($filePath);
        header('Content-Type: ' . $mimeType);
        header('Content-Length: ' . filesize($filePath));
        readfile($filePath);
    }

    private function getRispatThumbnail($filename) {
        $thumbnailPath = $this->thumbnailDir . $filename;
        $originalPath = $this->uploadDir . $filename;
        
        // If thumbnail doesn't exist, create it
        if (!file_exists($thumbnailPath) && file_exists($originalPath)) {
            $this->createThumbnail($originalPath, $filename, 300);
        }

        if (!file_exists($thumbnailPath)) {
            http_response_code(404);
            echo json_encode(['error' => 'Thumbnail not found']);
            return;
        }

        $mimeType = mime_content_type($thumbnailPath);
        header('Content-Type: ' . $mimeType);
        header('Content-Length: ' . filesize($thumbnailPath));
        readfile($thumbnailPath);
    }

    private function deleteRispat($rispatId) {
        $stmt = $this->db->prepare("SELECT file_path FROM rispat WHERE id = ?");
        $stmt->execute([$rispatId]);
        $rispat = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$rispat) {
            $this->sendResponse(['error' => 'Rispat not found'], 404);
            return;
        }

        // Soft delete
        $stmt = $this->db->prepare("UPDATE rispat SET status = 'deleted' WHERE id = ?");
        $stmt->execute([$rispatId]);

        $this->sendResponse(['message' => 'Rispat deleted successfully']);
    }

    private function sendResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        echo json_encode($data);
    }
}

// Initialize and handle request
$api = new RispatAPI();
$api->handleRequest();
?>
