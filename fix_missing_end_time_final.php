<?php
$host = 'localhost';
$dbname = 'spacio_meeting_db';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Fixing missing end_time in ai_booking_data table:\n";
    
    // Get records with NULL or empty end_time
    $stmt = $pdo->query('SELECT id, meeting_time, end_time FROM ai_booking_data WHERE end_time IS NULL OR end_time = ""');
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Found " . count($records) . " records with missing end_time\n";
    
    foreach ($records as $record) {
        $id = $record['id'];
        $meetingTime = $record['meeting_time'];
        
        // Calculate end time (add 1 hour by default)
        $time = new DateTime($meetingTime);
        $time->add(new DateInterval('PT1H')); // Add 1 hour
        $endTime = $time->format('H:i:s');
        
        // Update the record
        $updateStmt = $pdo->prepare('UPDATE ai_booking_data SET end_time = ? WHERE id = ?');
        $result = $updateStmt->execute([$endTime, $id]);
        
        if ($result) {
            echo "Updated ID $id: $meetingTime -> $endTime\n";
        } else {
            echo "Failed to update ID $id\n";
        }
    }
    
    echo "\nVerifying fixes:\n";
    $stmt = $pdo->query('SELECT id, topic, meeting_time, end_time FROM ai_booking_data ORDER BY id DESC LIMIT 5');
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($results as $row) {
        echo "ID: {$row['id']}, Topic: {$row['topic']}, Start: {$row['meeting_time']}, End: {$row['end_time']}\n";
    }
    
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage();
}
?>


