<?php
/**
 * Cleanup script untuk menghapus file-file yang tidak perlu
 * Jalankan script ini sebelum commit ke GitHub
 */

echo "🧹 Starting cleanup process...\n\n";

// File dan direktori yang akan dihapus
$filesToRemove = [
    // Debug dan test files
    'debug_database.php',
    'debug_date_parsing.php',
    'check_database.php',
    'check_duplicates.php',
    'check_table_structure.php',
    'clean_duplicates.php',
    'create_bookings_table.php',
    'setup_rispat_database.php',
    'setup_sample_data.php',
    'setup_rispat_database.bat',
    
    // Test files
    'test-gemini-api.js',
    'test-gemini-connection.js',
    'test-gemini-integration.js',
    'test_simple.js',
    'test-simple.js',
    'src/test-backend.js',
    
    // Status files
    'tatus',
    
    // Temporary files
    'cleanup.php', // Script ini sendiri
    
    // Backup files
    '*.bak',
    '*.backup',
    '*.old',
    '*.tmp',
    '*.temp',
];

// Direktori yang akan dibersihkan (hapus isinya tapi pertahankan struktur)
$dirsToClean = [
    'uploads/rispat',
    'api/uploads/rispat',
    'node_modules',
    'vendor',
    'dist',
];

$removedCount = 0;
$cleanedDirs = 0;

// Hapus file-file yang tidak perlu
foreach ($filesToRemove as $pattern) {
    if (strpos($pattern, '*') !== false) {
        // Handle wildcard patterns
        $files = glob($pattern);
        foreach ($files as $file) {
            if (file_exists($file)) {
                unlink($file);
                echo "✅ Removed: $file\n";
                $removedCount++;
            }
        }
    } else {
        // Handle specific files
        if (file_exists($pattern)) {
            unlink($pattern);
            echo "✅ Removed: $pattern\n";
            $removedCount++;
        }
    }
}

// Bersihkan direktori
foreach ($dirsToClean as $dir) {
    if (is_dir($dir)) {
        $files = glob($dir . '/*');
        foreach ($files as $file) {
            if (is_file($file)) {
                unlink($file);
            } elseif (is_dir($file)) {
                removeDirectory($file);
            }
        }
        echo "🧹 Cleaned directory: $dir\n";
        $cleanedDirs++;
    }
}

// Buat .gitkeep files untuk direktori penting
$gitkeepDirs = [
    'uploads/rispat',
    'api/uploads/rispat',
];

foreach ($gitkeepDirs as $dir) {
    if (is_dir($dir)) {
        $gitkeepFile = $dir . '/.gitkeep';
        if (!file_exists($gitkeepFile)) {
            file_put_contents($gitkeepFile, "# This file ensures the directory is tracked by git\n# The directory structure is important for the application\n");
            echo "📁 Created .gitkeep: $gitkeepFile\n";
        }
    }
}

echo "\n🎉 Cleanup completed!\n";
echo "📊 Summary:\n";
echo "   - Files removed: $removedCount\n";
echo "   - Directories cleaned: $cleanedDirs\n";
echo "\n💡 Next steps:\n";
echo "   1. Review the changes\n";
echo "   2. Test your application\n";
echo "   3. Commit to git\n";
echo "   4. Push to GitHub\n";

function removeDirectory($dir) {
    if (is_dir($dir)) {
        $files = array_diff(scandir($dir), array('.', '..'));
        foreach ($files as $file) {
            $path = $dir . '/' . $file;
            if (is_dir($path)) {
                removeDirectory($path);
            } else {
                unlink($path);
            }
        }
        rmdir($dir);
    }
}
?>
