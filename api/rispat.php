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
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

// Create upload directory
$uploadDir = 'uploads/rispat/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

try {
    switch ($method) {
        case 'GET':
            if (isset($pathParts[2]) && $pathParts[2] === 'booking') {
                getRispatByBookingId($pdo, $pathParts[3]);
            } else {
                getAllRispat($pdo);
            }
            break;
        case 'POST':
            if (isset($pathParts[2]) && $pathParts[2] === 'upload') {
                uploadRispat($pdo, $uploadDir);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid endpoint']);
            }
            break;
        case 'DELETE':
            deleteRispat($pdo, $pathParts[2]);
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

function getRispatByBookingId($pdo, $bookingId) {
    $stmt = $pdo->prepare("
        SELECT 
            id, booking_id, source_image, uploaded_at, status
        FROM rispat
        WHERE booking_id = ? AND status = 'active'
        ORDER BY uploaded_at DESC
    ");
    $stmt->execute([$bookingId]);
    $rispat = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['rispat' => $rispat]);
}

function getAllRispat($pdo) {
    $stmt = $pdo->prepare("
        SELECT 
            id, booking_id, source_image, uploaded_at, status
        FROM rispat
        WHERE status = 'active'
        ORDER BY uploaded_at DESC
    ");
    $stmt->execute();
    $rispat = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['rispat' => $rispat]);
}

function uploadRispat($pdo, $uploadDir) {
    if (!isset($_FILES['file']) || !isset($_POST['booking_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'File and booking_id are required']);
        return;
    }

    $file = $_FILES['file'];
    $bookingId = $_POST['booking_id'];
    $uploadedBy = $_POST['uploaded_by'] ?? 'user';

    // Validate file
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!in_array($file['type'], $allowedTypes)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid file type. Only images are allowed.']);
        return;
    }

    $maxSize = 10 * 1024 * 1024; // 10MB
    if ($file['size'] > $maxSize) {
        http_response_code(400);
        echo json_encode(['error' => 'File too large. Maximum size is 10MB.']);
        return;
    }

    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'rispat_' . uniqid() . '.' . $extension;
    $filePath = $uploadDir . $filename;

    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $filePath)) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to upload file']);
        return;
    }

    // Get image metadata
    $imageInfo = getimagesize($filePath);
    $imageWidth = $imageInfo[0] ?? null;
    $imageHeight = $imageInfo[1] ?? null;

    // Create thumbnail
    createThumbnail($filePath, $filename, 300);

    // Save to database
    $stmt = $pdo->prepare("
        INSERT INTO rispat (booking_id, source_image)
        VALUES (?, ?)
    ");
    $stmt->execute([
        $bookingId,
        '/uploads/rispat/' . $filename
    ]);

    $rispatId = $pdo->lastInsertId();

    // Get the created rispat
    $stmt = $pdo->prepare("
        SELECT 
            id, booking_id, source_image, uploaded_at, status
        FROM rispat
        WHERE id = ?
    ");
    $stmt->execute([$rispatId]);
    $rispat = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode(['rispat' => $rispat, 'message' => 'File uploaded successfully']);
}

function deleteRispat($pdo, $rispatId) {
    $stmt = $pdo->prepare("UPDATE rispat SET status = 'deleted' WHERE id = ?");
    $stmt->execute([$rispatId]);
    
    echo json_encode(['message' => 'Rispat deleted successfully']);
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
