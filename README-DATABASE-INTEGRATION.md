# 📊 INTEGRASI DATABASE RUANGAN - AI ASSISTANT

## 🎯 **OVERVIEW**

AI Assistant sekarang sudah terhubung ke database ruangan untuk memberikan rekomendasi yang akurat dan real-time berdasarkan data aktual dari database.

## 🏗️ **ARSITEKTUR INTEGRASI**

### **1. Frontend Services**
- **`roomDatabaseService.ts`** - Layanan untuk komunikasi dengan database ruangan
- **`roomBookingAssistant.ts`** - AI Assistant yang terintegrasi dengan database

### **2. Backend API**
- **`backend/api/meeting_rooms.php`** - Endpoint API untuk akses database ruangan
- **`backend/models/MeetingRoom.php`** - Model database untuk operasi ruangan

### **3. Database Schema**
- **`meeting_rooms`** - Tabel utama ruangan meeting
- **`ai_booking_data`** - Tabel data pemesanan AI
- **`reservations`** - Tabel reservasi (jika ada)

## 🔧 **FITUR YANG TERSEDIA**

### **1. Rekomendasi Ruangan Cerdas**
```typescript
// AI akan memberikan rekomendasi berdasarkan:
- Jumlah peserta
- Tanggal dan waktu
- Fasilitas yang dibutuhkan
- Ketersediaan real-time
- Skor kecocokan (0-100)
```

### **2. Cek Ketersediaan Real-time**
```typescript
// AI akan mengecek:
- Konflik jadwal
- Status maintenance
- Kapasitas yang sesuai
- Fasilitas yang tersedia
```

### **3. Pencarian Ruangan Dinamis**
```typescript
// AI dapat mencari berdasarkan:
- Nama ruangan
- Kapasitas minimum/maksimum
- Lantai
- Fasilitas spesifik
- Status ketersediaan
```

## 📋 **CARA PENGGUNAAN**

### **1. Rekomendasi Otomatis**
```
User: "Saya butuh ruangan untuk 10 orang besok jam 10"

AI Response:
🏢 REKOMENDASI RUANGAN:
1. Samudrantha (10 orang)
   Skor: 95/100
   Alasan: Kapasitas pas untuk jumlah peserta, Tersedia pada waktu yang diminta
   Fasilitas: Proyektor, AC, WiFi

2. Nusanipa (12 orang)
   Skor: 85/100
   Alasan: Kapasitas cukup untuk jumlah peserta, Tersedia pada waktu yang diminta
   Fasilitas: Proyektor, Papan tulis, AC
```

### **2. Pilih Ruangan dari Database**
```
User: Klik "🏢 Pilih Ruangan"

AI Response:
🏢 PILIH RUANGAN

Untuk 10 orang, saya rekomendasikan:

Ruangan Tersedia:
• Samudrantha (10 orang) - Proyektor, AC, WiFi
• Nusanipa (12 orang) - Proyektor, Papan tulis, AC
• Balidwipa (15 orang) - Proyektor, Sound system, AC
• Swarnadwipa (20 orang) - Proyektor, Papan tulis, Sound system, AC

Silakan pilih ruangan yang sesuai:
```

### **3. Cek Ketersediaan**
```
User: "Apakah Samudrantha tersedia besok jam 14:00?"

AI Response:
✅ Samudrantha tersedia pada besok jam 14:00-16:00
📋 Detail: Kapasitas 10 orang, Fasilitas: Proyektor, AC, WiFi
```

## 🔄 **FLOW INTEGRASI**

### **1. User Input Processing**
```
User Input → AI Analysis → Database Query → Recommendation → Response
```

### **2. Room Selection Flow**
```
1. User klik "Pilih Ruangan"
2. AI query database untuk ruangan tersedia
3. Filter berdasarkan kapasitas (jika ada)
4. Sort berdasarkan kecocokan
5. Tampilkan rekomendasi dengan skor
6. User pilih ruangan
7. AI update booking data
```

### **3. Availability Check Flow**
```
1. User berikan detail booking
2. AI extract: participants, date, time, facilities
3. Query database untuk rekomendasi
4. Cek konflik jadwal
5. Hitung skor kecocokan
6. Tampilkan rekomendasi terbaik
```

## 🛠️ **TEKNIS IMPLEMENTASI**

### **1. RoomDatabaseService**
```typescript
class RoomDatabaseService {
  // Ambil semua ruangan
  async getAllRooms(): Promise<Room[]>
  
  // Cek ketersediaan ruangan
  async checkRoomAvailability(roomId, date, startTime, endTime): Promise<RoomAvailability>
  
  // Dapatkan rekomendasi ruangan
  async getRoomRecommendations(participants, date, startTime, endTime, facilities): Promise<RoomRecommendation[]>
  
  // Cari ruangan berdasarkan kriteria
  async searchRooms(criteria): Promise<Room[]>
}
```

