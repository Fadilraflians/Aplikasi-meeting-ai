<?php
// Disable error reporting untuk mencegah warning muncul di response JSON
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';
require_once '../backend/models/Rispat.php';

$database = new Database();
$db = $database->getConnection();
$rispat = new Rispat($db);

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        if (isset($_GET['booking_id'])) {
            $bookingId = intval($_GET['booking_id']);
            if ($bookingId <= 0) {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Booking ID tidak valid"
                ));
                exit;
            }
            $rispatList = $rispat->getRispatByBookingId($bookingId);
            echo json_encode(array(
                "success" => true,
                "data" => $rispatList
            ));
        } else {
            echo json_encode(array(
                "success" => false,
                "message" => "Booking ID diperlukan"
            ));
        }
        break;

    case 'POST':
        if (isset($_FILES['file']) && isset($_POST['booking_id']) && isset($_POST['uploaded_by'])) {
            $bookingId = intval($_POST['booking_id']);
            if ($bookingId <= 0) {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Booking ID tidak valid"
                ));
                exit;
            }
            $uploadedBy = $_POST['uploaded_by'];
            $file = $_FILES['file'];

            // Validasi file
            $allowedTypes = array('pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png');
            $fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            
            if (!in_array($fileExtension, $allowedTypes)) {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Tipe file tidak didukung. Hanya PDF, Word, dan JPG yang diperbolehkan."
                ));
                exit;
            }

            // Validasi ukuran file (max 10MB)
            if ($file['size'] > 10 * 1024 * 1024) {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Ukuran file terlalu besar. Maksimal 10MB."
                ));
                exit;
            }

            // Buat direktori upload jika belum ada
            $uploadDir = 'uploads/rispat/';
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            // Generate nama file unik
            $fileName = uniqid() . '_' . time() . '.' . $fileExtension;
            $filePath = $uploadDir . $fileName;

            // Upload file
            if (move_uploaded_file($file['tmp_name'], $filePath)) {
                // Determine file type based on extension
                $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
                $fileType = 'document'; // Default
                if (in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
                    $fileType = 'image';
                } elseif (in_array($extension, ['pdf'])) {
                    $fileType = 'pdf';
                } elseif (in_array($extension, ['doc', 'docx'])) {
                    $fileType = 'word';
                }
                
                // Truncate MIME type if too long (max 100 chars for database)
                $mimeType = $file['type'];
                if (strlen($mimeType) > 100) {
                    $mimeType = substr($mimeType, 0, 100);
                }
                
                $fileData = array(
                    'filename' => $fileName,
                    'original_filename' => $file['name'],
                    'file_path' => $filePath,
                    'file_type' => $fileType,
                    'mime_type' => $mimeType,
                    'file_size' => $file['size']
                );

                $result = $rispat->uploadRispat($bookingId, $fileData, $uploadedBy);
                echo json_encode($result);
            } else {
                echo json_encode(array(
                    "success" => false,
                    "message" => "Gagal mengupload file"
                ));
            }
        } else {
            echo json_encode(array(
                "success" => false,
                "message" => "Data tidak lengkap"
            ));
        }
        break;

    case 'DELETE':
        if (isset($_GET['id'])) {
            $id = $_GET['id'];
            $result = $rispat->deleteRispat($id);
            echo json_encode($result);
        } else {
            echo json_encode(array(
                "success" => false,
                "message" => "ID diperlukan"
            ));
        }
        break;

    default:
        echo json_encode(array(
            "success" => false,
            "message" => "Method tidak didukung"
        ));
        break;
}
?>