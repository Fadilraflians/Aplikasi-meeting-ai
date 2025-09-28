<?php
/**
 * Upload Room Image API
 * Handles file upload for room images
 */

header('Content-Type: application/json');
// CORS: allow only localhost:5173 and aplikasi-meeting-ai.test
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (!empty($origin)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    // Fallback when accessed directly (CLI or same-origin)
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    // Check if file was uploaded
    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('No file uploaded or upload error');
    }

    $file = $_FILES['image'];
    
    // Validate file type
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    $fileType = mime_content_type($file['tmp_name']);
    
    if (!in_array($fileType, $allowedTypes)) {
        throw new Exception('Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP.');
    }

    // Validate file size (max 5MB)
    if ($file['size'] > 5 * 1024 * 1024) {
        throw new Exception('Ukuran file terlalu besar. Maksimal 5MB.');
    }

    // Create upload directory if it doesn't exist
    $uploadDir = __DIR__ . '/../public/images/meeting-rooms/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // Generate unique filename
    $fileExtension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $fileName = 'room_' . time() . '_' . uniqid() . '.' . $fileExtension;
    $filePath = $uploadDir . $fileName;

    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $filePath)) {
        throw new Exception('Gagal menyimpan file');
    }

    // Generate URL path
    $imageUrl = '/images/meeting-rooms/' . $fileName;

    // Log successful upload
    error_log("Room image uploaded successfully: $imageUrl");

    echo json_encode([
        'success' => true,
        'message' => 'Gambar berhasil diupload',
        'imageUrl' => $imageUrl,
        'fileName' => $fileName
    ]);

} catch (Exception $e) {
    error_log("Upload error: " . $e->getMessage());
    
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
