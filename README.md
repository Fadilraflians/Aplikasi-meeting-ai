# Aplikasi Meeting Room Booking dengan AI Assistant

Sistem pemesanan ruang meeting yang dilengkapi dengan AI Assistant untuk membantu proses booking secara otomatis.

## 🚀 Fitur Utama

- **Dashboard Interaktif**: Tampilan overview pemesanan dan statistik
- **AI Assistant**: Booking otomatis melalui chat interface
- **Manajemen Ruang**: CRUD operations untuk ruang meeting
- **Sistem Reservasi**: Form-based dan AI-based booking
- **Multi-language Support**: Bahasa Indonesia dan Inggris
- **Dark Mode**: Tema gelap dan terang
- **Responsive Design**: Optimized untuk desktop dan mobile

## 🛠️ Teknologi yang Digunakan

### Frontend
- **React 18** dengan TypeScript
- **Vite** sebagai build tool
- **Tailwind CSS** untuk styling
- **Context API** untuk state management

### Backend
- **PHP 8+** dengan PDO
- **MySQL** database
- **MongoDB** untuk AI conversations (optional)
- **RESTful API** architecture

### AI Integration
- **Google Gemini API** untuk AI assistant
- **Natural Language Processing** untuk booking automation

## 📋 Prerequisites

- **Node.js** 18+ 
- **PHP** 8.0+
- **MySQL** 5.7+
- **Composer** (untuk PHP dependencies)
- **Google Gemini API Key**

## 🚀 Installation & Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd aplikasi-meeting-ai
```

### 2. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
composer install
```

### 3. Database Setup

1. Buat database MySQL:
```sql
CREATE DATABASE meeting_room_booking;
```

2. Import schema:
```bash
mysql -u username -p meeting_room_booking < database/schema.sql
```

3. Konfigurasi database di `backend/config/database.php`:
```php
$host = 'localhost';
$db_name = 'meeting_room_booking';
$username = 'your_username';
$password = 'your_password';
```

### 4. Environment Configuration

Buat file `.env.local` di root directory:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_API_URL=http://localhost:8080/backend/api
VITE_AUTH_API_URL=http://localhost:8080/api
```

### 5. Run Application

**Development Mode:**
```bash
# Frontend (Terminal 1)
npm run dev

# Backend (Terminal 2) - jika menggunakan PHP built-in server
php -S localhost:8080
```

Aplikasi akan berjalan di `http://localhost:5173`

## 📁 Struktur Project

```
aplikasi-meeting-ai/
├── components/          # React components
├── pages/              # Page components
├── contexts/           # React contexts (DarkMode, Language)
├── services/           # Business logic services
├── backend/            # PHP backend
│   ├── api/           # API endpoints
│   ├── models/        # Database models
│   └── config/        # Configuration files
├── database/          # SQL schema files
├── public/            # Static assets
└── uploads/           # File uploads
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login.php` - User login
- `POST /api/auth/register.php` - User registration
- `POST /api/auth/session.php` - Session validation

### Meeting Rooms
- `GET /backend/api/bookings.php/rooms` - Get all rooms
- `POST /backend/api/bookings.php/rooms` - Create room
- `PUT /backend/api/bookings.php` - Update room
- `DELETE /backend/api/bookings.php/rooms` - Delete room

### Bookings
- `GET /backend/api/bookings.php/user` - Get user bookings
- `POST /backend/api/bookings.php/bookings` - Create booking
- `POST /backend/api/bookings.php/ai-booking` - AI booking
- `DELETE /backend/api/bookings.php/{id}` - Cancel booking

## 🤖 AI Assistant Features

- **Natural Language Processing**: Memahami permintaan booking dalam bahasa natural
- **Context Awareness**: Mengingat konteks percakapan
- **Smart Suggestions**: Memberikan saran ruang berdasarkan kebutuhan
- **Multi-step Booking**: Proses booking bertahap dengan konfirmasi

## 🎨 UI/UX Features

- **Modern Design**: Clean dan professional interface
- **Responsive Layout**: Optimal di semua device
- **Dark/Light Mode**: Toggle tema sesuai preferensi
- **Multi-language**: Bahasa Indonesia dan Inggris
- **Interactive Components**: Smooth animations dan transitions

## 📱 Pages Overview

- **Dashboard**: Overview pemesanan dan statistik
- **Meeting Rooms**: Daftar dan manajemen ruang
- **Room Detail**: Detail ruang dengan jadwal booking
- **Booking Form**: Form pemesanan manual
- **AI Assistant**: Chat interface untuk booking otomatis
- **Reservations**: Daftar pemesanan user
- **Profile**: Manajemen profil user

## 🔒 Security Features

- **Session Management**: Secure session handling
- **Input Validation**: Server-side validation
- **SQL Injection Prevention**: PDO prepared statements
- **CORS Configuration**: Proper cross-origin setup
- **File Upload Security**: Validated file uploads

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Variables (Production)
```env
VITE_PROD_API_URL=https://your-domain.com/backend/api
VITE_PROD_AUTH_API_URL=https://your-domain.com/api
VITE_GEMINI_API_KEY=your_production_api_key
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

Untuk pertanyaan atau bantuan, silakan buat issue di repository ini atau hubungi tim development.

---

**Dibuat dengan ❤️ untuk memudahkan proses pemesanan ruang meeting**