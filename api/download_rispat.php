<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';
require_once '../backend/models/Rispat.php';

// Ambil ID file dari parameter
$fileId = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($fileId <= 0) {
    http_response_code(400);
    echo "File ID tidak valid";
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();
    $rispat = new Rispat($db);
    
    // Ambil informasi file
    $fileInfo = $rispat->getRispatById($fileId);
    
    if (!$fileInfo) {
        http_response_code(404);
        echo "File tidak ditemukan";
        exit;
    }
    
    $filePath = $fileInfo['file_path'];
    $fileName = $fileInfo['original_filename'];
    
    // Debug logging
    error_log("Download request - File ID: $fileId, File Path: $filePath, Original Name: $fileName");
    
    // Cek apakah file ada
    if (!file_exists($filePath)) {
        error_log("File not found at path: $filePath");
        http_response_code(404);
        echo "File tidak ditemukan di server";
        exit;
    }
    
    // Tentukan Content-Type berdasarkan ekstensi file
    $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    $contentType = 'application/octet-stream'; // default
    
    switch ($fileExtension) {
        case 'pdf':
            $contentType = 'application/pdf';
            break;
        case 'doc':
            $contentType = 'application/msword';
            break;
        case 'docx':
            $contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            break;
        case 'jpg':
        case 'jpeg':
            $contentType = 'image/jpeg';
            break;
        case 'png':
            $contentType = 'image/png';
            break;
        case 'gif':
            $contentType = 'image/gif';
            break;
        case 'webp':
            $contentType = 'image/webp';
            break;
        default:
            $contentType = 'application/octet-stream';
            break;
    }
    
    // Escape nama file untuk header
    $safeFileName = preg_replace('/[^\x20-\x7E]/', '', $fileName); // Remove non-ASCII characters
    $safeFileName = str_replace(['"', "'", '\\', '/'], '_', $safeFileName); // Replace problematic characters
    
    // Set header untuk download dengan nama file asli
    header('Content-Type: ' . $contentType);
    header('Content-Disposition: attachment; filename="' . $safeFileName . '"');
    header('Content-Length: ' . filesize($filePath));
    header('Cache-Control: no-cache, must-revalidate');
    header('Pragma: no-cache');
    
    // Log final headers
    error_log("Download headers - Content-Type: $contentType, Filename: $safeFileName");
    
    // Output file
    readfile($filePath);
    
} catch (Exception $e) {
    http_response_code(500);
    echo "Error: " . $e->getMessage();
}
?>