### **2. API Endpoints**
```php
// GET /backend/api/meeting_rooms.php?action=get_all
// GET /backend/api/meeting_rooms.php?action=get_available&start_time=10:00&end_time=12:00
// GET /backend/api/meeting_rooms.php?action=search&capacity_min=10&facilities=proyektor,ac
```

### **3. Database Integration**
```typescript
// Di roomBookingAssistant.ts
private async handleRoomSelection(bookingData: Partial<Booking>): Promise<RBAResponse> {
  const availableRooms = await this.getAvailableRoomsFromDatabase();
  const recommendations = await this.getRoomRecommendationsFromDatabase(
    participants, date, startTime, endTime, facilities
  );
  // ... process recommendations
}
```

## 📊 **SCORING SYSTEM**

### **Skor Rekomendasi (0-100)**
- **Kapasitas Pas (30 poin)**: 80-100% dari kapasitas ruangan
- **Kapasitas Cukup (20 poin)**: 60-80% dari kapasitas ruangan
- **Kapasitas Lebih (10 poin)**: <60% dari kapasitas ruangan
- **Fasilitas Lengkap (25 poin)**: Semua fasilitas yang dibutuhkan tersedia
- **Fasilitas Sebagian (15 poin)**: Sebagian fasilitas tersedia
- **Lokasi (5 poin)**: Informasi lantai/building
- **Ketersediaan (20 poin)**: Tersedia pada waktu yang diminta

### **Contoh Skor**
```
Samudrantha (10 orang) untuk 8 peserta:
- Kapasitas: 8/10 = 80% → 30 poin
- Fasilitas: Proyektor, AC → 25 poin
- Ketersediaan: ✅ → 20 poin
- Lokasi: Lantai 2 → 5 poin
Total: 80/100
```

## 🚀 **KEUNGGULAN**

### **1. Data Real-time**
- ✅ Ketersediaan ruangan selalu up-to-date
- ✅ Status maintenance terintegrasi
- ✅ Konflik jadwal dicek otomatis

### **2. Rekomendasi Cerdas**
- ✅ Skor kecocokan berdasarkan multiple faktor
- ✅ Filter otomatis berdasarkan kebutuhan
- ✅ Sorting berdasarkan relevansi

### **3. Fallback Robust**
- ✅ Jika database error, gunakan data hardcoded
- ✅ Error handling yang comprehensive
- ✅ Logging untuk debugging

### **4. User Experience**
- ✅ Response cepat dengan loading state
- ✅ Informasi detail ruangan
- ✅ Quick actions untuk pilihan mudah

## 🔧 **KONFIGURASI**

### **1. Database Connection**
```php
// backend/config/database.php
$host = 'localhost';
$dbname = 'spacio_meeting_db';
$username = 'root';
$password = '';
```

### **2. API Base URL**
```typescript
// services/roomDatabaseService.ts
private baseUrl: string = 'http://localhost:5174/backend/api';
```

### **3. CORS Configuration**
```php
// backend/api/meeting_rooms.php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
```

## 📝 **TESTING**

### **1. Test Database Connection**
```bash
# Test API endpoint
curl "http://localhost:5174/backend/api/meeting_rooms.php?action=get_all"
```

### **2. Test Room Recommendations**
```
User Input: "Saya butuh ruangan untuk 8 orang besok jam 10"
Expected: AI memberikan rekomendasi ruangan dari database dengan skor
```

### **3. Test Availability Check**
```
User Input: "Apakah Samudrantha tersedia besok jam 14:00?"
Expected: AI cek database dan berikan status ketersediaan
```

## 🎉 **HASIL AKHIR**

**AI Assistant sekarang dapat:**
- ✅ **Mengecek ketersediaan ruangan real-time** dari database
- ✅ **Memberikan rekomendasi ruangan yang akurat** berdasarkan data aktual
- ✅ **Menampilkan informasi detail ruangan** (kapasitas, fasilitas, lokasi)
- ✅ **Menghitung skor kecocokan** untuk setiap rekomendasi
- ✅ **Memfilter ruangan** berdasarkan kebutuhan user
- ✅ **Menangani error** dengan fallback ke data hardcoded
- ✅ **Memberikan pengalaman user yang seamless** dengan loading states

**Coba sekarang di `http://localhost:5174` - RBA Assistant akan memberikan rekomendasi ruangan yang akurat berdasarkan data database!** 🚀📊
