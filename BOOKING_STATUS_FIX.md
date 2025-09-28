# Perbaikan Status Booking

## Masalah yang Diperbaiki
- Booking yang sudah selesai masih berstatus "active" di database
- Tidak ada mekanisme otomatis untuk mengubah status menjadi "completed"
- Status enum tidak memiliki nilai "completed"

## Solusi yang Diterapkan

### 1. Perbaikan Database Schema
```sql
-- Menambahkan 'completed' ke enum status
ALTER TABLE bookings MODIFY COLUMN status ENUM('active','expired','cancelled','completed') DEFAULT 'active';
```

### 2. Auto-Complete Script
- File: `auto_complete_bookings.php`
- Fungsi: Otomatis mengubah status booking yang sudah expired menjadi "completed"
- Menangani 3 tabel:
  - `ai_booking_data` (AI bookings)
  - `bookings` (regular bookings)  
  - `ai_bookings_success` (successful AI bookings)

### 3. API Endpoints
- **Complete Booking**: `POST /api/bookings.php` dengan action "complete"
- **Cancel Booking**: `DELETE /api/bookings.php/{id}?reason={reason}`

### 4. Cron Job Setup
- **Windows**: `setup_cron.bat` - Membuat scheduled task setiap 5 menit
- **Linux/Mac**: `setup_cron.sh` - Menambahkan ke crontab setiap 5 menit

## Cara Kerja

### Status Transisi
1. **active** → **completed**: Ketika meeting sudah selesai (auto-complete atau manual)
2. **active** → **cancelled**: Ketika user membatalkan booking
3. **active** → **expired**: Ketika meeting sudah lewat (deprecated, gunakan completed)

### Auto-Complete Logic
```php
// Booking dianggap expired jika:
CONCAT(meeting_date, ' ', end_time) < CURRENT_TIMESTAMP
```

### Manual Complete
```javascript
// API call untuk complete booking
POST /api/bookings.php
{
  "action": "complete",
  "booking_id": 123
}
```

### Manual Cancel
```javascript
// API call untuk cancel booking
DELETE /api/bookings.php/123?reason=User%20cancelled
```

## Testing

### Test Auto-Complete
1. Buat booking dengan waktu yang sudah lewat
2. Jalankan `php auto_complete_bookings.php`
3. Cek status berubah menjadi "completed"

### Test Manual Complete
1. Buat booking dengan status "active"
2. Panggil API complete
3. Cek status berubah menjadi "completed"

### Test Manual Cancel
1. Buat booking dengan status "active"
2. Panggil API cancel dengan reason
3. Cek status berubah menjadi "cancelled"

## Setup Cron Job

### Windows
```cmd
setup_cron.bat
```

### Linux/Mac
```bash
chmod +x setup_cron.sh
./setup_cron.sh
```

## Monitoring

### Cek Status Booking
```sql
SELECT id, topic, status, meeting_date, start_time, end_time 
FROM bookings 
WHERE status IN ('active', 'completed', 'cancelled')
ORDER BY meeting_date DESC;
```

### Cek Auto-Complete Log
- Script auto-complete akan menampilkan log di console
- Untuk production, redirect output ke file log

## File yang Dimodifikasi
1. `backend/api/bookings.php` - Perbaikan auto-complete logic
2. `api/bookings.php` - Perbaikan complete/cancel endpoints
3. `auto_complete_bookings.php` - Script auto-complete baru
4. `setup_cron.bat` - Setup cron job Windows
5. `setup_cron.sh` - Setup cron job Linux/Mac

## Status Enum Values
- `active`: Booking aktif/sedang berlangsung
- `completed`: Booking sudah selesai
- `cancelled`: Booking dibatalkan
- `expired`: Booking sudah lewat (deprecated)
