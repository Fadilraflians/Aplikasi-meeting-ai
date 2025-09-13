<?php
require_once 'config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) {
        throw new Exception("Database connection failed");
    }
    
    echo "<h2>🧹 Cleaning Duplicate Bookings</h2>";
    
    // Clean AI bookings duplicates
    echo "<h3>1. Cleaning AI Bookings Duplicates:</h3>";
    
    // Find duplicates
    $stmt = $conn->query("
        SELECT room_name, topic, meeting_date, meeting_time, participants, MIN(id) as keep_id, COUNT(*) as count 
        FROM ai_bookings_success 
        GROUP BY room_name, topic, meeting_date, meeting_time, participants 
        HAVING COUNT(*) > 1
    ");
    $duplicates = $stmt->fetchAll();
    
    if (count($duplicates) > 0) {
        echo "<p>Found " . count($duplicates) . " duplicate groups:</p>";
        
        foreach ($duplicates as $dup) {
            echo "<p>Cleaning duplicates for: {$dup['room_name']} - {$dup['topic']} ({$dup['meeting_date']} {$dup['meeting_time']}) - {$dup['count']} duplicates</p>";
            
            // Keep the oldest one (MIN id), delete the rest
            $stmt = $conn->prepare("
                DELETE FROM ai_bookings_success 
                WHERE room_name = ? AND topic = ? AND meeting_date = ? AND meeting_time = ? AND participants = ? 
                AND id > ?
            ");
            $stmt->execute([
                $dup['room_name'], 
                $dup['topic'], 
                $dup['meeting_date'], 
                $dup['meeting_time'], 
                $dup['participants'], 
                $dup['keep_id']
            ]);
            
            $deleted = $stmt->rowCount();
            echo "<p style='color: green;'>✅ Deleted $deleted duplicate(s), kept ID {$dup['keep_id']}</p>";
        }
    } else {
        echo "<p style='color: green;'>✅ No duplicates found in AI bookings.</p>";
    }
    
    // Clean reservations duplicates
    echo "<h3>2. Cleaning Reservations Duplicates:</h3>";
    
    $stmt = $conn->query("
        SELECT title, start_time, end_time, attendees, MIN(id) as keep_id, COUNT(*) as count 
        FROM reservations 
        GROUP BY title, start_time, end_time, attendees 
        HAVING COUNT(*) > 1
    ");
    $dupReservations = $stmt->fetchAll();
    
    if (count($dupReservations) > 0) {
        echo "<p>Found " . count($dupReservations) . " duplicate groups:</p>";
        
        foreach ($dupReservations as $dup) {
            echo "<p>Cleaning duplicates for: {$dup['title']} ({$dup['start_time']} - {$dup['end_time']}) - {$dup['count']} duplicates</p>";
            
            $stmt = $conn->prepare("
                DELETE FROM reservations 
                WHERE title = ? AND start_time = ? AND end_time = ? AND attendees = ? 
                AND id > ?
            ");
            $stmt->execute([
                $dup['title'], 
                $dup['start_time'], 
                $dup['end_time'], 
                $dup['attendees'], 
                $dup['keep_id']
            ]);
            
            $deleted = $stmt->rowCount();
            echo "<p style='color: green;'>✅ Deleted $deleted duplicate(s), kept ID {$dup['keep_id']}</p>";
        }
    } else {
        echo "<p style='color: green;'>✅ No duplicates found in reservations.</p>";
    }
    
    // Show final counts
    echo "<h3>3. Final Counts:</h3>";
    
    $stmt = $conn->query("SELECT COUNT(*) as count FROM ai_bookings_success");
    $result = $stmt->fetch();
    echo "<p>AI Bookings: " . $result['count'] . "</p>";
    
    $stmt = $conn->query("SELECT COUNT(*) as count FROM reservations");
    $result = $stmt->fetch();
    echo "<p>Reservations: " . $result['count'] . "</p>";
    
    echo "<h3>4. Next Steps:</h3>";
    echo "<p>1. <a href='check_duplicates.php'>Check for remaining duplicates</a></p>";
    echo "<p>2. <a href='index.html'>Go to main application</a></p>";
    echo "<p>3. Check if duplicates are gone in Reservations page</p>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}
?>




