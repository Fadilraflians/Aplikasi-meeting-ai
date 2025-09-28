# 🚀 Meeting Room Booking API - Backend

Backend API untuk sistem pemesanan ruangan meeting dengan AI Agent dan Form-based booking. Disesuaikan untuk database `spacio_meeting_db` yang sudah ada.

## 🌐 **Virtual Host Access (Laragon)**

Project ini menggunakan Laragon dengan virtual host:
- **Main URL**: `http://aplikasi-meeting-ai.test/`
- **Backend API**: `http://aplikasi-meeting-ai.test/backend/public/`
- **Database Test**: `http://aplikasi-meeting-ai.test/backend/public/test_connection.php`

## 📁 Struktur Folder

```
aplikasi-meeting-ai/           # Root project (Laragon virtual host)
├── index.php                  # Main index (aplikasi-meeting-ai.test)
├── .htaccess                 # Root routing
├── backend/
│   ├── public/               # Public accessible files
│   │   ├── index.php         # Backend dashboard
│   │   ├── test_connection.php # Database test
│   │   └── .htaccess        # API routing
│   ├── api/
│   │   └── bookings.php     # Main API endpoint
│   ├── models/               # Database models
│   ├── config/               # Database config
│   └── Meeting_Room_Booking_API.postman_collection.json
└── src/                      # React frontend
```

## 🗄️ Database Structure

API ini bekerja dengan database `spacio_meeting_db` yang sudah ada:

- **`users`** - Data pengguna
- **`meeting_rooms`** - Data ruangan meeting
- **`ai_booking_data`** - Data booking dari AI agent
- **`ai_conversations`** - Riwayat percakapan AI
- **`reservations`** - Data reservasi

## 🚀 Cara Testing

### 1. **Test Main Access (Virtual Host)**
```bash
# Buka browser
http://aplikasi-meeting-ai.test/
```

**Expected Output:**
- 🚀 Meeting Room Booking System
- ✅ Backend API Berhasil Diakses!
- 🔗 Link untuk testing semua fitur

### 2. **Test Database Connection**
```bash
# Buka browser
http://aplikasi-meeting-ai.test/backend/public/test_connection.php
```

**Expected Output:**
- ✅ Database connection successful!
- 📊 Database Statistics dengan jumlah data di setiap tabel
- 📋 Sample data preview

### 3. **Test Backend Dashboard**
```bash
# Buka browser
http://aplikasi-meeting-ai.test/backend/public/
```

**Expected Output:**
- 🚀 Backend API Berhasil Diakses!
- 📁 Struktur folder yang tersedia
- 🔗 Link untuk testing

### 4. **Test dengan Postman**

#### **Import Collection**
1. Buka Postman
2. Import file `backend/Meeting_Room_Booking_API.postman_collection.json`
3. Setup environment variable:
   - **Key**: `base_url`
   - **Value**: `http://aplikasi-meeting-ai.test/backend/public`

#### **Test Endpoints**

**GET - Get All Meeting Rooms**
```http
GET http://aplikasi-meeting-ai.test/backend/public/api/bookings/rooms
```

**GET - Get All Bookings**
```http
GET http://aplikasi-meeting-ai.test/backend/public/api/bookings
```

**POST - Create AI Agent Booking**
```http
POST http://aplikasi-meeting-ai.test/backend/public/api/bookings/ai-booking
Content-Type: application/json

{
  "user_id": 1,
  "session_id": "session_123",
  "room_id": 1,
  "topic": "Rapat AI Agent",
  "meeting_date": "2024-12-26",
  "meeting_time": "14:00:00",
  "duration": 60,
  "participants": 8,
  "meeting_type": "internal",
  "food_order": "tidak"
}
```

**POST - Create Form-based Booking**
```http
POST http://aplikasi-meeting-ai.test/backend/public/api/bookings
Content-Type: application/json

{
  "user_id": 1,
  "room_id": 1,
  "topic": "Presentasi Client",
  "meeting_date": "2024-12-27",
  "meeting_time": "10:00:00",
  "duration": 90,
  "participants": 12,
  "meeting_type": "external",
  "food_order": "ringan"
}
```

## 🔧 Troubleshooting

### **Issue: "aplikasi-meeting-ai.test tidak bisa diakses"**
**Solution:**
- Pastikan Laragon berjalan
- Cek virtual host di Laragon
- Restart Laragon jika perlu
- Test dengan `http://localhost/aplikasi-meeting-ai/`

### **Issue: "404 Not Found"**
**Solution:**
- Pastikan file `.htaccess` ada di root project
- Pastikan mod_rewrite enabled di Apache
- Test dengan browser: `http://aplikasi-meeting-ai.test/`

### **Issue: "Database connection failed"**
**Solution:**
- Cek MySQL service berjalan di Laragon
- Verifikasi database `spacio_meeting_db` ada
- Test dengan `test_connection.php`

### **Issue: "500 Internal Server Error"**
**Solution:**
- Cek error log Apache di Laragon
- Pastikan semua file model ada
- Verifikasi struktur tabel database

## 📋 Urutan Testing yang Disarankan

1. **Test Main Access** → `aplikasi-meeting-ai.test/`
2. **Test Database Connection** → `test_connection.php`
3. **Test Backend Dashboard** → `backend/public/`
4. **Test GET Rooms** → Pastikan data ruangan muncul
5. **Test GET Bookings** → Verifikasi booking yang sudah ada
6. **Test POST AI Booking** → Buat booking baru dengan AI
7. **Test POST Form Booking** → Buat booking dengan form
8. **Test GET Bookings** → Verifikasi semua booking muncul
9. **Test Availability** → Cek konflik jadwal
10. **Test Conversations** → Lihat riwayat AI
11. **Test PUT/DELETE** → Update dan hapus booking

## 🎯 Fitur Utama

- ✅ **AI Agent Integration** - Support untuk booking via AI
- ✅ **Form-based Booking** - Support untuk booking via form
- ✅ **Room Availability Check** - Cek ketersediaan ruangan
- ✅ **User Management** - Manajemen data pengguna
- ✅ **Conversation History** - Riwayat percakapan AI
- ✅ **RESTful API** - Standard HTTP methods
- ✅ **Virtual Host Support** - Laragon integration

## 🚀 Next Steps

Setelah semua endpoint berfungsi:
1. **Integrate dengan Frontend React**
2. **Test AI Agent Integration**
3. **Test Form-based Booking**
4. **Deploy ke Production**

## 📞 Support

Jika ada error atau masalah:
1. Cek `aplikasi-meeting-ai.test/` untuk main access
2. Cek `test_connection.php` untuk verifikasi database
3. Cek error log Apache di Laragon
4. Pastikan semua file ada di folder yang benar
5. Test dengan Postman untuk debugging API

---

**Status: ✅ Backend Ready untuk Testing dengan Virtual Host!**

**URL Testing:**
- **Main**: `http://aplikasi-meeting-ai.test/`
- **Backend**: `http://aplikasi-meeting-ai.test/backend/public/`
- **API**: `http://aplikasi-meeting-ai.test/backend/public/api/bookings`
