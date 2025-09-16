<?php
// Script untuk memperbaiki error upload rispat
echo "Memperbaiki error upload rispat...\n";

// 1. Backup file lama
if (file_exists('backend/api/rispat.php')) {
    copy('backend/api/rispat.php', 'backend/api/rispat_backup.php');
    echo "✅ File lama di-backup\n";
}

// 2. Ganti dengan file yang sudah diperbaiki
if (file_exists('backend/api/rispat_simple.php')) {
    copy('backend/api/rispat_simple.php', 'backend/api/rispat.php');
    echo "✅ File baru diterapkan\n";
}

// 3. Hapus file temporary
if (file_exists('backend/api/rispat_simple.php')) {
    unlink('backend/api/rispat_simple.php');
    echo "✅ File temporary dihapus\n";
}

echo "Perbaikan selesai! Silakan coba upload file lagi.\n";
?>
