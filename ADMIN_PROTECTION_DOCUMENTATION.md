# Dokumentasi Sistem Proteksi Admin untuk Operasi Ruangan

## Overview
Sistem ini telah diimplementasikan untuk memastikan bahwa hanya akun administrator yang dapat melakukan operasi manajemen ruangan (tambah, edit, hapus, nonaktifkan ruangan).

## Proteksi yang Diterapkan

### 1. Frontend Protection (UI Level)

#### A. App.tsx - Handler Functions
- `handleAddRoom()`: Memeriksa role admin sebelum navigasi ke halaman tambah ruangan
- `handleEditRoom()`: Memeriksa role admin sebelum navigasi ke halaman edit ruangan  
- `handleDeleteRoom()`: Memeriksa role admin sebelum operasi hapus ruangan
- `handleUpdateRoomStatus()`: Memeriksa role admin sebelum operasi nonaktifkan/aktifkan ruangan
- `isAdmin()`: Helper function untuk mengecek apakah user adalah admin
- `isAdminPage()`: Helper function untuk mengecek halaman yang memerlukan akses admin
- `navigateTo()`: Memeriksa akses admin sebelum navigasi ke halaman admin

#### B. RoomDetailPage.tsx - Tombol Admin
- Tombol "Edit": Memeriksa role admin sebelum menampilkan dan mengizinkan klik
- Tombol "Nonaktifkan/Aktifkan": Memeriksa role admin sebelum operasi
- Tombol "Hapus": Memeriksa role admin sebelum operasi
- Semua tombol admin hanya ditampilkan jika `user?.role === 'admin'`

#### C. MeetingRoomsPage.tsx - Tombol Tambah Ruangan
- Tombol "Tambah Ruangan" di header: Memeriksa role admin sebelum operasi
- Tombol "Tambah Ruangan Pertama": Memeriksa role admin sebelum operasi
- Tombol hanya ditampilkan jika `user?.role === 'admin'`

### 2. Backend Protection (API Level)

#### A. api/meeting_rooms.php
- **POST create**: Memerlukan `$authMiddleware->requireAdmin()`
- **POST update**: Memerlukan `$authMiddleware->requireAdmin()`
- **POST update_status**: Memerlukan `$authMiddleware->requireAdmin()`
- **DELETE**: Memerlukan `$authMiddleware->requireAdmin()`

#### B. api/middleware/auth.php
- `requireAuth()`: Memvalidasi session token
- `requireAdmin()`: Memvalidasi session token DAN memeriksa role = 'admin'
- `requireRole($requiredRole)`: Memvalidasi session token DAN memeriksa role spesifik

### 3. Database Level
- Tabel `users` memiliki kolom `role` dengan ENUM('admin', 'user')
- Default role untuk user baru adalah 'user'
- Akun admin dibuat dengan role 'admin'

## Akun yang Tersedia

### Admin Account
- **Email**: admin@spacio.com
- **Password**: admin123
- **Role**: admin
- **Akses**: 
  - Semua fitur aplikasi
  - Tambah ruangan meeting
  - Edit ruangan meeting
  - Hapus ruangan meeting
  - Nonaktifkan/aktifkan ruangan
  - Pemesanan ruangan (form dan AI)

### User Account
- **Email**: raflians@gmail.com
- **Password**: admin123
- **Role**: user
- **Akses**:
  - Pemesanan ruangan melalui form
  - Pemesanan ruangan melalui AI assistant
  - Melihat daftar ruangan
  - Melihat detail ruangan
  - Melihat reservasi
  - Melihat history
  - **TIDAK BISA**: Tambah/edit/hapus/nonaktifkan ruangan

## Cara Menggunakan

### Login sebagai Admin
1. Buka aplikasi
2. Login dengan:
   - Email: admin@spacio.com
   - Password: admin123
3. Admin akan melihat semua tombol admin (Tambah Ruangan, Edit, Hapus, Nonaktifkan)

### Login sebagai User
1. Buka aplikasi
2. Login dengan:
   - Email: raflians@gmail.com
   - Password: admin123
3. User hanya akan melihat tombol untuk memesan ruangan
4. Tombol admin akan disembunyikan

## Proteksi yang Diterapkan

### Frontend Protection
- Tombol admin disembunyikan untuk user biasa
- Navigasi ke halaman admin diblokir untuk user biasa
- Alert ditampilkan jika user mencoba mengakses fitur admin
- Double-check pada setiap handler function

### Backend Protection
- API endpoint untuk CRUD ruangan memerlukan role admin
- Middleware AuthMiddleware mengecek role sebelum mengizinkan akses
- Response 403 Forbidden jika user tidak memiliki role admin

## Testing

### Test Admin Access
1. Login dengan admin@spacio.com
2. Pastikan tombol "Tambah Ruangan" muncul
3. Pastikan tombol Edit/Hapus/Nonaktifkan muncul di detail ruangan
4. Pastikan dapat melakukan semua operasi admin

### Test User Access
1. Login dengan raflians@gmail.com
2. Pastikan tombol "Tambah Ruangan" tidak muncul
3. Pastikan tombol Edit/Hapus/Nonaktifkan tidak muncul di detail ruangan
4. Pastikan masih bisa memesan ruangan
5. Pastikan mendapat alert jika mencoba mengakses fitur admin

### Test API Protection
1. Coba akses API meeting rooms dengan role user
2. Pastikan mendapat response 403 Forbidden untuk operasi admin

## File yang Dimodifikasi

### Frontend
- `App.tsx` - Menambahkan proteksi pada handler functions
- `pages/RoomDetailPage.tsx` - Menambahkan proteksi pada tombol admin
- `pages/MeetingRoomsPage.tsx` - Menambahkan proteksi pada tombol tambah ruangan

### Backend
- `api/meeting_rooms.php` - Sudah memiliki proteksi admin (tidak perlu diubah)
- `api/middleware/auth.php` - Sudah memiliki proteksi admin (tidak perlu diubah)

## Kesimpulan

Sistem proteksi admin telah diimplementasikan dengan baik pada level:
1. **UI/Frontend**: Tombol admin disembunyikan dan dilindungi dengan double-check
2. **API/Backend**: Semua endpoint admin memerlukan role admin
3. **Database**: Role user tersimpan dengan aman di database

Dengan implementasi ini, hanya akun administrator yang dapat melakukan operasi manajemen ruangan, sementara user biasa hanya dapat memesan ruangan.
