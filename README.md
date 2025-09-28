# Spacio - AI Meeting Room Booker

Sistem pemesanan ruang meeting yang dilengkapi dengan AI Assistant untuk membantu proses booking secara otomatis.

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ 
- **PHP** 8.0+
- **MySQL** 5.7+
- **Composer** (untuk PHP dependencies)

### Installation & Setup

1. **Clone Repository**
```bash
git clone <repository-url>
cd aplikasi-meeting-ai
```

2. **Install Dependencies**
```bash
npm run setup
```

3. **Database Setup**
- Buat database MySQL: `spacio_meeting_db`
- Import schema dari `database/schema.sql`

4. **Environment Configuration**
- Copy `env.example` ke `.env`
- Update konfigurasi sesuai kebutuhan

### 🎯 Running the Application

**Single Command untuk Development:**
```bash
npm run dev
```

**Atau gunakan script:**
```bash
# Windows
start.bat

# Linux/Mac
./start.sh
```

## 📱 Access URLs

- **Frontend**: http://localhost:5174
- **Backend**: http://localhost:8080
- **API**: http://localhost:8080/backend/public/api/

## 🛠️ Available Scripts

- `npm run dev` - Start development server (frontend + backend)
- `npm run build` - Build for production
- `npm run setup` - Install all dependencies
- `npm run install:all` - Install Node.js and PHP dependencies

## 🏗️ Architecture

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

## 📁 Project Structure

```
aplikasi-meeting-ai/
├── components/          # React components
├── pages/              # Page components
├── contexts/           # React contexts
├── services/           # Business logic services
├── backend/            # PHP backend
│   ├── api/           # API endpoints
│   ├── models/        # Database models
│   └── config/        # Configuration files
├── api/               # Direct API endpoints
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
- `GET /backend/public/api/meeting_rooms.php` - Get all rooms
- `POST /backend/public/api/meeting_rooms.php` - Create room
- `PUT /backend/public/api/meeting_rooms.php` - Update room
- `DELETE /backend/public/api/meeting_rooms.php` - Delete room

### Bookings
- `GET /backend/public/api/bookings.php` - Get bookings
- `POST /backend/public/api/bookings.php` - Create booking
- `DELETE /backend/public/api/bookings.php` - Cancel booking

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

## 🔒 Security Features

- **Session Management**: Secure session handling
- **Input Validation**: Server-side validation
- **SQL Injection Prevention**: PDO prepared statements
- **CORS Configuration**: Proper cross-origin setup
- **File Upload Security**: Validated file uploads

## 🚀 Deployment

### Production Build
```bash
npm run build:prod
```

### Environment Variables (Production)
```env
VITE_PROD_API_URL=https://your-domain.com/backend/public/api
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