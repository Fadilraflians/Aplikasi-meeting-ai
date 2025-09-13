<?php
class Rispat {
    private $conn;
    private $table_name = "rispat";

    public function __construct($db) {
        $this->conn = $db;
    }

    // Upload file risalah rapat
    public function uploadRispat($bookingId, $fileData, $uploadedBy) {
        try {
            $query = "INSERT INTO " . $this->table_name . " 
                     (booking_id, file_name, original_name, file_path, file_type, file_size, uploaded_by) 
                     VALUES (:booking_id, :file_name, :original_name, :file_path, :file_type, :file_size, :uploaded_by)";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(":booking_id", $bookingId);
            $stmt->bindValue(":file_name", $fileData['file_name']);
            $stmt->bindValue(":original_name", $fileData['original_name']);
            $stmt->bindValue(":file_path", $fileData['file_path']);
            $stmt->bindValue(":file_type", $fileData['file_type']);
            $stmt->bindValue(":file_size", $fileData['file_size']);
            $stmt->bindValue(":uploaded_by", $uploadedBy);
            
            if ($stmt->execute()) {
                return array(
                    "success" => true,
                    "message" => "Risalah rapat berhasil diupload",
                    "id" => $this->conn->lastInsertId()
                );
            } else {
                return array(
                    "success" => false,
                    "message" => "Gagal mengupload risalah rapat"
                );
            }
        } catch (PDOException $e) {
            return array(
                "success" => false,
                "message" => "Error: " . $e->getMessage()
            );
        }
    }

    // Ambil semua risalah rapat berdasarkan booking_id
    public function getRispatByBookingId($bookingId) {
        try {
            $query = "SELECT * FROM " . $this->table_name . " 
                     WHERE booking_id = :booking_id 
                     ORDER BY uploaded_at DESC";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(":booking_id", $bookingId);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return array();
        }
    }

    // Ambil detail risalah rapat berdasarkan ID
    public function getRispatById($id) {
        try {
            $query = "SELECT * FROM " . $this->table_name . " WHERE id = :id";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(":id", $id);
            $stmt->execute();
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return null;
        }
    }

    // Hapus risalah rapat
    public function deleteRispat($id) {
        try {
            // Ambil file path dulu
            $rispat = $this->getRispatById($id);
            if (!$rispat) {
                return array(
                    "success" => false,
                    "message" => "Risalah rapat tidak ditemukan"
                );
            }

            // Hapus file dari storage
            if (file_exists($rispat['file_path'])) {
                unlink($rispat['file_path']);
            }

            // Hapus dari database
            $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(":id", $id);
            
            if ($stmt->execute()) {
                return array(
                    "success" => true,
                    "message" => "Risalah rapat berhasil dihapus"
                );
            } else {
                return array(
                    "success" => false,
                    "message" => "Gagal menghapus risalah rapat"
                );
            }
        } catch (PDOException $e) {
            return array(
                "success" => false,
                "message" => "Error: " . $e->getMessage()
            );
        }
    }

    // Format file size
    public function formatFileSize($bytes) {
        $units = array('B', 'KB', 'MB', 'GB');
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        return round($bytes, 2) . ' ' . $units[$pow];
    }

    // Get file icon based on type
    public function getFileIcon($fileType) {
        $type = strtolower($fileType);
        if (strpos($type, 'pdf') !== false) return '📄';
        if (strpos($type, 'word') !== false || strpos($type, 'document') !== false) return '📝';
        if (strpos($type, 'image') !== false || strpos($type, 'jpg') !== false || strpos($type, 'jpeg') !== false || strpos($type, 'png') !== false) return '🖼️';
        return '📎';
    }
}
?>

