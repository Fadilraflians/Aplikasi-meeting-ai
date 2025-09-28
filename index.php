<?php
/**
 * Main Index File - Laragon Virtual Host
 * File ini untuk testing backend access via aplikasi-meeting-ai.test
 */

echo "<!DOCTYPE html>";
echo "<html lang='id'>";
echo "<head>";
echo "<meta charset='UTF-8'>";
echo "<meta name='viewport' content='width=device-width, initial-scale=1.0'>";
echo "<title>Meeting Room Booking System - Backend</title>";
echo "<style>";
echo "body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }";
echo ".container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }";
echo "h1 { color: #2c3e50; text-align: center; margin-bottom: 30px; font-size: 2.5em; }";
echo ".status { text-align: center; padding: 20px; border-radius: 10px; margin: 20px 0; }";
echo ".success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }";
echo ".info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }";
echo ".grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 30px 0; }";
echo ".card { background: #f8f9fa; padding: 20px; border-radius: 10px; border-left: 4px solid #007bff; }";
echo ".card h3 { color: #007bff; margin-top: 0; }";
echo ".btn { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 8px; margin: 10px 5px; transition: all 0.3s ease; }";
echo ".btn:hover { background: #0056b3; transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }";
echo ".btn-success { background: #28a745; }";
echo ".btn-success:hover { background: #1e7e34; }";
echo ".btn-warning { background: #ffc107; color: #212529; }";
echo ".btn-warning:hover { background: #e0a800; }";
echo ".btn-danger { background: #dc3545; }";
echo ".btn-danger:hover { background: #c82333; }";
echo ".footer { text-align: center; margin-top: 40px; padding: 20px; border-top: 1px solid #dee2e6; color: #6c757d; }";
echo "</style>";
echo "</head>";
echo "<body>";
echo "<div class='container'>";

echo "<h1>🚀 Meeting Room Booking System</h1>";
echo "<div class='status success'>";
echo "<h2>✅ Backend API Berhasil Diakses!</h2>";
echo "<p><strong>URL:</strong> aplikasi-meeting-ai.test</p>";
echo "<p><strong>Status:</strong> Backend siap untuk testing</p>";
echo "</div>";

echo "<div class='grid'>";
echo "<div class='card'>";
echo "<h3>🧪 Database Testing</h3>";
echo "<p>Test koneksi database dan lihat struktur data yang tersedia.</p>";
echo "<a href='backend/public/test_connection.php' class='btn btn-success'>Test Database</a>";
echo "</div>";

echo "<div class='card'>";
echo "<h3>📡 API Endpoints</h3>";
echo "<p>Test semua endpoint API untuk booking ruangan meeting.</p>";
echo "<a href='backend/public/' class='btn btn-info'>Backend Dashboard</a>";
echo "</div>";

echo "<div class='card'>";
echo "<h3>🏢 Meeting Rooms</h3>";
echo "<p>Lihat daftar ruangan meeting yang tersedia.</p>";
echo "<a href='backend/public/api/bookings/rooms' class='btn btn-warning'>View Rooms</a>";
echo "</div>";

echo "<div class='card'>";
echo "<h3>📋 Bookings</h3>";
echo "<p>Lihat semua booking yang sudah dibuat.</p>";
echo "<a href='backend/public/api/bookings' class='btn btn-info'>View Bookings</a>";
echo "</div>";
echo "</div>";

echo "<div class='status info'>";
echo "<h3>🔧 Testing dengan Postman</h3>";
echo "<p><strong>Base URL:</strong> <code>http://aplikasi-meeting-ai.test/backend/public</code></p>";
echo "<p><strong>Collection File:</strong> <code>backend/Meeting_Room_Booking_API.postman_collection.json</code></p>";
echo "<p><strong>Environment Variable:</strong> <code>base_url = http://aplikasi-meeting-ai.test/backend/public</code></p>";
echo "</div>";

echo "<div class='grid'>";
echo "<div class='card'>";
echo "<h3>📚 Quick Start Guide</h3>";
echo "<ol>";
echo "<li>Test database connection</li>";
echo "<li>Import Postman collection</li>";
echo "<li>Setup environment variables</li>";
echo "<li>Test API endpoints</li>";
echo "<li>Verify responses</li>";
echo "</ol>";
echo "</div>";

echo "<div class='card'>";
echo "<h3>🚨 Troubleshooting</h3>";
echo "<ul>";
echo "<li>Pastikan MySQL service berjalan</li>";
echo "<li>Verifikasi database <code>spacio_meeting_db</code></li>";
echo "<li>Cek file <code>.htaccess</code> ada</li>";
echo "<li>Test dengan browser dulu</li>";
echo "</ul>";
echo "</div>";
echo "</div>";

echo "<div class='footer'>";
echo "<p><strong>Status:</strong> <span style='color: #28a745;'>✅ Backend Ready untuk Testing!</span></p>";
echo "<p>Next Step: Test dengan Postman menggunakan endpoint <code>/api/bookings</code></p>";
echo "</div>";

echo "</div>";
echo "</body>";
echo "</html>";
?>
