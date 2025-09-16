<?php
// Script untuk mengganti file rispat.php
echo "Mengganti file rispat.php...\n";

// Backup file lama
if (file_exists('backend/api/rispat.php')) {
    copy('backend/api/rispat.php', 'backend/api/rispat_backup.php');
    echo "✅ File lama di-backup ke rispat_backup.php\n";
}

// Ganti dengan file yang sudah diperbaiki
if (file_exists('backend/api/rispat_fixed.php')) {
    copy('backend/api/rispat_fixed.php', 'backend/api/rispat.php');
    echo "✅ File baru diterapkan\n";
    
    // Hapus file temporary
    unlink('backend/api/rispat_fixed.php');
    echo "✅ File temporary dihapus\n";
} else {
    echo "❌ File rispat_fixed.php tidak ditemukan\n";
}

echo "Selesai! Silakan coba upload file lagi.\n";
?>
