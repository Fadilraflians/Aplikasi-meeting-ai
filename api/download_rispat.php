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
    $fileName = $fileInfo['original_name'];
    
    // Cek apakah file ada
    if (!file_exists($filePath)) {
        http_response_code(404);
        echo "File tidak ditemukan di server";
        exit;
    }
    
    // Set header untuk download
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . basename($fileName) . '"');
    header('Content-Length: ' . filesize($filePath));
    header('Cache-Control: no-cache, must-revalidate');
    header('Pragma: no-cache');
    
    // Output file
    readfile($filePath);
    
} catch (Exception $e) {
    http_response_code(500);
    echo "Error: " . $e->getMessage();
}
?>


