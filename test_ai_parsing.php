<?php
require_once 'config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) {
        throw new Exception("Database connection failed");
    }
    
    echo "<h2>🧪 Test AI Parsing</h2>";
    
    // Test 1: Check recent AI bookings
    echo "<h3>1. Recent AI Bookings (Last 5):</h3>";
    $stmt = $conn->query("
        SELECT id, user_id, session_id, room_name, topic, pic, meeting_date, meeting_time, 
               participants, meeting_type, food_order, created_at 
        FROM ai_bookings_success 
        ORDER BY created_at DESC 
        LIMIT 5
    ");
    $bookings = $stmt->fetchAll();
    
    if (count($bookings) > 0) {
        echo "<table border='1' style='border-collapse: collapse; width: 100%; font-size: 12px;'>";
        echo "<tr><th>ID</th><th>Room</th><th>Topic</th><th>PIC</th><th>Date</th><th>Time</th><th>Participants</th><th>Type</th><th>Created</th></tr>";
        
        foreach ($bookings as $booking) {
            echo "<tr>";
            echo "<td>{$booking['id']}</td>";
            echo "<td>{$booking['room_name']}</td>";
            echo "<td>{$booking['topic']}</td>";
            echo "<td>{$booking['pic']}</td>";
            echo "<td>{$booking['meeting_date']}</td>";
            echo "<td>{$booking['meeting_time']}</td>";
            echo "<td>{$booking['participants']}</td>";
            echo "<td>{$booking['meeting_type']}</td>";
            echo "<td>{$booking['created_at']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p>No AI bookings found.</p>";
    }
    
    // Test 2: Check for specific test cases
    echo "<h3>2. Test Cases:</h3>";
    echo "<p>Test the following input in AI Assistant:</p>";
    echo "<ul>";
    echo "<li><strong>\"Booking ruang meeting besok jam 09:00 untuk presentasi client PIC Fadil\"</strong></li>";
    echo "<li>Expected results:</li>";
    echo "<ul>";
    echo "<li>Time: 09:00</li>";
    echo "<li>Date: Tomorrow (not today)</li>";
    echo "<li>Topic: presentasi client</li>";
    echo "<li>PIC: Fadil</li>";
    echo "<li>Room: Any available meeting room</li>";
    echo "<li>Participants: Default or inferred</li>";
    echo "</ul>";
    echo "</ul>";
    
    // Test 3: Check parsing improvements
    echo "<h3>3. Parsing Improvements Made:</h3>";
    echo "<div style='background: #f0f0f0; padding: 15px; border-radius: 5px;'>";
    echo "<h4>Topic Detection:</h4>";
    echo "<ul>";
    echo "<li>✅ 'untuk presentasi client' → 'presentasi client'</li>";
    echo "<li>✅ 'untuk rapat tim' → 'rapat tim'</li>";
    echo "<li>✅ 'untuk meeting client' → 'meeting client'</li>";
    echo "<li>✅ 'dengan presentasi' → 'presentasi'</li>";
    echo "</ul>";
    
    echo "<h4>PIC Detection:</h4>";
    echo "<ul>";
    echo "<li>✅ 'PIC Fadil' → 'Fadil'</li>";
    echo "<li>✅ 'pic Fadil' → 'Fadil'</li>";
    echo "<li>✅ 'presentasi client PIC Fadil' → 'Fadil'</li>";
    echo "<li>✅ 'atas nama Fadil' → 'Fadil'</li>";
    echo "</ul>";
    
    echo "<h4>Room Detection:</h4>";
    echo "<ul>";
    echo "<li>✅ 'ruang meeting' → detected as room request</li>";
    echo "<li>✅ 'ruang rapat' → detected as room request</li>";
    echo "<li>✅ 'meeting room' → detected as room request</li>";
    echo "<li>✅ 'auditorium' → detected as room request</li>";
    echo "</ul>";
    echo "</div>";
    
    // Test 4: Manual test instructions
    echo "<h3>4. Manual Test Instructions:</h3>";
    echo "<div style='background: #e8f4f8; padding: 15px; border-radius: 5px; border-left: 4px solid #2196F3;'>";
    echo "<h4>Step-by-step test:</h4>";
    echo "<ol>";
    echo "<li>Open <a href='index.html' target='_blank'>AI Assistant</a> in a new tab</li>";
    echo "<li>Click 'One-Shot Booking' button</li>";
    echo "<li>Type: <strong>'Booking ruang meeting besok jam 09:00 untuk presentasi client PIC Fadil'</strong></li>";
    echo "<li>Check browser console (F12 → Console) for parsing logs</li>";
    echo "<li>Verify that AI detects:</li>";
    echo "<ul>";
    echo "<li>Time: 09:00</li>";
    echo "<li>Date: Tomorrow (not today)</li>";
    echo "<li>Topic: presentasi client</li>";
    echo "<li>PIC: Fadil</li>";
    echo "<li>Room: detected as room request</li>";
    echo "</ul>";
    echo "<li>Complete the booking process</li>";
    echo "<li>Check if the booking appears in this test page</li>";
    echo "</ol>";
    echo "</div>";
    
    // Test 5: Expected console output
    echo "<h3>5. Expected Console Output:</h3>";
    echo "<div style='background: #f5f5f5; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 12px;'>";
    echo "<p>When you type the test input, you should see in console:</p>";
    echo "<pre>";
    echo "🔍 One-Shot Data Detection: {\n";
    echo "  input: 'Booking ruang meeting besok jam 09:00 untuk presentasi client PIC Fadil',\n";
    echo "  hasTime: true,\n";
    echo "  hasDate: true,\n";
    echo "  hasPeople: false,\n";
    echo "  hasTopic: true,\n";
    echo "  hasPic: true,\n";
    echo "  detectedTopic: 'presentasi client',\n";
    echo "  detectedPic: 'Fadil'\n";
    echo "}\n";
    echo "</pre>";
    echo "</div>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}
?>

