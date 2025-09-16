<?php
// Script untuk memperbaiki kolom file_type di tabel rispat
require_once 'config/database.php';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "🔧 Memperbaiki struktur tabel rispat...\n";
    
    // 1. Ubah kolom file_type menjadi lebih panjang
    $sql1 = "ALTER TABLE rispat MODIFY COLUMN file_type VARCHAR(255) NOT NULL";
    $pdo->exec($sql1);
    echo "✅ Kolom file_type diperpanjang menjadi VARCHAR(255)\n";
    
    // 2. Ubah kolom mime_type menjadi lebih panjang
    $sql2 = "ALTER TABLE rispat MODIFY COLUMN mime_type VARCHAR(255) NOT NULL";
    $pdo->exec($sql2);
    echo "✅ Kolom mime_type diperpanjang menjadi VARCHAR(255)\n";
    
    // 3. Tambahkan kolom filename jika belum ada
    $checkColumn = $pdo->query("SHOW COLUMNS FROM rispat LIKE 'filename'");
    if ($checkColumn->rowCount() == 0) {
        $sql3 = "ALTER TABLE rispat ADD COLUMN filename VARCHAR(255) NOT NULL AFTER booking_id";
        $pdo->exec($sql3);
        echo "✅ Kolom filename ditambahkan\n";
    } else {
        echo "ℹ️ Kolom filename sudah ada\n";
    }
    
    // 4. Tambahkan kolom original_filename jika belum ada
    $checkColumn2 = $pdo->query("SHOW COLUMNS FROM rispat LIKE 'original_filename'");
    if ($checkColumn2->rowCount() == 0) {
        $sql4 = "ALTER TABLE rispat ADD COLUMN original_filename VARCHAR(255) NOT NULL AFTER filename";
        $pdo->exec($sql4);
        echo "✅ Kolom original_filename ditambahkan\n";
    } else {
        echo "ℹ️ Kolom original_filename sudah ada\n";
    }
    
    // 5. Hapus kolom lama jika ada
    $checkOldColumn1 = $pdo->query("SHOW COLUMNS FROM rispat LIKE 'file_name'");
    if ($checkOldColumn1->rowCount() > 0) {
        $sql5 = "ALTER TABLE rispat DROP COLUMN file_name";
        $pdo->exec($sql5);
        echo "✅ Kolom file_name lama dihapus\n";
    }
    
    $checkOldColumn2 = $pdo->query("SHOW COLUMNS FROM rispat LIKE 'original_name'");
    if ($checkOldColumn2->rowCount() > 0) {
        $sql6 = "ALTER TABLE rispat DROP COLUMN original_name";
        $pdo->exec($sql6);
        echo "✅ Kolom original_name lama dihapus\n";
    }
    
    // 6. Tampilkan struktur tabel yang sudah diperbaiki
    echo "\n📊 Struktur tabel rispat setelah diperbaiki:\n";
    $result = $pdo->query("DESCRIBE rispat");
    while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
        echo "- {$row['Field']}: {$row['Type']} {$row['Null']} {$row['Key']}\n";
    }
    
    echo "\n✅ Struktur tabel rispat berhasil diperbaiki!\n";
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
