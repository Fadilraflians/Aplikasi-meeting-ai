<?php
// Simple fixed rispat API
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // Upload file
    if (!isset($_FILES['file']) || !isset($_POST['booking_id']) || !isset($_POST['uploaded_by'])) {
        echo json_encode(['error' => 'Missing required fields']);
        exit();
    }

    $file = $_FILES['file'];
    $bookingId = (int)$_POST['booking_id'];
    $uploadedBy = $_POST['uploaded_by'];

    // Validate file extension
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx'];
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    
    if (!in_array($extension, $allowedExtensions)) {
        echo json_encode(['error' => 'File type not allowed. Supported: JPG, PNG, GIF, WEBP, PDF, DOC, DOCX']);
        exit();
    }

    $maxSize = 10 * 1024 * 1024; // 10MB
    if ($file['size'] > $maxSize) {
        echo json_encode(['error' => 'File too large. Maximum size is 10MB.']);
        exit();
    }

    // Generate unique filename
    $filename = 'rispat_' . uniqid() . '.' . $extension;
    $uploadDir = '../uploads/rispat/';
    
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    
    $filePath = $uploadDir . $filename;

    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $filePath)) {
        echo json_encode(['error' => 'Failed to upload file']);
        exit();
    }

    // Determine file type
    $fileType = 'document';
    if (in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
        $fileType = 'image';
    } elseif ($extension === 'pdf') {
        $fileType = 'pdf';
    } elseif (in_array($extension, ['doc', 'docx'])) {
        $fileType = 'word';
    }

    // Truncate MIME type if too long
    $mimeType = $file['type'];
    if (strlen($mimeType) > 100) {
        $mimeType = substr($mimeType, 0, 100);
    }

    try {
        // Try to insert with new column names first
        $stmt = $pdo->prepare("
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
    } catch (PDOException $e) {
        // If new columns don't exist, try with old column names
        if (strpos($e->getMessage(), 'Unknown column') !== false) {
            try {
                $stmt = $pdo->prepare("
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
            } catch (PDOException $e2) {
                // Delete uploaded file if database insert fails
                if (file_exists($filePath)) {
                    unlink($filePath);
                }
                echo json_encode(['error' => 'Database error: ' . $e2->getMessage()]);
                exit();
            }
        } else {
            // Delete uploaded file if database insert fails
            if (file_exists($filePath)) {
                unlink($filePath);
            }
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
            exit();
        }
    }

    $rispatId = $pdo->lastInsertId();

    echo json_encode([
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

} elseif ($method === 'GET') {
    // Get rispat by booking ID
    if (!isset($_GET['booking_id'])) {
        echo json_encode(['error' => 'Booking ID required']);
        exit();
    }

    $bookingId = (int)$_GET['booking_id'];
    
    try {
        // Try new column names first
        $stmt = $pdo->prepare("
            SELECT 
                id, booking_id, filename, original_filename, file_path,
                file_size, file_type, mime_type, uploaded_at, uploaded_by
            FROM rispat
            WHERE booking_id = ? AND status = 'active'
            ORDER BY uploaded_at DESC
        ");
        $stmt->execute([$bookingId]);
        $rispat = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format response
        $formattedRispat = array_map(function($item) {
            return [
                'id' => $item['id'],
                'booking_id' => $item['booking_id'],
                'filename' => $item['filename'],
                'original_filename' => $item['original_filename'],
                'file_path' => $item['file_path'],
                'file_size' => $item['file_size'],
                'file_type' => $item['file_type'],
                'mime_type' => $item['mime_type'],
                'uploaded_at' => $item['uploaded_at'],
                'uploaded_by' => $item['uploaded_by']
            ];
        }, $rispat);
        
        echo json_encode(['rispat' => $formattedRispat]);
        
    } catch (PDOException $e) {
        // If new columns don't exist, try with old column names
        if (strpos($e->getMessage(), 'Unknown column') !== false) {
            try {
                $stmt = $pdo->prepare("
                    SELECT 
                        id, booking_id, file_name, original_name, file_path,
                        file_size, file_type, uploaded_at, uploaded_by
                    FROM rispat
                    WHERE booking_id = ? AND status = 'active'
                    ORDER BY uploaded_at DESC
                ");
                $stmt->execute([$bookingId]);
                $rispat = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Format response with old column names
                $formattedRispat = array_map(function($item) {
                    return [
                        'id' => $item['id'],
                        'booking_id' => $item['booking_id'],
                        'filename' => $item['file_name'],
                        'original_filename' => $item['original_name'],
                        'file_path' => $item['file_path'],
                        'file_size' => $item['file_size'],
                        'file_type' => $item['file_type'],
                        'mime_type' => $item['file_type'], // Use file_type as mime_type fallback
                        'uploaded_at' => $item['uploaded_at'],
                        'uploaded_by' => $item['uploaded_by']
                    ];
                }, $rispat);
                
                echo json_encode(['rispat' => $formattedRispat]);
                
            } catch (PDOException $e2) {
                echo json_encode(['error' => 'Database error: ' . $e2->getMessage()]);
            }
        } else {
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
    }

} elseif ($method === 'DELETE') {
    // Delete rispat
    $pathParts = explode('/', trim($_SERVER['REQUEST_URI'], '/'));
    $rispatId = end($pathParts);
    
    if (!is_numeric($rispatId)) {
        echo json_encode(['error' => 'Invalid rispat ID']);
        exit();
    }
    
    try {
        $stmt = $pdo->prepare("UPDATE rispat SET status = 'deleted' WHERE id = ?");
        $stmt->execute([$rispatId]);
        echo json_encode(['message' => 'Rispat deleted successfully']);
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }

} else {
    echo json_encode(['error' => 'Method not allowed']);
}
?>
