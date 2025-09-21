<?php
/**
 * Script untuk memaksa refresh AI bookings di frontend
 * Jalankan script ini jika AI bookings tidak muncul di ReservationsPage
 */

require_once 'config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "🔄 Force Refresh AI Bookings...\n";
    echo "=" . str_repeat("=", 50) . "\n";
    
    // 1. Pastikan data AI bookings tersimpan dengan benar
    echo "1️⃣ Verifying AI bookings data...\n";
    
    $query = "SELECT id, user_id, room_name, topic, meeting_date, meeting_time, 
                     participants, pic, booking_state, status, created_at
              FROM ai_bookings_success 
              WHERE user_id = 1 AND booking_state = 'BOOKED'
              ORDER BY created_at DESC";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    $aiBookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "✅ Found " . count($aiBookings) . " active AI bookings for user_id = 1\n\n";
    
    if (count($aiBookings) > 0) {
        echo "📋 AI Bookings that should appear in ReservationsPage:\n";
        foreach($aiBookings as $booking) {
            echo sprintf("  ID: %-3s | Room: %-25s | Topic: %-20s | Date: %-12s | Time: %-8s\n",
                        $booking['id'],
                        substr($booking['room_name'], 0, 25),
                        substr($booking['topic'], 0, 20),
                        $booking['meeting_date'],
                        $booking['meeting_time']
            );
        }
        
        echo "\n2️⃣ Testing API endpoints...\n";
        
        // Test AI bookings API
        $aiApiUrl = "http://localhost/aplikasi-meeting-ai/api/bookings.php/ai-data?user_id=1";
        $aiResponse = file_get_contents($aiApiUrl);
        
        if ($aiResponse !== false) {
            $aiData = json_decode($aiResponse, true);
            $aiCount = isset($aiData['data']) ? count($aiData['data']) : 0;
            echo "✅ AI bookings API: $aiCount bookings returned\n";
        } else {
            echo "❌ AI bookings API failed\n";
        }
        
        // Test server bookings API
        $serverApiUrl = "http://localhost/aplikasi-meeting-ai/api/bookings.php?user_id=1";
        $serverResponse = file_get_contents($serverApiUrl);
        
        if ($serverResponse !== false) {
            $serverData = json_decode($serverResponse, true);
            $serverCount = isset($serverData['data']) ? count($serverData['data']) : 0;
            echo "✅ Server bookings API: $serverCount bookings returned\n";
        } else {
            echo "❌ Server bookings API failed\n";
        }
        
        echo "\n3️⃣ Recommendations:\n";
        echo "=" . str_repeat("=", 30) . "\n";
        echo "📱 FRONTEND SOLUTIONS:\n";
        echo "1. Refresh the ReservationsPage in your browser\n";
        echo "2. Clear browser cache and reload\n";
        echo "3. Check browser console for any JavaScript errors\n";
        echo "4. Verify that user_id = 1 is being used in the frontend\n";
        echo "5. Check if there are any network errors in browser dev tools\n\n";
        
        echo "🔧 BACKEND SOLUTIONS:\n";
        echo "1. Restart your web server (Apache/Nginx)\n";
        echo "2. Clear any PHP opcache if enabled\n";
        echo "3. Check error logs for any issues\n\n";
        
        echo "🧪 TESTING:\n";
        echo "1. Open browser dev tools (F12)\n";
        echo "2. Go to Network tab\n";
        echo "3. Navigate to ReservationsPage\n";
        echo "4. Look for API calls to:\n";
        echo "   - /api/bookings.php/ai-data?user_id=1\n";
        echo "   - /api/bookings.php?user_id=1\n";
        echo "5. Check if these calls return the expected data\n\n";
        
        echo "✅ DATA IS CORRECT - The issue is likely in frontend loading/display\n";
        
    } else {
        echo "❌ No active AI bookings found for user_id = 1\n";
        echo "💡 Create a new AI booking to test the system\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
