# Sistem Role-Based Access Control

## Overview
Aplikasi Meeting Room Booking sekarang memiliki sistem role-based access control yang membedakan antara **Admin** dan **User**.

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

## Perubahan yang Dibuat

### 1. Database
- Menambahkan kolom `role` dengan ENUM('admin', 'user') ke tabel `users`
- Default role untuk user baru adalah 'user'
- Akun admin dibuat dengan role 'admin'

### 2. Backend API
- **AuthService**: Mengupdate login dan registrasi untuk menyertakan informasi role
- **AuthMiddleware**: Membuat middleware untuk mengecek role admin
- **Meeting Rooms API**: Menambahkan proteksi admin untuk operasi CRUD ruangan

### 3. Frontend
- **LoginPage**: Mengupdate untuk menggunakan API login yang sebenarnya
- **App.tsx**: Menambahkan role-based navigation dan proteksi halaman admin
- **MeetingRoomsPage**: Menyembunyikan tombol "Tambah Ruangan" untuk user biasa
- **RoomDetailPage**: Menyembunyikan tombol Edit, Nonaktifkan, dan Hapus untuk user biasa

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
- Alert ditampilkan jika user mencoba mengakses halaman admin

### Backend Protection
- API endpoint untuk CRUD ruangan memerlukan role admin
- Middleware AuthMiddleware mengecek role sebelum mengizinkan akses
- Response 403 Forbidden jika user tidak memiliki role admin

## File yang Dimodifikasi

### Database
- `database/add_role_system.sql` - Script untuk menambahkan sistem role

### Backend
- `services/authService.php` - Update untuk mendukung role
- `api/middleware/auth.php` - Middleware untuk role-based access
- `api/meeting_rooms.php` - Proteksi admin untuk operasi ruangan

### Frontend
- `pages/LoginPage.tsx` - Update login untuk menggunakan API
- `App.tsx` - Role-based navigation dan proteksi
- `pages/MeetingRoomsPage.tsx` - Sembunyikan tombol admin
- `pages/RoomDetailPage.tsx` - Sembunyikan tombol admin

## Testing

Untuk menguji sistem role:

1. **Test Admin Access**:
   - Login dengan admin@spacio.com
   - Pastikan tombol "Tambah Ruangan" muncul
   - Pastikan tombol Edit/Hapus/Nonaktifkan muncul di detail ruangan
   - **Admin dapat melihat semua booking dari semua user** (termasuk booking dari raflians@gmail.com)

2. **Test User Access**:
   - Login dengan raflians@gmail.com
   - Pastikan tombol "Tambah Ruangan" tidak muncul
   - Pastikan tombol Edit/Hapus/Nonaktifkan tidak muncul di detail ruangan
   - Pastikan masih bisa memesan ruangan
   - **User hanya melihat booking mereka sendiri**

3. **Test API Protection**:
   - Coba akses API meeting rooms dengan role user
   - Pastikan mendapat response 403 Forbidden untuk operasi admin

4. **Test Admin View All Bookings**:
   - Login sebagai admin
   - Dashboard akan menampilkan booking dari semua user
   - Informasi user yang membuat booking akan ditampilkan di card booking
   - Login sebagai user biasa, dashboard hanya menampilkan booking mereka sendiri
