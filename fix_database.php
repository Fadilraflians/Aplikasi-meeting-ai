<?php
// Script sederhana untuk memperbaiki database
$host = 'localhost';
$dbname = 'aplikasi_meeting_ai';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Memperbaiki tabel rispat...\n";
    
    // Perpanjang kolom file_type
    $pdo->exec("ALTER TABLE rispat MODIFY COLUMN file_type VARCHAR(255) NOT NULL");
    echo "✅ file_type diperpanjang\n";
    
    // Perpanjang kolom mime_type
    $pdo->exec("ALTER TABLE rispat MODIFY COLUMN mime_type VARCHAR(255) NOT NULL");
    echo "✅ mime_type diperpanjang\n";
    
    echo "Database berhasil diperbaiki!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
