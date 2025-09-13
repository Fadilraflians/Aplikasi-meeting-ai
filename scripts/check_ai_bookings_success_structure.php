<?php
require_once 'backend/config/database.php';

echo "=== CHECKING AI_BOOKINGS_SUCCESS TABLE STRUCTURE ===\n\n";

try {
    $db = new PDO("mysql:host=localhost;dbname=spacio_meeting_db", "root", "");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $stmt = $db->query("DESCRIBE ai_bookings_success");
    
    echo "📋 TABLE: ai_bookings_success\n";
    echo "--------------------------------------------------\n";
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "  {$row['Field']}: {$row['Type']}";
        if ($row['Key'] === 'PRI') echo " [PRI]";
        if ($row['Null'] === 'NO') echo " (NOT NULL)";
        if ($row['Null'] === 'YES') echo " (NULL)";
        echo "\n";
    }
    
} catch (PDOException $e) {
    echo "❌ Database Error: " . $e->getMessage() . "\n";
}

echo "\n=== END CHECK ===\n";
?>









