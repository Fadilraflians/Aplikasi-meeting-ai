<?php
require_once 'config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) {
        throw new Exception("Database connection failed");
    }
    
    echo "<h2>🕐 Testing Time Display</h2>";
    
    // Test AI bookings with time calculation
    echo "<h3>AI Bookings Time Display Test:</h3>";
    $stmt = $conn->query("SELECT id, room_name, topic, meeting_date, meeting_time, duration FROM ai_bookings_success ORDER BY created_at DESC LIMIT 3");
    $bookings = $stmt->fetchAll();
    
    if (count($bookings) > 0) {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>ID</th><th>Room</th><th>Topic</th><th>Date</th><th>Start Time</th><th>Duration</th><th>Calculated End Time</th><th>Display Format</th></tr>";
        
        foreach ($bookings as $booking) {
            $startTime = $booking['meeting_time'];
            $duration = $booking['duration'];
            
            // Calculate end time
            $calculatedEndTime = '';
            $displayFormat = '';
            
            if ($startTime && $duration) {
                try {
                    $startTimeObj = new DateTime("2000-01-01 " . $startTime);
                    $endTimeObj = clone $startTimeObj;
                    $endTimeObj->add(new DateInterval('PT' . $duration . 'M'));
                    
                    $startTimeStr = $startTimeObj->format('H:i');
                    $endTimeStr = $endTimeObj->format('H:i');
                    $calculatedEndTime = $endTimeStr;
                    $displayFormat = $startTimeStr . ' - ' . $endTimeStr;
                } catch (Exception $e) {
                    $calculatedEndTime = 'Error';
                    $displayFormat = $startTime;
                }
            } else {
                $calculatedEndTime = 'No duration';
                $displayFormat = $startTime;
            }
            
            echo "<tr>";
            echo "<td>{$booking['id']}</td>";
            echo "<td>{$booking['room_name']}</td>";
            echo "<td>{$booking['topic']}</td>";
            echo "<td>{$booking['meeting_date']}</td>";
            echo "<td>{$startTime}</td>";
            echo "<td>{$duration} min</td>";
            echo "<td>{$calculatedEndTime}</td>";
            echo "<td><strong>{$displayFormat}</strong></td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p>No AI bookings found.</p>";
    }
    
    // Test reservations with time calculation
    echo "<h3>Reservations Time Display Test:</h3>";
    $stmt = $conn->query("SELECT id, title, start_time, end_time FROM reservations ORDER BY created_at DESC LIMIT 3");
    $reservations = $stmt->fetchAll();
    
    if (count($reservations) > 0) {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>ID</th><th>Title</th><th>Start Time</th><th>End Time</th><th>Display Format</th></tr>";
        
        foreach ($reservations as $reservation) {
            $startTime = $reservation['start_time'];
            $endTime = $reservation['end_time'];
            
            $displayFormat = '';
            if ($startTime && $endTime) {
                try {
                    $startTimeObj = new DateTime($startTime);
                    $endTimeObj = new DateTime($endTime);
                    
                    $startTimeStr = $startTimeObj->format('H:i');
                    $endTimeStr = $endTimeObj->format('H:i');
                    $displayFormat = $startTimeStr . ' - ' . $endTimeStr;
                } catch (Exception $e) {
                    $displayFormat = $startTime;
                }
            } else {
                $displayFormat = $startTime;
            }
            
            echo "<tr>";
            echo "<td>{$reservation['id']}</td>";
            echo "<td>{$reservation['title']}</td>";
            echo "<td>{$startTime}</td>";
            echo "<td>{$endTime}</td>";
            echo "<td><strong>{$displayFormat}</strong></td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p>No reservations found.</p>";
    }
    
    // Test API response
    echo "<h3>API Response Test:</h3>";
    $url = 'http://localhost/aplikasi-meeting-ai/backend/api/bookings.php/ai-success?user_id=1';
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => 'Content-Type: application/json',
            'timeout' => 10
        ]
    ]);
    
    $response = @file_get_contents($url, false, $context);
    if ($response !== false) {
        $data = json_decode($response, true);
        if (isset($data['data']) && count($data['data']) > 0) {
            echo "<p>API Response Sample:</p>";
            echo "<pre>" . json_encode($data['data'][0], JSON_PRETTY_PRINT) . "</pre>";
        } else {
            echo "<p>No data in API response</p>";
        }
    } else {
        echo "<p style='color: red;'>API not accessible</p>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}
?>




