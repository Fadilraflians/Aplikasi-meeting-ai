# MongoDB Integration untuk AI Conversation System

## Overview
Sistem ini mengintegrasikan MongoDB untuk menyimpan percakapan AI dengan sistem pemesanan ruangan yang sudah ada. MongoDB digunakan khusus untuk menyimpan data percakapan tanpa mengubah database MySQL yang sudah ada.

## Struktur Database

### Database: `spacio_ai_conversations`
### Collection: `conversations`

#### Schema Conversation:
```javascript
{
  _id: ObjectId,
  sessionId: String,           // Unique session identifier
  userId: String,              // User ID (optional)
  startTime: Date,             // When conversation started
  endTime: Date,               // When conversation ended (optional)
  messages: [                  // Array of messages
    {
      id: String,              // Unique message ID
      role: String,            // 'user' | 'ai' | 'system'
      content: String,         // Message content
      timestamp: Date,          // When message was sent
      metadata: {               // Additional data
        intent: String,         // Detected intent
        entities: Object,       // Extracted entities
        bookingData: Object,    // Booking data (for user messages)
        confidence: Number,     // AI confidence (for AI messages)
        extractedFields: [String], // Fields extracted
        missingFields: [String]    // Fields still missing
      }
    }
  ],
  status: String,              // 'active' | 'completed' | 'cancelled'
  bookingStatus: String,       // 'none' | 'in_progress' | 'completed' | 'cancelled'
  extractedBookingData: {      // Final extracted booking data
    roomName: String,
    topic: String,
    pic: String,
    participants: Number,
    date: String,
    time: String,
    meetingType: String,
    confidence: Number,
    completeness: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Komponen Sistem

### 1. MongoDB Configuration (`src/config/mongodb.ts`)
- Koneksi ke MongoDB
- Database dan collection management
- Error handling untuk koneksi

### 2. Conversation Service (`services/conversationService.ts`)
- Menyimpan percakapan ke MongoDB
- Mengambil percakapan berdasarkan session ID
- Update status booking
- Ekstrak data booking dari percakapan
- Analisis percakapan untuk insight

### 3. Booking Extraction Service (`services/bookingExtractionService.ts`)
- Mengambil data booking dari percakapan tersimpan
- Analisis pola percakapan
- Generate laporan booking
- Pencarian percakapan berdasarkan kriteria

### 4. AI Integration (`services/roomBookingAssistant.ts`)
- Integrasi dengan ConversationService
- Otomatis menyimpan setiap pesan ke MongoDB
- Update status booking secara real-time
- Tracking konteks percakapan

### 5. API Endpoints (`api/conversation-api.php`)
- REST API untuk mengakses data percakapan
- Endpoints untuk analytics dan reporting
- CRUD operations untuk percakapan

## Fitur Utama

### 1. Penyimpanan Percakapan Otomatis
- Setiap pesan user dan AI otomatis disimpan ke MongoDB
- Metadata lengkap termasuk intent, confidence, dan booking data
- Session management untuk tracking percakapan

### 2. Ekstraksi Data Booking
- Analisis percakapan untuk ekstrak data booking
- Confidence scoring untuk kualitas data
- Identifikasi field yang masih kurang
- Rekomendasi untuk melengkapi data

### 3. Analytics dan Reporting
- Statistik percakapan dan booking
- Analisis pola percakapan
- Success rate tracking
- Performance metrics

### 4. Pencarian dan Filtering
- Pencarian percakapan berdasarkan kriteria
- Filter berdasarkan status booking
- Filter berdasarkan tanggal dan user
- Export data untuk analisis lebih lanjut

## Environment Variables

```bash
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=spacio_ai_conversations

# MongoDB Connection for PHP
VITE_MONGODB_URI=mongodb://localhost:27017
VITE_MONGODB_DB_NAME=spacio_ai_conversations
```

## Setup dan Instalasi

### 1. Install Dependencies
```bash
npm install mongodb mongoose
```

### 2. Setup MongoDB
- Install MongoDB di sistem
- Start MongoDB service
- Buat database `spacio_ai_conversations`

### 3. Konfigurasi Environment
- Copy `env.example` ke `.env`
- Update MongoDB connection string jika diperlukan

### 4. Test Integration
```bash
node test-mongodb-integration.js
```

## API Endpoints

### Conversations
- `GET /conversations` - Get all conversations
- `GET /conversations/{sessionId}` - Get specific conversation
- `GET /conversations/{sessionId}/stats` - Get conversation stats
- `POST /conversations` - Create new conversation
- `PUT /conversations/{sessionId}` - Update conversation

### Bookings
- `GET /bookings` - Get all completed bookings
- `GET /bookings/stats` - Get booking statistics

### Analytics
- `GET /analytics` - Get conversation analytics

## Contoh Penggunaan

### 1. Menyimpan Percakapan
```javascript
const conversationService = new ConversationService();

// Create new conversation
const conversation = {
  sessionId: 'session_123',
  userId: 'user_456',
  startTime: new Date(),
  messages: [],
  status: 'active',
  bookingStatus: 'none'
};

const conversationId = await conversationService.saveConversation(conversation);
```

### 2. Menambah Pesan
```javascript
const message = {
  id: 'msg_123',
  role: 'user',
  content: 'Booking ruang meeting besok jam 10:00',
  timestamp: new Date(),
  metadata: {
    intent: 'booking',
    bookingData: { /* extracted data */ }
  }
};

await conversationService.addMessageToConversation('session_123', message);
```

### 3. Ekstrak Data Booking
```javascript
const bookingExtractionService = new BookingExtractionService();
const result = await bookingExtractionService.extractBookingFromConversation('session_123');

console.log('Extracted data:', result.extractedData);
console.log('Confidence:', result.confidence);
console.log('Missing fields:', result.missingFields);
```

### 4. Analisis Percakapan
```javascript
const analysis = await bookingExtractionService.analyzeConversationPatterns();
console.log('Most common topics:', analysis.mostCommonTopics);
console.log('Success rate:', analysis.successRate);
```

## Monitoring dan Maintenance

### 1. Database Monitoring
- Monitor ukuran database
- Check index performance
- Monitor query performance

### 2. Data Cleanup
- Archive old conversations
- Clean up test data
- Optimize storage

### 3. Backup Strategy
- Regular MongoDB backups
- Export conversations to JSON
- Disaster recovery planning

## Troubleshooting

### 1. Connection Issues
- Check MongoDB service status
- Verify connection string
- Check firewall settings

### 2. Performance Issues
- Monitor query performance
- Check index usage
- Optimize queries

### 3. Data Issues
- Verify data integrity
- Check schema validation
- Monitor data growth

## Security Considerations

### 1. Access Control
- MongoDB authentication
- Network security
- API authentication

### 2. Data Privacy
- Encrypt sensitive data
- Implement data retention policies
- GDPR compliance

### 3. Backup Security
- Encrypt backups
- Secure backup storage
- Access control for backups

## Future Enhancements

### 1. Advanced Analytics
- Machine learning insights
- Predictive analytics
- User behavior analysis

### 2. Real-time Features
- WebSocket integration
- Real-time notifications
- Live conversation monitoring

### 3. Integration Features
- Export to other systems
- API webhooks
- Third-party integrations



