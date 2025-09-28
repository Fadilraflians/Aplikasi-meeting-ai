<?php
/**
 * API RISPAT Sederhana
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database configuration
$host = 'localhost';
$dbname = 'spacio_meeting_db';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

// Create upload directory
$uploadDir = 'uploads/rispat/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // GET /api/rispat-simple.php?booking_id=1
            if (isset($_GET['booking_id'])) {
                getRispatByBookingId($pdo, $_GET['booking_id']);
            } else {
                getAllRispat($pdo);
            }
            break;
            
        case 'POST':
            // POST /api/rispat-simple.php
            uploadRispat($pdo, $uploadDir);
            break;
            
        case 'DELETE':
            // DELETE /api/rispat-simple.php?id=1
            if (isset($_GET['id'])) {
                deleteRispat($pdo, $_GET['id']);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'ID required for DELETE']);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

function getRispatByBookingId($pdo, $bookingId) {
    try {
        $stmt = $pdo->prepare("
            SELECT id, booking_id, source_image, uploaded_at, status
            FROM rispat
            WHERE booking_id = ? AND status = 'active'
            ORDER BY uploaded_at DESC
        ");
        $stmt->execute([$bookingId]);
        $rispat = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'rispat' => $rispat]);
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function getAllRispat($pdo) {
    try {
        $stmt = $pdo->prepare("
            SELECT id, booking_id, source_image, uploaded_at, status
            FROM rispat
            WHERE status = 'active'
            ORDER BY uploaded_at DESC
        ");
        $stmt->execute();
        $rispat = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'rispat' => $rispat]);
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function uploadRispat($pdo, $uploadDir) {
    try {
        // Debug log
        error_log("Upload request received");
        error_log("FILES: " . print_r($_FILES, true));
        error_log("POST: " . print_r($_POST, true));
        
        if (!isset($_FILES['file'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No file uploaded']);
            return;
        }
        
        if (!isset($_POST['booking_id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'booking_id is required']);
            return;
        }

        $file = $_FILES['file'];
        $bookingId = $_POST['booking_id'];

        // Validate file type - check both MIME type and actual file content
        $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        
        // Check MIME type
        $mimeType = $file['type'];
        $actualMimeType = mime_content_type($file['tmp_name']);
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        
        $isValidType = in_array($mimeType, $allowedTypes) || 
                      in_array($actualMimeType, $allowedTypes) || 
                      in_array($extension, $allowedExtensions);
        
        if (!$isValidType) {
            error_log("File type validation failed:");
            error_log("MIME type: " . $mimeType);
            error_log("Actual MIME type: " . $actualMimeType);
            error_log("Extension: " . $extension);
            error_log("File name: " . $file['name']);
            
            http_response_code(400);
            echo json_encode([
                'success' => false, 
                'error' => 'Invalid file type. Detected: ' . $mimeType . ' / ' . $actualMimeType . '. Only JPG, PNG, GIF, and WebP images are allowed.',
                'debug' => [
                    'file_name' => $file['name'],
                    'mime_type' => $mimeType,
                    'actual_mime_type' => $actualMimeType,
                    'extension' => $extension,
                    'allowed_types' => $allowedTypes
                ]
            ]);
            return;
        }

        $maxSize = 10 * 1024 * 1024; // 10MB
        if ($file['size'] > $maxSize) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'File too large. Maximum size is 10MB.']);
            return;
        }

        // Generate unique filename
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'rispat_' . uniqid() . '.' . $extension;
        $filePath = $uploadDir . $filename;

        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            error_log("Failed to move uploaded file from " . $file['tmp_name'] . " to " . $filePath);
            error_log("Upload error: " . $file['error']);
            error_log("File size: " . $file['size']);
            error_log("Is uploaded file: " . (is_uploaded_file($file['tmp_name']) ? 'YES' : 'NO'));
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to upload file. Check server logs for details.']);
            return;
        }

        // Create thumbnail
        createThumbnail($filePath, $filename, 300);

        // Save to database
        $stmt = $pdo->prepare("
            INSERT INTO rispat (booking_id, source_image)
            VALUES (?, ?)
        ");
        
        $result = $stmt->execute([
            $bookingId,
            '/uploads/rispat/' . $filename
        ]);
        
        if (!$result) {
            error_log("Database insert failed");
            error_log("PDO error info: " . print_r($stmt->errorInfo(), true));
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to save to database']);
            return;
        }

        $rispatId = $pdo->lastInsertId();

        // Get the created rispat
        $stmt = $pdo->prepare("
            SELECT id, booking_id, source_image, uploaded_at, status
            FROM rispat
            WHERE id = ?
        ");
        $stmt->execute([$rispatId]);
        $rispat = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'rispat' => $rispat, 'message' => 'File uploaded successfully']);
        
    } catch(Exception $e) {
        error_log("Upload error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function deleteRispat($pdo, $rispatId) {
    try {
        $stmt = $pdo->prepare("UPDATE rispat SET status = 'deleted' WHERE id = ?");
        $stmt->execute([$rispatId]);
        
        echo json_encode(['success' => true, 'message' => 'Rispat deleted successfully']);
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function createThumbnail($sourcePath, $filename, $maxSize) {
    $thumbnailDir = 'uploads/rispat/thumbnails/';
    if (!file_exists($thumbnailDir)) {
        mkdir($thumbnailDir, 0755, true);
    }
    
    $thumbnailPath = $thumbnailDir . 'thumb_' . $filename;
    
    // Get image info
    $imageInfo = getimagesize($sourcePath);
    if (!$imageInfo) {
        return false;
    }
    
    $width = $imageInfo[0];
    $height = $imageInfo[1];
    $mimeType = $imageInfo['mime'];
    
    // Calculate thumbnail dimensions
    if ($width > $height) {
        $newWidth = $maxSize;
        $newHeight = ($height * $maxSize) / $width;
    } else {
        $newHeight = $maxSize;
        $newWidth = ($width * $maxSize) / $height;
    }
    
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
    
    if (!$sourceImage) {
        return false;
    }
    
    // Create thumbnail
    $thumbnail = imagecreatetruecolor($newWidth, $newHeight);
    
    // Preserve transparency for PNG and GIF
    if ($mimeType === 'image/png' || $mimeType === 'image/gif') {
        imagealphablending($thumbnail, false);
        imagesavealpha($thumbnail, true);
        $transparent = imagecolorallocatealpha($thumbnail, 255, 255, 255, 127);
        imagefilledrectangle($thumbnail, 0, 0, $newWidth, $newHeight, $transparent);
    }
    
    // Resize image
    imagecopyresampled($thumbnail, $sourceImage, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
    
    // Save thumbnail
    $result = false;
    switch ($mimeType) {
        case 'image/jpeg':
            $result = imagejpeg($thumbnail, $thumbnailPath, 85);
            break;
        case 'image/png':
            $result = imagepng($thumbnail, $thumbnailPath, 8);
            break;
        case 'image/gif':
            $result = imagegif($thumbnail, $thumbnailPath);
            break;
        case 'image/webp':
            $result = imagewebp($thumbnail, $thumbnailPath, 85);
            break;
    }
    
    // Clean up
    imagedestroy($sourceImage);
    imagedestroy($thumbnail);
    
    return $result;
}
?>
