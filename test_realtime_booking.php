<?php
require_once 'config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) {
        throw new Exception("Database connection failed");
    }
    
    echo "<h2>🔄 Testing Real-time Booking Updates</h2>";
    
    // Test 1: Check current AI bookings
    echo "<h3>1. Current AI Bookings:</h3>";
    $stmt = $conn->query("SELECT id, room_name, topic, meeting_date, meeting_time, duration, created_at FROM ai_bookings_success ORDER BY created_at DESC LIMIT 3");
    $bookings = $stmt->fetchAll();
    
    if (count($bookings) > 0) {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>ID</th><th>Room</th><th>Topic</th><th>Date</th><th>Time</th><th>Duration</th><th>Created</th><th>Time Status</th></tr>";
        
        foreach ($bookings as $booking) {
            $startTime = $booking['meeting_time'];
            $duration = $booking['duration'];
            $date = $booking['meeting_date'];
            
            // Calculate time status
            $timeStatus = '';
            try {
                $startDateTime = new DateTime("$date $startTime");
                $endDateTime = clone $startDateTime;
                $endDateTime->add(new DateInterval('PT' . $duration . 'M'));
                
                $now = new DateTime();
                
                if ($now < $startDateTime) {
                    $diff = $now->diff($startDateTime);
                    $hours = $diff->h;
                    $minutes = $diff->i;
                    if ($hours > 0) {
                        $timeStatus = "Dalam $hours jam $minutes menit";
                    } else {
                        $timeStatus = "Dalam $minutes menit";
                    }
                } elseif ($now >= $startDateTime && $now <= $endDateTime) {
                    $timeStatus = "Sedang berlangsung";
                } else {
                    $timeStatus = "Sudah selesai";
                }
            } catch (Exception $e) {
                $timeStatus = "Error calculating time";
            }
            
            echo "<tr>";
            echo "<td>{$booking['id']}</td>";
            echo "<td>{$booking['room_name']}</td>";
            echo "<td>{$booking['topic']}</td>";
            echo "<td>{$date}</td>";
            echo "<td>{$startTime}</td>";
            echo "<td>{$duration} min</td>";
            echo "<td>{$booking['created_at']}</td>";
            echo "<td><strong>{$timeStatus}</strong></td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p>No AI bookings found.</p>";
    }
    
    // Test 2: Test API response
    echo "<h3>2. API Response Test:</h3>";
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
        if (isset($data['status']) && $data['status'] === 'success') {
            echo "<p style='color: green;'>✅ API working! Found " . count($data['data']) . " bookings</p>";
            
            if (count($data['data']) > 0) {
                echo "<h4>Sample API Response:</h4>";
                echo "<pre>" . json_encode($data['data'][0], JSON_PRETTY_PRINT) . "</pre>";
            }
        } else {
            echo "<p style='color: red;'>❌ API error: " . ($data['message'] ?? 'Unknown error') . "</p>";
        }
    } else {
        echo "<p style='color: red;'>❌ API not accessible</p>";
    }
    
    // Test 3: Test time calculation
    echo "<h3>3. Time Calculation Test:</h3>";
    $testCases = [
        ['date' => '2025-01-15', 'time' => '14:00:00', 'duration' => 60],
        ['date' => '2025-01-15', 'time' => '09:30:00', 'duration' => 90],
        ['date' => '2025-01-15', 'time' => '16:00:00', 'duration' => 120],
    ];
    
    foreach ($testCases as $i => $test) {
        try {
            $startDateTime = new DateTime("{$test['date']} {$test['time']}");
            $endDateTime = clone $startDateTime;
            $endDateTime->add(new DateInterval('PT' . $test['duration'] . 'M'));
            
            $startTimeStr = $startDateTime->format('H:i');
            $endTimeStr = $endDateTime->format('H:i');
            $displayFormat = "$startTimeStr - $endTimeStr";
            
            echo "<p>Test " . ($i + 1) . ": {$test['date']} {$test['time']} + {$test['duration']} min = <strong>$displayFormat</strong></p>";
        } catch (Exception $e) {
            echo "<p>Test " . ($i + 1) . ": Error - " . $e->getMessage() . "</p>";
        }
    }
    
    echo "<h3>4. Recommendations:</h3>";
    echo "<p>1. <a href='index.html' target='_blank'>Go to main application</a></p>";
    echo "<p>2. Make a new booking through AI Assistant</p>";
    echo "<p>3. Check if the booking appears immediately in Reservations page</p>";
    echo "<p>4. Verify the time calculation is correct</p>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}
?>




