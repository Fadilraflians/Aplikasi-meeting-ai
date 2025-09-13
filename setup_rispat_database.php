<?php
require_once 'config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // SQL untuk membuat tabel rispat
    $sql = "
    CREATE TABLE IF NOT EXISTS rispat (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id INT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        file_size INT NOT NULL,
        uploaded_by VARCHAR(100) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    )";
    
    $db->exec($sql);
    echo "✅ Tabel rispat berhasil dibuat!\n";
    
    // SQL untuk membuat index (MySQL tidak support IF NOT EXISTS untuk INDEX)
    try {
        $db->exec("CREATE INDEX idx_rispat_booking_id ON rispat(booking_id)");
        echo "✅ Index idx_rispat_booking_id berhasil dibuat!\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate key name') !== false) {
            echo "✅ Index idx_rispat_booking_id sudah ada!\n";
        } else {
            echo "⚠️ Index idx_rispat_booking_id: " . $e->getMessage() . "\n";
        }
    }
    
    try {
        $db->exec("CREATE INDEX idx_rispat_uploaded_at ON rispat(uploaded_at)");
        echo "✅ Index idx_rispat_uploaded_at berhasil dibuat!\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate key name') !== false) {
            echo "✅ Index idx_rispat_uploaded_at sudah ada!\n";
        } else {
            echo "⚠️ Index idx_rispat_uploaded_at: " . $e->getMessage() . "\n";
        }
    }
    
    // Buat direktori upload jika belum ada
    $uploadDir = 'uploads/rispat/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
        echo "✅ Direktori upload berhasil dibuat: $uploadDir\n";
    } else {
        echo "✅ Direktori upload sudah ada: $uploadDir\n";
    }
    
    echo "\n🎉 Setup database rispat selesai!\n";
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
