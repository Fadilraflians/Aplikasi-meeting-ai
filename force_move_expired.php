<?php
require_once 'config/database.php';

// Set timezone to WIB
date_default_timezone_set('Asia/Jakarta');

echo "<h1>Force Move Expired to History</h1>";

// Get database connection
$pdo = getDBConnection();
if (!$pdo) {
    echo "<p style='color: red;'>Error: Could not connect to database</p>";
    exit;
}

// Get current time in WIB
$currentDate = date('Y-m-d');
$currentTime = date('H:i:s');
$currentTimeShort = date('H:i');

echo "<h2>Current Time (WIB):</h2>";
echo "<p><strong>Date:</strong> $currentDate</p>";
echo "<p><strong>Time:</strong> $currentTime</p>";

// Function to determine status
function getBookingStatus($bookingDate, $startTime, $endTime, $currentDate, $currentTime) {
    if ($bookingDate !== $currentDate) {
        return $bookingDate < $currentDate ? 'expired' : 'upcoming';
    }
    
    $startMinutes = (int)substr($startTime, 0, 2) * 60 + (int)substr($startTime, 3, 2);
    $endMinutes = (int)substr($endTime, 0, 2) * 60 + (int)substr($endTime, 3, 2);
    $currentMinutes = (int)substr($currentTime, 0, 2) * 60 + (int)substr($currentTime, 3, 2);
    
    if ($currentMinutes < $startMinutes) {
        return 'upcoming';
    } elseif ($currentMinutes >= $startMinutes && $currentMinutes <= $endMinutes) {
        return 'ongoing';
    } else {
        return 'expired';
    }
}

// Check and move expired server bookings
echo "<h2>Server Bookings (form-based):</h2>";
try {
    $stmt = $pdo->query("SELECT id, topic, meeting_date, start_time, end_time, room_name, pic, participants FROM bookings WHERE meeting_date = '$currentDate' ORDER BY start_time");
    $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($bookings)) {
        echo "<p>No bookings found for today.</p>";
    } else {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>ID</th><th>Topic</th><th>Date</th><th>Start Time</th><th>End Time</th><th>Room</th><th>Status</th><th>Action</th></tr>";
        
        foreach ($bookings as $booking) {
            $startTime = substr($booking['start_time'], 0, 5);
            $endTime = $booking['end_time'] ? substr($booking['end_time'], 0, 5) : 'N/A';
            
            $status = getBookingStatus($booking['meeting_date'], $startTime, $endTime, $currentDate, $currentTimeShort);
            
            $color = $status === 'expired' ? 'red' : ($status === 'ongoing' ? 'green' : 'blue');
            
            echo "<tr>";
            echo "<td>{$booking['id']}</td>";
            echo "<td>{$booking['topic']}</td>";
            echo "<td>{$booking['meeting_date']}</td>";
            echo "<td>$startTime</td>";
            echo "<td>$endTime</td>";
            echo "<td>{$booking['room_name']}</td>";
            echo "<td style='color: $color; font-weight: bold;'>$status</td>";
            
            if ($status === 'expired') {
                echo "<td><button onclick='moveToHistory({$booking['id']}, \"server\")'>Move to History</button></td>";
            } else {
                echo "<td>-</td>";
            }
            echo "</tr>";
        }
        echo "</table>";
    }
} catch (Exception $e) {
    echo "<p>Error: " . $e->getMessage() . "</p>";
}

// Check and move expired AI bookings
echo "<h2>AI Bookings (ai_bookings_success):</h2>";
try {
    $stmt = $pdo->query("SELECT id, topic, meeting_date, meeting_time, end_time, room_name, pic, participants FROM ai_bookings_success WHERE meeting_date = '$currentDate' ORDER BY meeting_time");
    $aiBookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($aiBookings)) {
        echo "<p>No AI bookings found for today.</p>";
    } else {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>ID</th><th>Topic</th><th>Date</th><th>Start Time</th><th>End Time</th><th>Room</th><th>Status</th><th>Action</th></tr>";
        
        foreach ($aiBookings as $booking) {
            $startTime = substr($booking['meeting_time'], 0, 5);
            $endTime = $booking['end_time'] ? substr($booking['end_time'], 0, 5) : 'N/A';
            
            $status = getBookingStatus($booking['meeting_date'], $startTime, $endTime, $currentDate, $currentTimeShort);
            
            $color = $status === 'expired' ? 'red' : ($status === 'ongoing' ? 'green' : 'blue');
            
            echo "<tr>";
            echo "<td>{$booking['id']}</td>";
            echo "<td>{$booking['topic']}</td>";
            echo "<td>{$booking['meeting_date']}</td>";
            echo "<td>$startTime</td>";
            echo "<td>$endTime</td>";
            echo "<td>{$booking['room_name']}</td>";
            echo "<td style='color: $color; font-weight: bold;'>$status</td>";
            
            if ($status === 'expired') {
                echo "<td><button onclick='moveToHistory({$booking['id']}, \"ai\")'>Move to History</button></td>";
            } else {
                echo "<td>-</td>";
            }
            echo "</tr>";
        }
        echo "</table>";
    }
} catch (Exception $e) {
    echo "<p>Error: " . $e->getMessage() . "</p>";
}

echo "<script>
function moveToHistory(bookingId, source) {
    if (confirm('Are you sure you want to move this booking to history?')) {
        // Create history entry data
        const historyEntry = {
            id: bookingId,
            status: 'expired',
            completedAt: new Date().toISOString(),
            source: source
        };
        
        // Get existing history
        let history = JSON.parse(localStorage.getItem('booking_history') || '[]');
        
        // Add to history
        history.unshift({
            ...historyEntry,
            savedAt: new Date().toISOString()
        });
        
        // Keep only last 200 entries
        history = history.slice(0, 200);
        
        // Save back to localStorage
        localStorage.setItem('booking_history', JSON.stringify(history));
        
        alert('Booking moved to history successfully!');
        location.reload();
    }
}
</script>";
?>

