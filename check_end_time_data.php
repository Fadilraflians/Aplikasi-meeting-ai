<?php
$host = 'localhost';
$dbname = 'spacio_meeting_db';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Checking ai_booking_data table:\n";
    $stmt = $pdo->query('SELECT id, topic, meeting_time, end_time, meeting_date FROM ai_booking_data ORDER BY id DESC LIMIT 5');
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($results as $row) {
        echo "ID: {$row['id']}, Topic: {$row['topic']}, Start: {$row['meeting_time']}, End: {$row['end_time']}, Date: {$row['meeting_date']}\n";
    }
    
    echo "\nChecking if end_time is NULL:\n";
    $stmt = $pdo->query('SELECT COUNT(*) as total, SUM(CASE WHEN end_time IS NULL THEN 1 ELSE 0 END) as null_count FROM ai_booking_data');
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Total records: {$result['total']}, NULL end_time: {$result['null_count']}\n";
    
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage();
}
?>


