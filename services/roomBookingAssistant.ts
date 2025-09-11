// RoomBooking Assistant (RBA) - AI Assistant yang Cerdas dan Proaktif
import { Booking, BookingState, MeetingRoom } from '../types';
import RoomDatabaseService, { RoomRecommendation, Room } from './roomDatabaseService';

interface RBAContext {
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    intent?: string;
    entities?: any;
  }>;
  currentBooking: Partial<Booking>;
  bookingState: BookingState;
  userPreferences: {
    preferredRooms: string[];
    preferredTimes: string[];
    meetingTypes: string[];
    facilityPreferences: string[];
  };
  sessionId: string;
  userId: string;
}

interface RBAResponse {
  message: string;
  action: 'continue' | 'complete' | 'error' | 'clarify' | 'recommend' | 'confirm';
  bookingData?: Partial<Booking>;
  nextState?: BookingState;
  quickActions?: Array<{
    label: string;
    action: string;
    icon?: string;
    type?: 'primary' | 'secondary' | 'danger';
  }>;
  suggestions?: string[];
  recommendations?: {
    rooms: MeetingRoom[];
    reasons: string[];
  };
  notifications?: {
    type: 'confirmation' | 'reminder' | 'change' | 'feedback';
    message: string;
    scheduled?: Date;
  }[];
}

export class RoomBookingAssistant {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  private context: RBAContext;
  private availableRooms: MeetingRoom[] = [];
  private roomDatabaseService: RoomDatabaseService;

  constructor(userId: string, sessionId: string) {
    // Force API key configuration - NO FALLBACK MODE
    this.apiKey = 'AIzaSyChO21CKm9-Ekie02b6d6FVyMrLEV9Vlwg';
    
    console.log('🔑 FORCED API KEY:', this.apiKey.substring(0, 10) + '...');
    console.log('✅ GEMINI_API_KEY configured, RBA will use Gemini API ONLY');
    
    this.context = {
      conversationHistory: [],
      currentBooking: {},
      bookingState: BookingState.IDLE,
      userPreferences: {
        preferredRooms: [],
        preferredTimes: [],
        meetingTypes: ['internal'],
        facilityPreferences: ['tidak']
      },
      sessionId,
      userId
    };
    
    // Initialize room database service
    this.roomDatabaseService = new RoomDatabaseService();
    
    console.log('✅ RBA Initialized with FORCED API Key');
    console.log('🚫 FALLBACK MODE DISABLED - Only Gemini API will be used');
  }

  // Main method to process user input
  public async processInput(userInput: string): Promise<RBAResponse> {
    try {
      // Add user input to conversation history
      this.addToHistory('user', userInput);

      // API key is always available (forced in constructor)
      console.log('RBA: Using Gemini API with key:', this.apiKey.substring(0, 10) + '...');

      // Analyze user intent and extract entities
      const analysis = await this.analyzeUserIntent(userInput);

      // Create comprehensive prompt for RBA
      const prompt = this.buildRBAPrompt(userInput, analysis);

      // Get response from Gemini
      const geminiResponse = await this.callGeminiAPI(prompt);

      // Parse and process the response
      const response = await this.processGeminiResponse(geminiResponse, userInput, analysis);

      // Add AI response to history
      this.addToHistory('assistant', response.message, analysis.intent, analysis.entities);

      // Update user preferences based on interaction
      this.updateUserPreferences(response.bookingData);

      return response;
    } catch (error) {
      console.error('RBA Error:', error);
      throw new Error('Gemini API error - no fallback mode available');
    }
  }

  // Handle quick action clicks
  public async handleQuickAction(action: string, currentBooking: Partial<Booking> = {}): Promise<RBAResponse> {
    try {
      console.log('RBA: Handling quick action:', action);
      
      // Merge current booking data with context
      const mergedBooking = { ...this.context.currentBooking, ...currentBooking };
      
      switch (action) {
        case 'konfirmasi':
          return this.handleConfirmation(mergedBooking);
        case 'proses_pemesanan':
          return this.handleProcessBooking(mergedBooking);
        case 'pilih_ruangan':
          return await this.handleRoomSelection(mergedBooking);
        case 'peserta':
          return this.handleParticipantsInput();
        case 'tanggal':
          return this.handleDateInput();
        case 'waktu':
          return this.handleTimeInput();
        case 'topik':
          return this.handleTopicInput();
        case 'fasilitas':
          return this.handleFacilitiesInput();
        default:
          throw new Error(`Quick action error: ${action} - no fallback mode available`);
      }
    } catch (error) {
      console.error('RBA Quick Action Error:', error);
      throw new Error(`Error handling action: ${action} - no fallback mode available`);
    }
  }

  // Handle booking confirmation
  private handleConfirmation(bookingData: Partial<Booking>): RBAResponse {
    const { participants, date, time, topic, roomName, pic, meetingType, facilities } = bookingData;
    
    // Check if all required fields are present
    if (!participants || !date || !time || !roomName) {
      const missingFields = [];
      if (!participants) missingFields.push('jumlah peserta');
      if (!date) missingFields.push('tanggal');
      if (!time) missingFields.push('waktu');
      if (!roomName) missingFields.push('ruangan');
      
      return {
        message: "❌ **Detail belum lengkap!**\n\nSilakan lengkap informasi berikut:\n" +
                (participants ? "" : "• Jumlah peserta\n") +
                (date ? "" : "• Tanggal\n") +
                (time ? "" : "• Waktu\n") +
                (roomName ? "" : "• Ruangan\n") +
                "\nSetelah lengkap, ketik 'konfirmasi' untuk melanjutkan.",
        action: 'continue',
        bookingData: bookingData,
        quickActions: [],
        suggestions: [
          'Berikan informasi yang diminta',
          'Contoh: "10 orang, besok jam 10, ruangan Samudrantha"',
          'Bantuan dengan pemesanan'
        ]
      };
    }
    
    // Check for optional fields that might be missing - MAKE TOPIC AND PIC REQUIRED
    const missingOptionalFields = [];
    if (!topic || topic.trim() === '') missingOptionalFields.push('topik rapat');
    if (!pic || pic.trim() === '') missingOptionalFields.push('PIC (Penanggung Jawab)');
    if (!meetingType) missingOptionalFields.push('jenis rapat');
    if (!facilities || facilities.length === 0) missingOptionalFields.push('fasilitas');
    
    // If there are missing optional fields, ask for them intelligently
    if (missingOptionalFields.length > 0) {
      let message = "📝 **AI MEMINTA INFORMASI TAMBAHAN**\n\n";
      message += "🧠 **Sebagai AI yang cerdas, saya perlu melengkapi data berikut untuk pemesanan yang sempurna:**\n\n";
      
      missingOptionalFields.forEach((field, index) => {
        if (field.includes('topik') || field.includes('PIC')) {
          message += `${index + 1}. **${field}** ⚠️ (WAJIB)\n`;
        } else {
          message += `${index + 1}. **${field}**\n`;
        }
      });
      
      message += "\n💡 **Cara memberikan informasi:**\n";
      message += "• Berikan semua sekaligus: \"Topik: presentasi client, PIC: Budi, Jenis: internal, Makanan: ringan\"\n";
      message += "• Berikan satu per satu: \"Topik: rapat tim\" lalu \"PIC: Saya\"\n";
      message += "• Lewati dengan default: \"Lewati semua\" atau \"Gunakan default\"\n\n";
      
      message += "🎯 **AI akan membantu Anda:**\n";
      message += "• Memahami konteks dari jawaban Anda\n";
      message += "• Memberikan saran yang tepat\n";
      message += "• Menyesuaikan dengan kebutuhan meeting Anda\n\n";
      
      message += "⚠️ **PENTING:** Topik dan PIC adalah informasi wajib untuk pemesanan yang lengkap!\n\n";
      message += "**Silakan berikan informasi yang diminta:**";
      
      return {
        message: message,
        action: 'continue',
        bookingData: bookingData,
        quickActions: [],
        suggestions: [
          'Berikan informasi yang diminta',
          'Ketik "lewati" untuk menggunakan default',
          'Contoh: "Topik: rapat tim, PIC: Saya"',
          'Bantuan dengan informasi yang dibutuhkan'
        ]
      };
    }
    
    // AI TUGAS: Pastikan topik dan PIC benar-benar ada sebelum konfirmasi
    if (!topic || topic.trim() === '' || !pic || pic.trim() === '') {
      console.log('RBA: Topik atau PIC masih kosong, tidak bisa konfirmasi');
      return {
        message: "❌ **DATA BELUM LENGKAP!**\n\n" +
                "⚠️ **AI tidak dapat melanjutkan konfirmasi karena:**\n" +
                (!topic || topic.trim() === '' ? "• Topik rapat belum diisi\n" : "") +
                (!pic || pic.trim() === '' ? "• PIC (Penanggung Jawab) belum diisi\n" : "") +
                "\n**Silakan berikan informasi yang diminta terlebih dahulu!**",
        action: 'continue',
        bookingData: bookingData,
        suggestions: [
          'Berikan topik rapat',
          'Berikan PIC (Penanggung Jawab)',
          'Contoh: "Topik: presentasi client, PIC: Budi"'
        ]
      };
    }
    
    // All fields are present, show confirmation
    const confirmationMessage = `✅ **KONFIRMASI PEMESANAN RUANGAN**\n\n` +
      `📋 **Detail Pemesanan:**\n` +
      `• **Ruangan:** ${roomName}\n` +
      `• **Tanggal:** ${date}\n` +
      `• **Waktu:** ${time}\n` +
      `• **Peserta:** ${participants} orang\n` +
      `• **Topik:** ${topic}\n` +
      `• **PIC:** ${pic}\n` +
      `• **Jenis Rapat:** ${meetingType || 'Internal'}\n` +
      `• **Fasilitas:** ${facilities && facilities.length > 0 ? facilities.join(', ') : 'Tidak ada'}\n\n` +
      `**Apakah detail di atas sudah benar?**\n\n` +
      `Jika ya, ketik 'ya' untuk memproses pemesanan. Jika ada yang salah, ketik 'ubah' untuk mengubah detail.`;

    return {
      message: confirmationMessage,
      action: 'confirm',
      bookingData: bookingData,
      quickActions: [],
      suggestions: [
        'Ketik "ya" untuk konfirmasi',
        'Ketik "ubah" untuk mengubah detail',
        'Ketik "batal" untuk membatalkan'
      ]
    };
  }

  // Handle additional information input
  private handleAdditionalInfo(bookingData: Partial<Booking>, userInput: string): RBAResponse {
    const lowerInput = userInput.toLowerCase();
    
    // Check if user wants to skip
    if (lowerInput.includes('lewati') || lowerInput.includes('skip') || lowerInput.includes('default') || 
        lowerInput.includes('gak') || lowerInput.includes('tidak') || lowerInput.includes('kosong')) {
      // Set default values for missing fields
      const updatedBooking = {
        ...bookingData,
        topic: bookingData.topic || 'Meeting',
        pic: bookingData.pic || 'Tidak ada',
        meetingType: bookingData.meetingType || 'internal',
        facilities: bookingData.facilities || []
      };
      
      return {
        message: "✅ **AI MENERIMA PERINTAH LEWATI**\n\n" +
                "🧠 **AI telah mengatur nilai default:**\n" +
                "• Topik: Meeting\n" +
                "• PIC: Tidak ada\n" +
                "• Jenis Rapat: Internal\n" +
                "• Makanan: Tidak\n\n" +
                "**Melanjutkan ke konfirmasi...**",
        action: 'continue',
        bookingData: updatedBooking,
        nextState: BookingState.CONFIRMING
      };
    }
    
    // Extract information from user input with AI intelligence
    const extractedInfo = this.extractAdditionalInfoEnhanced(userInput);
    
    // Merge with existing booking data
    const updatedBooking = {
      ...bookingData,
      ...extractedInfo
    };
    
    // Update context with new data
    this.context.currentBooking = updatedBooking;
    
    // Provide intelligent feedback
    const feedback = this.generateIntelligentFeedback(extractedInfo, userInput);
    
    // Check if all data is now complete
    const currentBooking = this.context.currentBooking;
    const stillMissing = [];
    
    if (!currentBooking.topic) stillMissing.push('topik rapat');
    if (!currentBooking.pic) stillMissing.push('PIC');
    if (!currentBooking.meetingType) stillMissing.push('jenis rapat');
    if (!currentBooking.facilities || currentBooking.facilities.length === 0) stillMissing.push('fasilitas');
    
    if (stillMissing.length === 0) {
      // All data complete, proceed to confirmation
      return this.handleConfirmation(updatedBooking);
    } else {
      // Still missing data, continue asking
      return {
        message: feedback,
        action: 'continue',
        bookingData: updatedBooking,
        nextState: BookingState.CONFIRMING
      };
    }
  }
  
  // Check if input is room selection
  private isRoomSelectionInput(input: string): boolean {
    const roomNames = [
      'samudrantha', 'cedaya', 'celebes', 'nusanipa', 
      'balidwipa', 'swarnadwipa', 'jawadwipa'
    ];
    
    const lowerInput = input.toLowerCase();
    return roomNames.some(room => lowerInput.includes(room));
  }
  
  // Check if input is a simple number
  private isSimpleNumber(input: string): boolean {
    const trimmed = input.trim();
    const num = parseInt(trimmed, 10);
    return !isNaN(num) && num >= 1 && num <= 100 && trimmed === num.toString();
  }
  
  // Handle simple number input (likely participants)
  private handleSimpleNumberInput(userInput: string): RBAResponse {
    const num = parseInt(userInput.trim(), 10);
    
    // Update current booking with participants
    const updatedBooking = {
      ...this.context.currentBooking,
      participants: num
    };
    
    // Update context and state
    this.context.currentBooking = updatedBooking;
    this.context.bookingState = BookingState.CONFIRMING;
    
    // Add to conversation history
    this.context.conversationHistory.push({
      role: 'user',
      content: userInput,
      timestamp: new Date()
    });
    
    // Check what information is still needed
    if (!updatedBooking.date) {
      const response = {
        message: `✅ **Jumlah peserta: ${num} orang**\n\nSekarang saya perlu tahu tanggal rapat. Kapan Anda ingin mengadakan rapat?\n\n**Contoh:** "besok", "hari ini", "2024-01-15"`,
        action: 'continue' as const,
        bookingData: updatedBooking,
        quickActions: []
      };
      
      // Add to conversation history
      this.context.conversationHistory.push({
        role: 'assistant',
        content: response.message,
        timestamp: new Date()
      });
      
      return response;
    } else if (!updatedBooking.time) {
      const response = {
        message: `✅ **Jumlah peserta: ${num} orang**\n✅ **Tanggal: ${updatedBooking.date}**\n\nSekarang saya perlu tahu waktu rapat. Jam berapa Anda ingin mengadakan rapat?\n\n**Contoh:** "jam 10", "10:00", "pagi"`,
        action: 'continue' as const,
        bookingData: updatedBooking,
        quickActions: []
      };
      
      // Add to conversation history
      this.context.conversationHistory.push({
        role: 'assistant',
        content: response.message,
        timestamp: new Date()
      });
      
      return response;
    } else {
      // All basic info is complete, show room selection
      return this.handleConfirmation(updatedBooking);
    }
  }
  
  // Handle room selection input
  private async handleRoomSelectionInput(bookingData: Partial<Booking>, userInput: string): Promise<RBAResponse> {
    const lowerInput = userInput.toLowerCase();
    
    // Map room names
    const roomMap: { [key: string]: string } = {
      'samudrantha': 'Samudrantha Meeting Room',
      'cedaya': 'Cedaya Meeting Room',
      'celebes': 'Celebes Meeting Room',
      'nusanipa': 'Nusanipa Meeting Room',
      'balidwipa': 'Balidwipa Meeting Room',
      'swarnadwipa': 'Swarnadwipa Meeting Room',
      'jawadwipa': 'Jawadwipa Meeting Room'
    };
    
    // Find selected room
    let selectedRoom = null;
    for (const [key, value] of Object.entries(roomMap)) {
      if (lowerInput.includes(key)) {
        selectedRoom = value;
        break;
      }
    }
    
    if (selectedRoom) {
      // Update booking data with selected room
      const updatedBooking = {
        ...bookingData,
        roomName: selectedRoom
      };
      
      // Update context
      this.context.currentBooking = updatedBooking;
      
      return {
        message: `✅ **Ruangan Dipilih: ${selectedRoom}**\n\n` +
                `Ruangan telah berhasil dipilih. Sekarang saya akan meminta informasi tambahan untuk melengkapi pemesanan.`,
        action: 'continue',
        bookingData: updatedBooking,
        quickActions: [],
        suggestions: [
          'Lanjutkan dengan informasi tambahan',
          'Ketik "konfirmasi" untuk melanjutkan'
        ]
      };
    } else {
      return {
        message: `❌ **Ruangan tidak ditemukan**\n\n` +
                `Silakan ketik nama ruangan yang benar. Ruangan yang tersedia:\n` +
                `• Samudrantha\n• Cedaya\n• Celebes\n• Nusanipa\n• Balidwipa\n• Swarnadwipa\n• Jawadwipa`,
        action: 'continue',
        bookingData: bookingData,
        quickActions: [],
        suggestions: [
          'Ketik nama ruangan yang benar',
          'Contoh: "Samudrantha" atau "Nusanipa"'
        ]
      };
    }
  }

  // Extract additional information from user input
  private extractAdditionalInfo(input: string): Partial<Booking> {
    const lowerInput = input.toLowerCase();
    const extracted: Partial<Booking> = {};
    
    // Extract topic
    const topicPatterns = [
      /topik[:\s]+(.+?)(?:\s+pic|\s+jenis|\s+makanan|$)/i,
      /judul[:\s]+(.+?)(?:\s+pic|\s+jenis|\s+makanan|$)/i,
      /meeting[:\s]+(.+?)(?:\s+pic|\s+jenis|\s+makanan|$)/i,
      /rapat[:\s]+(.+?)(?:\s+pic|\s+jenis|\s+makanan|$)/i
    ];
    
    for (const pattern of topicPatterns) {
      const match = input.match(pattern);
      if (match) {
        extracted.topic = match[1].trim();
        break;
      }
    }
    
    // Extract PIC
    const picPatterns = [
      /pic[:\s]+(.+?)(?:\s+jenis|\s+makanan|$)/i,
      /penanggung\s+jawab[:\s]+(.+?)(?:\s+jenis|\s+makanan|$)/i,
      /pembicara[:\s]+(.+?)(?:\s+jenis|\s+makanan|$)/i
    ];
    
    for (const pattern of picPatterns) {
      const match = input.match(pattern);
      if (match) {
        extracted.pic = match[1].trim();
        break;
      }
    }
    
    // Extract meeting type
    if (lowerInput.includes('internal') || lowerInput.includes('dalam')) {
      extracted.meetingType = 'internal';
    } else if (lowerInput.includes('external') || lowerInput.includes('luar')) {
      extracted.meetingType = 'external';
    }
    
    // Extract facilities
    const facilityKeywords = {
      'AC': ['ac', 'air conditioning', 'pendingin'],
      'Projector': ['proyektor', 'projector', 'proyeksi'],
      'Sound System': ['sound', 'audio', 'speaker', 'suara'],
      'Whiteboard': ['whiteboard', 'papan tulis', 'papan'],
      'TV': ['tv', 'televisi', 'monitor'],
      'WiFi': ['wifi', 'internet', 'koneksi'],
      'Microphone': ['microphone', 'mic', 'mikrofon'],
      'Camera': ['camera', 'kamera', 'webcam'],
      'Video Conference': ['video conference', 'video call', 'zoom', 'meet'],
      'Coffee Machine': ['coffee', 'kopi', 'mesin kopi'],
      'Water Dispenser': ['water', 'air', 'dispenser'],
      'Printer': ['printer', 'cetak', 'print'],
      'Scanner': ['scanner', 'scan'],
      'Presentation Screen': ['screen', 'layar', 'presentasi'],
      'Laptop Connection': ['laptop', 'koneksi laptop', 'vga', 'hdmi'],
      'Power Outlets': ['power', 'stop kontak', 'outlet'],
      'Air Purifier': ['air purifier', 'pembersih udara'],
      'Blinds/Curtains': ['blinds', 'curtains', 'tirai', 'gorden'],
      'Lighting Control': ['lighting', 'pencahayaan', 'lampu']
    };

    const extractedFacilities: string[] = [];
    for (const [facility, keywords] of Object.entries(facilityKeywords)) {
      if (keywords.some(keyword => lowerInput.includes(keyword))) {
        extractedFacilities.push(facility);
      }
    }
    
    if (extractedFacilities.length > 0) {
      extracted.facilities = extractedFacilities;
    }
    
    return extracted;
  }

  // Handle process booking - final confirmation
  private handleProcessBooking(bookingData: Partial<Booking>): RBAResponse {
    const { participants, date, time, topic, roomName, pic } = bookingData;
    
    // Debug logging
    console.log('RBA: Processing booking with data:', bookingData);
    console.log('RBA: Date extracted:', date);
    
    // AI TUGAS: Validasi data lengkap sebelum pemesanan berhasil
    if (!topic || topic.trim() === '' || !pic || pic.trim() === '') {
      console.log('RBA: Data tidak lengkap, meminta topik dan PIC');
      return this.handleConfirmation(bookingData);
    }
    
    // Generate final confirmation message
    const finalMessage = `🎉 **PEMESANAN BERHASIL DIPROSES!**\n\n` +
      `✅ **Detail Pemesanan:**\n` +
      `🏢 Ruangan: ${roomName || 'Samudrantha Meeting Room'}\n` +
      `👥 Peserta: ${participants} orang\n` +
      `📅 Tanggal: ${date}\n` +
      `⏰ Waktu: ${time}\n` +
      `📋 Topik: ${topic}\n` +
      `👤 PIC: ${pic}\n` +
      `\n**Pemesanan Anda telah berhasil dibuat!**\n` +
      `Anda akan diarahkan ke halaman konfirmasi untuk melihat detail lengkap.`;

    return {
      message: finalMessage,
      action: 'complete',
      bookingData: bookingData,
      quickActions: [],
      suggestions: [
        'Pemesanan berhasil dibuat',
        'Anda akan diarahkan ke halaman konfirmasi',
        'Terima kasih telah menggunakan layanan kami'
      ],
      notifications: [
        {
          type: 'confirmation',
          message: 'Pemesanan berhasil dibuat!',
          scheduled: new Date()
        }
      ]
    };
  }

  // Handle schedule request
  private async handleScheduleRequest(): Promise<RBAResponse> {
    try {
      // Get all rooms from database
      const allRooms = await this.getAvailableRoomsFromDatabase();
      
      if (allRooms.length === 0) {
        return {
          message: "⚠️ **Tidak ada ruangan tersedia** saat ini. Silakan hubungi administrator untuk informasi lebih lanjut.",
          action: 'continue',
          bookingData: {},
          quickActions: [],
          suggestions: [
            'Hubungi administrator',
            'Coba lagi nanti',
            'Mulai pemesanan baru'
          ]
        };
      }
      
      let message = "📅 **JADWAL RUANGAN KOSONG**\n\n";
      message += "Berikut adalah daftar ruangan dan jadwal kosong yang tersedia:\n\n";
      
      // Get current date and next 7 days
      const today = new Date();
      const dates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push(date);
      }
      
      // Generate time slots (9 AM to 5 PM)
      const timeSlots = [
        '09:00', '10:00', '11:00', '12:00', 
        '13:00', '14:00', '15:00', '16:00'
      ];
      
      // Show rooms with their availability
      allRooms.forEach((room, index) => {
        const features = room.features ? JSON.parse(room.features) : [];
        const featuresText = features.length > 0 ? features.join(', ') : 'AC, WiFi';
        
        message += `**${room.room_name}** (${room.capacity} orang)\n`;
        message += `Fasilitas: ${featuresText}\n`;
        message += `Status: ✅ Tersedia\n\n`;
      });
      
      message += `**Jadwal Kosong:**\n`;
      message += `Tanggal: ${dates[0].toLocaleDateString('id-ID')} - ${dates[6].toLocaleDateString('id-ID')}\n`;
      message += `Waktu: ${timeSlots[0]} - ${timeSlots[timeSlots.length - 1]}\n\n`;
      message += `**Cara Pemesanan:**\n`;
      message += `1. Ketik "pesan ruangan" untuk mulai pemesanan\n`;
      message += `2. Berikan detail: jumlah peserta, tanggal, waktu\n`;
      message += `3. Pilih ruangan yang sesuai\n`;
      message += `4. Konfirmasi pemesanan\n\n`;
      message += `**Contoh:** "Saya butuh ruangan untuk 10 orang besok jam 10"`;
      
      return {
        message,
        action: 'continue',
        bookingData: {},
        quickActions: [],
        suggestions: [
          'Pesan ruangan sekarang',
          'Lihat detail ruangan',
          'Cek ketersediaan ruangan',
          'Mulai pemesanan baru'
        ]
      };
      
    } catch (error) {
      console.error('RBA Schedule Request Error:', error);
      return {
        message: "❌ **Error mengambil jadwal**\n\nMaaf, terjadi kesalahan dalam mengambil jadwal ruangan. Silakan coba lagi atau hubungi administrator.",
        action: 'continue',
        bookingData: {},
        quickActions: [],
        suggestions: [
          'Coba lagi',
          'Hubungi administrator',
          'Mulai pemesanan baru'
        ]
      };
    }
  }

  // Handle room selection
  private async handleRoomSelection(bookingData: Partial<Booking>): Promise<RBAResponse> {
    const { participants } = bookingData;
    
    let message = "🏢 **PILIH RUANGAN**\n\n";
    
    try {
      // Get available rooms from database
      const availableRooms = await this.getAvailableRoomsFromDatabase();
      
      if (availableRooms.length > 0) {
        if (participants) {
          message += `Untuk ${participants} orang, saya rekomendasikan:\n\n`;
        }
        
        message += `**Ruangan Tersedia:**\n`;
        
        // Filter rooms by capacity if participants specified
        const suitableRooms = participants 
          ? availableRooms.filter(room => room.capacity >= participants)
          : availableRooms;
        
        // Sort by capacity
        suitableRooms.sort((a, b) => a.capacity - b.capacity);
        
        suitableRooms.forEach((room, index) => {
          const features = room.features ? JSON.parse(room.features) : [];
          const featuresText = features.length > 0 ? features.join(', ') : 'AC, WiFi';
          
          message += `• **${room.room_name}** (${room.capacity} orang) - ${featuresText}\n`;
        });
        
        message += `\nSilakan ketik nama ruangan yang ingin Anda pilih.\n\n`;
        message += `**Contoh:** "Samudrantha" atau "Nusanipa"`;
        
        return {
          message,
          action: 'continue',
          bookingData: bookingData,
          quickActions: [],
          suggestions: [
            'Ketik nama ruangan yang ingin dipilih',
            'Contoh: "Samudrantha" atau "Nusanipa"',
            'Lihat detail fasilitas ruangan'
          ]
        };
      } else {
        message += "⚠️ **Tidak ada ruangan tersedia** saat ini. Silakan coba lagi nanti atau hubungi administrator.";
        
        return {
          message,
          action: 'continue',
          bookingData: bookingData,
          quickActions: [
            { label: '🔄 Refresh', action: 'pilih_ruangan', icon: '🔄', type: 'secondary' },
            { label: '📞 Hubungi Admin', action: 'hubungi_admin', icon: '📞', type: 'secondary' }
          ],
          suggestions: [
            'Coba lagi nanti',
            'Hubungi administrator',
            'Kembali ke pemesanan'
          ]
        };
      }
    } catch (error) {
      console.error('Error getting rooms from database:', error);
      
      // Fallback to hardcoded rooms
      message += `**Ruangan Tersedia:**\n` +
        `• **Samudrantha** (10 orang) - Proyektor, AC, WiFi\n` +
        `• **Cedaya** (8 orang) - Papan tulis, AC, Sound system\n` +
        `• **Celebes** (6 orang) - Video conference, AC\n` +
        `• **Nusanipa** (12 orang) - Proyektor, Papan tulis, AC\n` +
        `• **Balidwipa** (15 orang) - Proyektor, Sound system, AC\n` +
        `• **Swarnadwipa** (20 orang) - Proyektor, Papan tulis, Sound system, AC\n` +
        `• **Jawadwipa** (25 orang) - Proyektor, Papan tulis, Sound system, Video conference, AC\n\n` +
        `Silakan pilih ruangan yang sesuai:`;

      return {
        message,
        action: 'continue',
        bookingData: bookingData,
        quickActions: [
          { label: 'Samudrantha (10 orang)', action: 'pilih_samudrantha', icon: '🏢', type: 'primary' },
          { label: 'Cedaya (8 orang)', action: 'pilih_cedaya', icon: '🏢', type: 'primary' },
          { label: 'Celebes (6 orang)', action: 'pilih_celebes', icon: '🏢', type: 'primary' },
          { label: 'Nusanipa (12 orang)', action: 'pilih_nusanipa', icon: '🏢', type: 'primary' },
          { label: 'Balidwipa (15 orang)', action: 'pilih_balidwipa', icon: '🏢', type: 'primary' },
          { label: 'Swarnadwipa (20 orang)', action: 'pilih_swarnadwipa', icon: '🏢', type: 'primary' },
          { label: 'Jawadwipa (25 orang)', action: 'pilih_jawadwipa', icon: '🏢', type: 'primary' }
        ],
        suggestions: [
          'Pilih ruangan berdasarkan kapasitas',
          'Lihat detail fasilitas ruangan',
          'Kembali ke pemesanan'
        ]
      };
    }
  }

  // Handle participants input
  private handleParticipantsInput(): RBAResponse {
    return {
      message: "👥 **JUMLAH PESERTA**\n\nBerapa jumlah peserta yang akan menghadiri meeting?\n\nAnda bisa mengetik jumlah peserta atau menggunakan opsi di bawah:",
      action: 'continue',
      quickActions: [
        { label: '2-4 orang', action: 'peserta_2_4', icon: '👥', type: 'secondary' },
        { label: '5-8 orang', action: 'peserta_5_8', icon: '👥', type: 'secondary' },
        { label: '9-12 orang', action: 'peserta_9_12', icon: '👥', type: 'secondary' },
        { label: '13-20 orang', action: 'peserta_13_20', icon: '👥', type: 'secondary' },
        { label: '20+ orang', action: 'peserta_20_plus', icon: '👥', type: 'secondary' }
      ],
      suggestions: [
        'Ketik jumlah peserta (contoh: 8 orang)',
        'Pilih range peserta',
        'Kembali ke pemesanan'
      ]
    };
  }

  // Handle date input
  private handleDateInput(): RBAResponse {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);
    
    return {
      message: "📅 **PILIH TANGGAL**\n\nKapan meeting akan dilaksanakan?\n\nAnda bisa mengetik tanggal atau menggunakan opsi di bawah:",
      action: 'continue',
      quickActions: [
        { label: `Hari ini (${today.toLocaleDateString('id-ID')})`, action: 'tanggal_hari_ini', icon: '📅', type: 'secondary' },
        { label: `Besok (${tomorrow.toLocaleDateString('id-ID')})`, action: 'tanggal_besok', icon: '📅', type: 'secondary' },
        { label: `Lusa (${dayAfter.toLocaleDateString('id-ID')})`, action: 'tanggal_lusa', icon: '📅', type: 'secondary' },
        { label: 'Minggu depan', action: 'tanggal_minggu_depan', icon: '📅', type: 'secondary' }
      ],
      suggestions: [
        'Ketik tanggal (contoh: 15 Januari 2025)',
        'Pilih dari opsi yang tersedia',
        'Kembali ke pemesanan'
      ]
    };
  }

  // Handle time input
  private handleTimeInput(): RBAResponse {
    return {
      message: "⏰ **PILIH WAKTU**\n\nJam berapa meeting akan dimulai?\n\nAnda bisa mengetik waktu atau menggunakan opsi di bawah:",
      action: 'continue',
      quickActions: [
        { label: '08:00', action: 'waktu_08_00', icon: '⏰', type: 'secondary' },
        { label: '09:00', action: 'waktu_09_00', icon: '⏰', type: 'secondary' },
        { label: '10:00', action: 'waktu_10_00', icon: '⏰', type: 'secondary' },
        { label: '11:00', action: 'waktu_11_00', icon: '⏰', type: 'secondary' },
        { label: '13:00', action: 'waktu_13_00', icon: '⏰', type: 'secondary' },
        { label: '14:00', action: 'waktu_14_00', icon: '⏰', type: 'secondary' },
        { label: '15:00', action: 'waktu_15_00', icon: '⏰', type: 'secondary' },
        { label: '16:00', action: 'waktu_16_00', icon: '⏰', type: 'secondary' }
      ],
      suggestions: [
        'Ketik waktu (contoh: 10:00 atau 2 siang)',
        'Pilih dari opsi yang tersedia',
        'Kembali ke pemesanan'
      ]
    };
  }

  // Handle topic input
  private handleTopicInput(): RBAResponse {
    return {
      message: "📋 **TOPIK MEETING**\n\nApa topik atau judul meeting yang akan dilaksanakan?\n\nIni opsional, tetapi akan membantu dalam pemilihan ruangan yang sesuai.",
      action: 'continue',
      quickActions: [
        { label: 'Rapat Tim', action: 'topik_rapat_tim', icon: '📋', type: 'secondary' },
        { label: 'Presentasi Client', action: 'topik_presentasi_client', icon: '📋', type: 'secondary' },
        { label: 'Brainstorming', action: 'topik_brainstorming', icon: '📋', type: 'secondary' },
        { label: 'Training', action: 'topik_training', icon: '📋', type: 'secondary' },
        { label: 'Review Project', action: 'topik_review_project', icon: '📋', type: 'secondary' }
      ],
      suggestions: [
        'Ketik topik meeting',
        'Pilih dari opsi yang tersedia',
        'Lewati (opsional)',
        'Kembali ke pemesanan'
      ]
    };
  }

  // Handle facilities input
  private handleFacilitiesInput(): RBAResponse {
    return {
      message: "🔧 **FASILITAS YANG DIBUTUHKAN**\n\nFasilitas apa saja yang diperlukan untuk meeting?\n\nPilih semua yang dibutuhkan:",
      action: 'continue',
      quickActions: [
        { label: 'Proyektor', action: 'fasilitas_proyektor', icon: '🔧', type: 'secondary' },
        { label: 'Papan Tulis', action: 'fasilitas_papan_tulis', icon: '🔧', type: 'secondary' },
        { label: 'Sound System', action: 'fasilitas_sound_system', icon: '🔧', type: 'secondary' },
        { label: 'Video Conference', action: 'fasilitas_video_conference', icon: '🔧', type: 'secondary' },
        { label: 'AC', action: 'fasilitas_ac', icon: '🔧', type: 'secondary' },
        { label: 'WiFi', action: 'fasilitas_wifi', icon: '🔧', type: 'secondary' }
      ],
      suggestions: [
        'Pilih fasilitas yang dibutuhkan',
        'Lewati (opsional)',
        'Kembali ke pemesanan'
      ]
    };
  }

  // Universal fallback response that can think and adapt to any user input
  // Fallback mode removed - only Gemini API is used

  // Universal user input analysis with enhanced intelligence
  private analyzeUserInputUniversal(userInput: string): {
    intent: string;
    confidence: number;
    entities: any;
    sentiment: string;
    urgency: string;
    complexity: string;
    context: string;
    language: string;
    emotion: string;
    action: string;
  } {
    const lowerInput = userInput.toLowerCase();
    const trimmedInput = userInput.trim();
    
    // Enhanced intent detection with higher accuracy
    let intent = 'general_inquiry';
    let confidence = 0.5;
    let context = 'general';
    let language = 'indonesian';
    let emotion = 'neutral';
    let action = 'none';
    
    // Language detection
    if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('good morning') || 
        lowerInput.includes('good afternoon') || lowerInput.includes('good evening')) {
      language = 'english';
    }
    
    // Emotion detection
    if (lowerInput.includes('senang') || lowerInput.includes('happy') || lowerInput.includes('bagus') || 
        lowerInput.includes('mantap') || lowerInput.includes('keren')) {
      emotion = 'positive';
    } else if (lowerInput.includes('kesal') || lowerInput.includes('frustrated') || lowerInput.includes('bingung') || 
               lowerInput.includes('confused') || lowerInput.includes('stres')) {
      emotion = 'negative';
    } else if (lowerInput.includes('terima kasih') || lowerInput.includes('thanks') || lowerInput.includes('makasih')) {
      emotion = 'grateful';
    }
    
    // Enhanced booking related intents
    const bookingKeywords = ['pesan', 'booking', 'reservasi', 'ruang', 'meeting', 'rapat', 'book', 'reserve', 'schedule'];
    const cancelKeywords = ['batal', 'cancel', 'hapus', 'delete', 'remove', 'stop'];
    const modifyKeywords = ['ubah', 'modify', 'edit', 'ganti', 'update', 'change', 'revisi'];
    const viewKeywords = ['lihat', 'show', 'tampilkan', 'list', 'daftar', 'display', 'view'];
    const scheduleKeywords = ['jadwal', 'schedule', 'waktu', 'kapan', 'ketersediaan', 'availability', 'time'];
    const helpKeywords = ['bantuan', 'help', 'tolong', 'cara', 'gimana', 'how', 'what', 'where', 'when'];
    const infoKeywords = ['info', 'informasi', 'detail', 'fasilitas', 'kapasitas', 'capacity', 'facilities'];
    
    // Intent detection with multiple keyword matching
    const bookingScore = bookingKeywords.reduce((score, keyword) => 
      score + (lowerInput.includes(keyword) ? 1 : 0), 0);
    const cancelScore = cancelKeywords.reduce((score, keyword) => 
      score + (lowerInput.includes(keyword) ? 1 : 0), 0);
    const modifyScore = modifyKeywords.reduce((score, keyword) => 
      score + (lowerInput.includes(keyword) ? 1 : 0), 0);
    const viewScore = viewKeywords.reduce((score, keyword) => 
      score + (lowerInput.includes(keyword) ? 1 : 0), 0);
    const scheduleScore = scheduleKeywords.reduce((score, keyword) => 
      score + (lowerInput.includes(keyword) ? 1 : 0), 0);
    const helpScore = helpKeywords.reduce((score, keyword) => 
      score + (lowerInput.includes(keyword) ? 1 : 0), 0);
    const infoScore = infoKeywords.reduce((score, keyword) => 
      score + (lowerInput.includes(keyword) ? 1 : 0), 0);
    
    // Determine intent based on highest score
    const scores = [
      { intent: 'book_room', score: bookingScore },
      { intent: 'cancel_booking', score: cancelScore },
      { intent: 'modify_booking', score: modifyScore },
      { intent: 'view_rooms', score: viewScore },
      { intent: 'check_schedule', score: scheduleScore },
      { intent: 'help_request', score: helpScore },
      { intent: 'room_info', score: infoScore }
    ];
    
    const maxScore = Math.max(...scores.map(s => s.score));
    if (maxScore > 0) {
      const topIntent = scores.find(s => s.score === maxScore);
      intent = topIntent.intent;
      confidence = Math.min(0.9, 0.5 + (maxScore * 0.1));
    }
    
    // Context detection
    if (lowerInput.includes('besok') || lowerInput.includes('tomorrow') || lowerInput.includes('hari ini') || 
        lowerInput.includes('today') || lowerInput.includes('lusa')) {
      context = 'time_specific';
    } else if (lowerInput.includes('urgent') || lowerInput.includes('segera') || lowerInput.includes('cepat')) {
      context = 'urgent';
    } else if (lowerInput.includes('presentasi') || lowerInput.includes('presentation') || 
               lowerInput.includes('client') || lowerInput.includes('klien')) {
      context = 'presentation';
    } else if (lowerInput.includes('brainstorming') || lowerInput.includes('diskusi') || 
               lowerInput.includes('discussion') || lowerInput.includes('rapat tim')) {
      context = 'discussion';
    }
    
    // Action detection
    if (lowerInput.includes('buat') || lowerInput.includes('create') || lowerInput.includes('new')) {
      action = 'create';
    } else if (lowerInput.includes('cari') || lowerInput.includes('find') || lowerInput.includes('search')) {
      action = 'search';
    } else if (lowerInput.includes('cek') || lowerInput.includes('check') || lowerInput.includes('verify')) {
      action = 'check';
    } else if (lowerInput.includes('konfirmasi') || lowerInput.includes('confirm') || lowerInput.includes('ya')) {
      action = 'confirm';
    }

    // Enhanced sentiment analysis
    let sentiment = 'neutral';
    const positiveWords = ['bagus', 'baik', 'senang', 'happy', 'mantap', 'keren', 'terima kasih', 'thanks'];
    const negativeWords = ['buruk', 'jelek', 'kesal', 'frustrated', 'bingung', 'confused', 'error', 'masalah'];
    
    const positiveScore = positiveWords.reduce((score, word) => 
      score + (lowerInput.includes(word) ? 1 : 0), 0);
    const negativeScore = negativeWords.reduce((score, word) => 
      score + (lowerInput.includes(word) ? 1 : 0), 0);
    
    if (positiveScore > negativeScore) {
      sentiment = 'positive';
    } else if (negativeScore > positiveScore) {
      sentiment = 'negative';
    }

    // Enhanced urgency detection
    let urgency = 'normal';
    const urgentWords = ['segera', 'urgent', 'cepat', 'sekarang', 'hari ini', 'besok', 'asap'];
    const lowUrgencyWords = ['nanti', 'lain kali', 'minggu depan', 'next week', 'later'];
    
    const urgentScore = urgentWords.reduce((score, word) => 
      score + (lowerInput.includes(word) ? 1 : 0), 0);
    const lowUrgencyScore = lowUrgencyWords.reduce((score, word) => 
      score + (lowerInput.includes(word) ? 1 : 0), 0);
    
    if (urgentScore > 0) {
      urgency = 'high';
    } else if (lowUrgencyScore > 0) {
      urgency = 'low';
    }

    // Enhanced complexity detection
    let complexity = 'simple';
    const complexIndicators = ['dan', 'atau', 'juga', 'serta', 'plus', 'tambah', 'dengan', 'untuk', 'agar'];
    const complexScore = complexIndicators.reduce((score, indicator) => 
      score + (lowerInput.includes(indicator) ? 1 : 0), 0);
    
    if (complexScore > 2 || trimmedInput.length > 50) {
      complexity = 'complex';
    } else if (complexScore > 0 || trimmedInput.length > 20) {
      complexity = 'medium';
    }

    // Extract entities with enhanced intelligence
    const entities = this.extractBookingInfoEnhanced(userInput);

    return {
      intent,
      confidence,
      entities,
      sentiment,
      urgency,
      complexity,
      context,
      language,
      emotion,
      action
    };
  }

  // Extract comprehensive booking information
  private extractBookingInfo(userInput: string): any {
    const lowerInput = userInput.toLowerCase();
    
    return {
      participants: this.extractParticipants(lowerInput),
      date: this.extractDate(lowerInput),
      time: this.extractTime(lowerInput),
      endTime: this.extractEndTime(lowerInput),
      roomType: this.extractRoomType(lowerInput),
      meetingType: this.extractMeetingType(lowerInput),
      facilities: this.extractFacilities(lowerInput),
      topic: this.extractTopic(userInput),
      urgency: this.extractUrgency(lowerInput),
      duration: this.extractDuration(lowerInput)
    };
  }

  // Enhanced booking information extraction with AI intelligence
  private extractBookingInfoEnhanced(userInput: string): any {
    const lowerInput = userInput.toLowerCase();
    const originalInput = userInput;
    
    // Enhanced participant extraction
    const participants = this.extractParticipantsEnhanced(lowerInput);
    
    // Enhanced date extraction
    const date = this.extractDateEnhanced(lowerInput);
    
    // Enhanced time extraction
    const time = this.extractTimeEnhanced(lowerInput);
    
    // Enhanced topic extraction
    const topic = this.extractTopicEnhanced(originalInput);
    
    // Enhanced room type extraction
    const roomType = this.extractRoomTypeEnhanced(lowerInput);
    
    // Enhanced meeting type extraction
    const meetingType = this.extractMeetingTypeEnhanced(lowerInput);
    
    // Enhanced facilities extraction
    const facilities = this.extractFacilitiesEnhanced(lowerInput);
    
    // Extract additional context
    const context = this.extractContextInfo(lowerInput);
    
    return {
      participants,
      date,
      time,
      endTime: this.extractEndTime(lowerInput),
      roomType,
      meetingType,
      facilities,
      topic,
      urgency: this.extractUrgency(lowerInput),
      duration: this.extractDuration(lowerInput),
      context,
      priority: this.extractPriority(lowerInput),
      budget: this.extractBudget(lowerInput),
      requirements: this.extractRequirements(lowerInput)
    };
  }

  // Enhanced participant extraction
  private extractParticipantsEnhanced(input: string): number | null {
    const patterns = [
      /(\d+)\s*orang/,
      /(\d+)\s*peserta/,
      /untuk\s*(\d+)/,
      /(\d+)\s*people/,
      /capacity\s*(\d+)/,
      /^(\d+)$/,
      /^(\d+)\s*$/,
      /(\d+)\s*$/,
      /(\d+)\s*person/,
      /(\d+)\s*attendee/,
      /(\d+)\s*participant/,
      /team\s*of\s*(\d+)/,
      /group\s*of\s*(\d+)/,
      /(\d+)\s*member/,
      /(\d+)\s*staff/
    ];
    
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= 1 && num <= 100) {
          return num;
        }
      }
    }
    return null;
  }

  // Enhanced date extraction
  private extractDateEnhanced(input: string): string | null {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);
    
    // Relative dates
    if (input.includes('besok') || input.includes('tomorrow')) {
      return tomorrow.toISOString().split('T')[0];
    } else if (input.includes('hari ini') || input.includes('today')) {
      return today.toISOString().split('T')[0];
    } else if (input.includes('lusa') || input.includes('day after tomorrow')) {
      return dayAfter.toISOString().split('T')[0];
    } else if (input.includes('minggu depan') || input.includes('next week')) {
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek.toISOString().split('T')[0];
    }
    
    // Specific date patterns
    const datePatterns = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
      /(\d{4})-(\d{1,2})-(\d{1,2})/,
      /(\d{1,2})-(\d{1,2})-(\d{4})/,
      /(\d{1,2})\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+(\d{4})/i,
      /(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+(\d{1,2}),?\s+(\d{4})/i
    ];
    
    for (const pattern of datePatterns) {
      const match = input.match(pattern);
      if (match) {
        const [, part1, part2, part3] = match;
        if (part3 && part3.length === 4) {
          return `${part3}-${part2.padStart(2, '0')}-${part1.padStart(2, '0')}`;
        }
      }
    }
    
    return null;
  }

  // Enhanced time extraction
  private extractTimeEnhanced(input: string): string | null {
    const timePatterns = [
      /(\d{1,2}):(\d{2})/,
      /(\d{1,2})\.(\d{2})/,
      /jam\s*(\d{1,2}):(\d{2})/,
      /pukul\s*(\d{1,2}):(\d{2})/,
      /at\s*(\d{1,2}):(\d{2})/,
      /(\d{1,2})\s*am/,
      /(\d{1,2})\s*pm/,
      /(\d{1,2})\s*siang/,
      /(\d{1,2})\s*malam/
    ];
    
    for (const pattern of timePatterns) {
      const match = input.match(pattern);
      if (match) {
        let [, hour, minute] = match;
        if (!minute) minute = '00';
        
        // Handle AM/PM
        if (input.includes('pm') && parseInt(hour) < 12) {
          hour = (parseInt(hour) + 12).toString();
        } else if (input.includes('am') && parseInt(hour) === 12) {
          hour = '00';
        }
        
        return `${hour.padStart(2, '0')}:${minute}`;
      }
    }
    
    // Handle time descriptions
    const timeDescriptions = {
      'pagi': '09:00',
      'morning': '09:00',
      'siang': '12:00',
      'noon': '12:00',
      'sore': '15:00',
      'afternoon': '15:00',
      'malam': '19:00',
      'evening': '19:00'
    };
    
    for (const [desc, time] of Object.entries(timeDescriptions)) {
      if (input.includes(desc)) {
        return time;
      }
    }
    
    return null;
  }

  // Enhanced topic extraction
  private extractTopicEnhanced(input: string): string | null {
    const topicPatterns = [
      /presentasi\s+([a-zA-Z\s]+?)(?:\s+untuk|\s+besok|\s+hari ini|\s+jam|\s+\d+\s+orang|$)/i,
      /rapat\s+([a-zA-Z\s]+?)(?:\s+untuk|\s+besok|\s+hari ini|\s+jam|\s+\d+\s+orang|$)/i,
      /meeting\s+([a-zA-Z\s]+?)(?:\s+untuk|\s+besok|\s+hari ini|\s+jam|\s+\d+\s+orang|$)/i,
      /brainstorming\s+([a-zA-Z\s]+?)(?:\s+untuk|\s+besok|\s+hari ini|\s+jam|\s+\d+\s+orang|$)/i,
      /untuk\s+([a-zA-Z\s]+?)(?:\s+besok|\s+hari ini|\s+jam|\s+\d+\s+orang|$)/i,
      /tentang\s+([a-zA-Z\s]+?)(?:\s+besok|\s+hari ini|\s+jam|\s+\d+\s+orang|$)/i,
      /topik\s*[:\s]+(.+?)(?:\s+pic|\s+jenis|\s+makanan|$)/i,
      /judul\s*[:\s]+(.+?)(?:\s+pic|\s+jenis|\s+makanan|$)/i
    ];
    
    for (const pattern of topicPatterns) {
      const match = input.match(pattern);
      if (match) {
        let topic = match[1].trim();
        topic = topic.replace(/\b(untuk|dengan|oleh|dari|ke|di|pada|jam|orang|besok|hari ini|lusa)\b/g, '').trim();
        topic = topic.replace(/\s+/g, ' ').trim();
        
        if (topic.length > 2) {
          return topic;
        }
      }
    }
    
    return null;
  }

  // Enhanced room type extraction
  private extractRoomTypeEnhanced(input: string): string | null {
    const roomTypes = {
      'besar': 'large',
      'large': 'large',
      'kecil': 'small',
      'small': 'small',
      'conference': 'conference',
      'konferensi': 'conference',
      'meeting': 'meeting',
      'rapat': 'meeting',
      'presentasi': 'presentation',
      'presentation': 'presentation',
      'auditorium': 'auditorium',
      'training': 'training',
      'pelatihan': 'training'
    };
    
    for (const [keyword, type] of Object.entries(roomTypes)) {
      if (input.includes(keyword)) {
        return type;
      }
    }
    
    return null;
  }

  // Enhanced meeting type extraction
  private extractMeetingTypeEnhanced(input: string): string | null {
    if (input.includes('internal') || input.includes('dalam')) {
      return 'internal';
    } else if (input.includes('external') || input.includes('luar') || input.includes('client') || input.includes('klien')) {
      return 'external';
    } else if (input.includes('public') || input.includes('umum')) {
      return 'public';
    }
    
    return null;
  }

  // Enhanced facilities extraction
  private extractFacilitiesEnhanced(input: string): string[] {
    const facilities = [];
    const facilityMap = {
      'proyektor': 'proyektor',
      'projector': 'proyektor',
      'papan tulis': 'papan tulis',
      'whiteboard': 'papan tulis',
      'ac': 'AC',
      'air conditioner': 'AC',
      'sound': 'sound system',
      'audio': 'sound system',
      'video': 'video conference',
      'conference': 'video conference',
      'wifi': 'WiFi',
      'internet': 'WiFi',
      'screen': 'layar',
      'layar': 'layar',
      'microphone': 'mikrofon',
      'mikrofon': 'mikrofon'
    };
    
    for (const [keyword, facility] of Object.entries(facilityMap)) {
      if (input.includes(keyword)) {
        facilities.push(facility);
      }
    }
    
    return facilities;
  }

  // Enhanced food order extraction
  private extractFoodOrderEnhanced(input: string): string | null {
    if (input.includes('makanan ringan') || input.includes('snack') || input.includes('kudapan')) {
      return 'ringan';
    } else if (input.includes('makanan berat') || input.includes('lunch') || input.includes('makan siang') || input.includes('makan malam')) {
      return 'berat';
    } else if (input.includes('tidak') || input.includes('no') || input.includes('skip') || input.includes('tidak perlu')) {
      return 'tidak';
    } else if (input.includes('coffee') || input.includes('kopi') || input.includes('minuman')) {
      return 'minuman';
    }
    
    return null;
  }

  // Extract context information
  private extractContextInfo(input: string): any {
    return {
      isUrgent: input.includes('urgent') || input.includes('segera') || input.includes('cepat'),
      isClientMeeting: input.includes('client') || input.includes('klien') || input.includes('presentasi'),
      isTeamMeeting: input.includes('tim') || input.includes('team') || input.includes('internal'),
      isTraining: input.includes('training') || input.includes('pelatihan') || input.includes('workshop'),
      isReview: input.includes('review') || input.includes('evaluasi') || input.includes('assessment')
    };
  }

  // Extract priority level
  private extractPriority(input: string): string {
    if (input.includes('urgent') || input.includes('segera') || input.includes('prioritas tinggi')) {
      return 'high';
    } else if (input.includes('normal') || input.includes('biasa')) {
      return 'normal';
    } else if (input.includes('low') || input.includes('rendah')) {
      return 'low';
    }
    return 'normal';
  }

  // Extract budget information
  private extractBudget(input: string): string | null {
    const budgetPatterns = [
      /budget\s*[:\s]*(\d+)/i,
      /anggaran\s*[:\s]*(\d+)/i,
      /biaya\s*[:\s]*(\d+)/i,
      /cost\s*[:\s]*(\d+)/i
    ];
    
    for (const pattern of budgetPatterns) {
      const match = input.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  }

  // Extract special requirements
  private extractRequirements(input: string): string[] {
    const requirements = [];
    
    if (input.includes('aksesibilitas') || input.includes('wheelchair') || input.includes('disabled')) {
      requirements.push('aksesibilitas');
    }
    if (input.includes('privacy') || input.includes('privasi') || input.includes('rahasia')) {
      requirements.push('privasi');
    }
    if (input.includes('recording') || input.includes('rekaman') || input.includes('record')) {
      requirements.push('rekaman');
    }
    if (input.includes('streaming') || input.includes('live') || input.includes('broadcast')) {
      requirements.push('streaming');
    }
    
    return requirements;
  }

  // Extract end time
  private extractEndTime(input: string): string | null {
    const patterns = [
      /sampai\s*(\d{1,2}):(\d{2})/,
      /hingga\s*(\d{1,2}):(\d{2})/,
      /selesai\s*(\d{1,2}):(\d{2})/,
      /finish\s*(\d{1,2}):(\d{2})/,
      /(\d{1,2}):(\d{2})\s*sampai\s*(\d{1,2}):(\d{2})/
    ];
    
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        if (match[3]) { // Format: 10:00 sampai 12:00
          return `${match[3].padStart(2, '0')}:${match[4]}`;
        } else { // Format: sampai 12:00
          return `${match[1].padStart(2, '0')}:${match[2]}`;
        }
      }
    }
    
    return null;
  }

  // Extract urgency
  private extractUrgency(input: string): string {
    if (input.includes('segera') || input.includes('urgent') || input.includes('cepat')) {
      return 'high';
    } else if (input.includes('nanti') || input.includes('lain kali')) {
      return 'low';
    }
    return 'normal';
  }

  // Extract facilities
  private extractFacilities(input: string): string[] {
    const facilities = [];
    if (input.includes('proyektor') || input.includes('projector')) facilities.push('proyektor');
    if (input.includes('papan tulis') || input.includes('whiteboard')) facilities.push('papan tulis');
    if (input.includes('ac') || input.includes('air conditioner')) facilities.push('AC');
    if (input.includes('sound') || input.includes('audio')) facilities.push('sound system');
    if (input.includes('video') || input.includes('conference')) facilities.push('video conference');
    if (input.includes('wifi') || input.includes('internet')) facilities.push('WiFi');
    return facilities;
  }

  // Extract duration
  private extractDuration(input: string): number | null {
    const patterns = [
      /(\d+)\s*jam/,
      /(\d+)\s*hour/,
      /selama\s*(\d+)/,
      /duration\s*(\d+)/
    ];
    
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
    
    return null;
  }

  // Generate intelligent response based on analysis
  private async generateIntelligentResponse(analysis: any, extractedInfo: any, userInput: string): Promise<RBAResponse> {
    const { intent, confidence, sentiment, urgency, complexity } = analysis;
    
    // Check if we're in the middle of collecting additional information
    if (this.context.bookingState === BookingState.CONFIRMING && 
        (userInput.toLowerCase().includes('topik') || 
         userInput.toLowerCase().includes('pic') || 
         userInput.toLowerCase().includes('jenis') || 
         userInput.toLowerCase().includes('makanan') ||
         userInput.toLowerCase().includes('lewati'))) {
      return this.handleAdditionalInfo(this.context.currentBooking, userInput);
    }
    
    // Check for confirmation commands
    if (userInput.toLowerCase().includes('konfirmasi') || 
        userInput.toLowerCase().includes('ya') || 
        userInput.toLowerCase().includes('benar') ||
        userInput.toLowerCase().includes('setuju')) {
      // AI TUGAS: Pastikan semua data termasuk topik dan PIC ada sebelum pemesanan
      if (this.context.currentBooking.participants && 
          this.context.currentBooking.date && 
          this.context.currentBooking.time && 
          this.context.currentBooking.roomName &&
          this.context.currentBooking.topic && 
          this.context.currentBooking.topic.trim() !== '' &&
          this.context.currentBooking.pic && 
          this.context.currentBooking.pic.trim() !== '') {
        console.log('RBA: Semua data lengkap, memproses pemesanan');
        return this.handleProcessBooking(this.context.currentBooking);
      } else {
        console.log('RBA: Data belum lengkap, meminta konfirmasi');
        return this.handleConfirmation(this.context.currentBooking);
      }
    }
    
    // Check for room selection
    if (this.context.bookingState === BookingState.CONFIRMING && 
        this.isRoomSelectionInput(userInput)) {
      return await this.handleRoomSelectionInput(this.context.currentBooking, userInput);
    }
    
    // Check for schedule request
    if (userInput.toLowerCase().includes('jadwal') || 
        userInput.toLowerCase().includes('schedule') ||
        userInput.toLowerCase().includes('lihat jadwal')) {
      return await this.handleScheduleRequest();
    }
    
    // Check if user is providing a simple number (likely participants)
    if (this.isSimpleNumber(userInput)) {
      return this.handleSimpleNumberInput(userInput);
    }
    
    // Handle different intents with intelligent responses
    switch (intent) {
      case 'book_room':
        return await this.handleBookingIntent(extractedInfo, urgency, complexity);
      case 'cancel_booking':
        return this.handleCancelIntent(sentiment);
      case 'modify_booking':
        return this.handleModifyIntent(extractedInfo);
      case 'view_rooms':
        return this.handleViewRoomsIntent(extractedInfo);
      case 'check_schedule':
        return this.handleScheduleIntent(extractedInfo);
      case 'room_info':
        return this.handleRoomInfoIntent(extractedInfo);
      case 'help_request':
        return this.handleHelpIntent(complexity);
      default:
        return this.handleGeneralIntent(userInput, extractedInfo, sentiment);
    }
  }

  // Handle booking intent
  private async handleBookingIntent(extractedInfo: any, urgency: string, complexity: string): Promise<RBAResponse> {
    const { participants, date, time, topic, facilities } = extractedInfo;
    
    let message = "Baik! Saya akan membantu Anda memesan ruangan. ";
    
    // Check if we have any booking information
    const hasAnyInfo = participants || date || time || topic || (facilities && facilities.length > 0);
    
    if (hasAnyInfo) {
      message += "Saya melihat detail berikut:\n\n";
      
      if (participants) {
        message += `👥 **Jumlah Peserta:** ${participants} orang\n`;
      }
      
      if (date && time) {
        message += `📅 **Tanggal & Waktu:** ${date} jam ${time}\n`;
      } else if (date) {
        message += `📅 **Tanggal:** ${date}\n`;
      } else if (time) {
        message += `⏰ **Waktu:** ${time}\n`;
      }
      
      if (topic) {
        message += `📋 **Topik:** ${topic}\n`;
      }
      
      if (facilities && facilities.length > 0) {
        message += `🔧 **Fasilitas:** ${facilities.join(', ')}\n`;
      }
      
      // Jika ada informasi lengkap, cari rekomendasi ruangan dari database
      if (participants && date && time) {
        try {
          const endTime = this.calculateEndTime(time, 120); // Default 2 jam
          const recommendations = await this.getRoomRecommendationsFromDatabase(
            participants,
            date,
            time,
            endTime,
            facilities
          );
          
          if (recommendations.length > 0) {
            message += "\n\n🏢 **REKOMENDASI RUANGAN:**\n";
            recommendations.slice(0, 3).forEach((rec, index) => {
              message += `${index + 1}. **${rec.room.room_name}** (${rec.room.capacity} orang)\n`;
              message += `   Skor: ${rec.score}/100\n`;
              message += `   Alasan: ${rec.reasons.join(', ')}\n`;
              if (rec.room.features) {
                const features = JSON.parse(rec.room.features);
                message += `   Fasilitas: ${features.join(', ')}\n`;
              }
              message += "\n";
            });
          } else {
            message += "\n\n⚠️ **Tidak ada ruangan tersedia** pada waktu yang diminta. Silakan coba waktu lain.";
          }
        } catch (error) {
          console.error('Error getting room recommendations:', error);
          message += "\n\n⚠️ **Sedang memeriksa ketersediaan ruangan...**";
        }
      }
      
      message += "\nSilakan lengkapi detail yang kurang atau konfirmasi jika sudah lengkap:";
    } else {
      message += "Silakan beri tahu saya detail pemesanan Anda:\n\n";
      message += "📝 **Informasi yang dibutuhkan:**\n";
      message += "• Jumlah peserta\n";
      message += "• Tanggal dan waktu\n";
      message += "• Topik meeting (opsional)\n";
      message += "• Fasilitas yang dibutuhkan (opsional)\n\n";
      message += "Anda bisa memberikan semua informasi sekaligus atau satu per satu.";
    }
    
    const quickActions = [];
    
    // Add suggestions based on missing information
    const suggestions = [];
    if (participants && date && time) {
      suggestions.push('Ketik "konfirmasi" untuk melanjutkan pemesanan');
    } else {
      suggestions.push('Berikan informasi yang diminta');
    }
    
    if (!participants) {
      suggestions.push('Contoh: "10 orang"');
    }
    if (!date) {
      suggestions.push('Contoh: "besok" atau "2024-01-15"');
    }
    if (!time) {
      suggestions.push('Contoh: "jam 10" atau "10:00"');
    }
    
    suggestions.push('Anda bisa memberikan semua informasi sekaligus');
    
    return {
      message,
      action: 'continue',
      bookingData: extractedInfo,
      quickActions,
      suggestions
    };
  }

  // Get room recommendations from database
  private async getRoomRecommendationsFromDatabase(
    participants: number,
    date: string,
    startTime: string,
    endTime: string,
    facilities?: string[]
  ): Promise<RoomRecommendation[]> {
    try {
      console.log('Getting room recommendations from database:', {
        participants,
        date,
        startTime,
        endTime,
        facilities
      });

      const recommendations = await this.roomDatabaseService.getRoomRecommendations(
        participants,
        date,
        startTime,
        endTime,
        facilities
      );

      console.log('Database recommendations:', recommendations);
      return recommendations;
    } catch (error) {
      console.error('Error getting room recommendations from database:', error);
      return [];
    }
  }

  // Get available rooms from database
  private async getAvailableRoomsFromDatabase(): Promise<Room[]> {
    try {
      console.log('Getting available rooms from database');
      const rooms = await this.roomDatabaseService.getAllRooms();
      console.log('Available rooms from database:', rooms);
      return rooms;
    } catch (error) {
      console.error('Error getting available rooms from database:', error);
      return [];
    }
  }

  // Check room availability in database
  private async checkRoomAvailabilityInDatabase(
    roomId: number,
    date: string,
    startTime: string,
    endTime: string
  ): Promise<boolean> {
    try {
      console.log('Checking room availability in database:', {
        roomId,
        date,
        startTime,
        endTime
      });

      const availability = await this.roomDatabaseService.checkRoomAvailability(
        roomId,
        date,
        startTime,
        endTime
      );

      console.log('Room availability result:', availability);
      return availability.available;
    } catch (error) {
      console.error('Error checking room availability in database:', error);
      return false;
    }
  }

  // Calculate end time based on start time and duration
  private calculateEndTime(startTime: string, durationMinutes: number): string {
    try {
      const [hours, minutes] = startTime.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);
      
      const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
      
      return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('Error calculating end time:', error);
      // Default: add 2 hours
      const [hours, minutes] = startTime.split(':').map(Number);
      const endHours = (hours + 2) % 24;
      return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  }

  // Handle cancel intent
  private handleCancelIntent(sentiment: string): RBAResponse {
    const message = sentiment === 'negative' 
      ? "Saya mengerti Anda ingin membatalkan pemesanan. Saya akan membantu Anda dengan proses pembatalan. Apakah Anda yakin ingin membatalkan pemesanan?"
      : "Baik, saya akan membantu Anda membatalkan pemesanan. Silakan pilih pemesanan yang ingin dibatalkan.";
    
    return {
      message,
      action: 'continue',
      quickActions: [
        { label: 'Ya, Batalkan', action: 'ya_batal', icon: '❌', type: 'danger' },
        { label: 'Tidak, Batal', action: 'tidak_batal', icon: '✅', type: 'secondary' },
        { label: 'Lihat Pemesanan', action: 'lihat_pemesanan', icon: '👀', type: 'secondary' }
      ],
      suggestions: [
        'Lihat daftar pemesanan',
        'Konfirmasi pembatalan',
        'Bantuan lain'
      ]
    };
  }

  // Handle modify intent
  private handleModifyIntent(extractedInfo: any): RBAResponse {
    return {
      message: "Saya akan membantu Anda mengubah pemesanan. Silakan pilih apa yang ingin diubah:",
      action: 'continue',
      quickActions: [
        { label: 'Ubah Ruangan', action: 'ubah_ruangan', icon: '🏢', type: 'primary' },
        { label: 'Ubah Waktu', action: 'ubah_waktu', icon: '⏰', type: 'primary' },
        { label: 'Ubah Peserta', action: 'ubah_peserta', icon: '👥', type: 'primary' },
        { label: 'Ubah Tanggal', action: 'ubah_tanggal', icon: '📅', type: 'primary' }
      ],
      suggestions: [
        'Ubah ruangan pemesanan',
        'Ubah waktu meeting',
        'Ubah jumlah peserta',
        'Ubah tanggal meeting'
      ]
    };
  }

  // Handle view rooms intent
  private async handleViewRoomsIntent(extractedInfo: any): Promise<RBAResponse> {
    const { participants, facilities, date, time } = extractedInfo;
    
    // AI TUGAS: Mengecek database Spacio untuk ruangan yang tersedia
    console.log('RBA: Mengecek database Spacio untuk ruangan tersedia...');
    
    try {
      // Cek semua ruangan dari database
      const allRooms = await this.roomDatabaseService.getAllRooms();
      console.log('RBA: Semua ruangan dari database:', allRooms);
      
      let availableRooms = [];
      
      if (date && time) {
        // Jika ada tanggal dan waktu, cek ketersediaan
        for (const room of allRooms) {
          const endTime = this.calculateEndTime(time, 2); // Default 2 jam
          const isAvailable = await this.checkRoomAvailabilityInDatabase(
            room.id,
            date,
            time,
            endTime
          );
          
          if (isAvailable) {
            availableRooms.push(room);
          }
        }
      } else {
        // Jika tidak ada tanggal/waktu, tampilkan semua ruangan
        availableRooms = allRooms;
      }
      
      console.log('RBA: Ruangan tersedia:', availableRooms);
      
      let message = "🏢 **AI MENGE CEK DATABASE SPACIO**\n\n";
      
      if (availableRooms.length > 0) {
        message += `✅ **Ditemukan ${availableRooms.length} ruangan tersedia:**\n\n`;
        
        availableRooms.forEach((room, index) => {
          message += `${index + 1}. **${room.name}**\n`;
          message += `   📍 Kapasitas: ${room.capacity} orang\n`;
          message += `   🔧 Fasilitas: ${room.facilities.join(', ')}\n`;
          if (date && time) {
            message += `   ✅ Tersedia pada ${date} jam ${time}\n`;
          }
          message += '\n';
        });
        
        if (participants) {
          const suitableRooms = availableRooms.filter(room => room.capacity >= participants);
          if (suitableRooms.length > 0) {
            message += `💡 **Untuk ${participants} orang, rekomendasi terbaik:**\n`;
            suitableRooms.slice(0, 2).forEach((room, index) => {
              message += `${index + 1}. ${room.name} (${room.capacity} orang)\n`;
            });
          }
        }
      } else {
        message += "❌ **Tidak ada ruangan tersedia**\n\n";
        message += "🔍 **AI telah mengecek database Spacio dan menemukan:**\n";
        message += "• Semua ruangan sudah terbooking\n";
        message += "• Tidak ada slot waktu yang tersedia\n\n";
        message += "💡 **Saran:** Coba tanggal atau waktu yang berbeda";
      }
      
      return {
        message,
        action: 'continue',
        quickActions: [
          { label: 'Pilih Ruangan', action: 'pilih_ruangan', icon: '🏢', type: 'primary' },
          { label: 'Cek Jadwal', action: 'cek_jadwal', icon: '📅', type: 'secondary' },
          { label: 'Filter Kapasitas', action: 'filter_kapasitas', icon: '👥', type: 'secondary' }
        ],
        suggestions: [
          'Pilih ruangan yang sesuai',
          'Cek jadwal ketersediaan',
          'Filter berdasarkan kapasitas',
          'Lihat ruangan lain'
        ]
      };
      
    } catch (error) {
      console.error('RBA: Error checking database:', error);
      return {
        message: "❌ **AI mengalami kesalahan saat mengecek database Spacio**\n\n" +
                "Silakan coba lagi atau hubungi administrator.",
        action: 'error',
        suggestions: ['Coba lagi', 'Hubungi administrator']
      };
    }
  }

  // Handle schedule intent
  private async handleScheduleIntent(extractedInfo: any): Promise<RBAResponse> {
    const { date, time } = extractedInfo;
    
    // AI TUGAS: Mengecek jadwal ketersediaan dari database Spacio
    console.log('RBA: Mengecek jadwal ketersediaan dari database Spacio...');
    
    if (!date || !time) {
      return {
        message: "📅 **AI MEMBUTUHKAN INFORMASI TANGGAL DAN WAKTU**\n\n" +
                "Untuk mengecek jadwal ketersediaan, saya perlu:\n" +
                "• Tanggal yang ingin dicek\n" +
                "• Waktu yang diinginkan\n\n" +
                "**Contoh:** \"Cek jadwal tanggal 15 Januari jam 10:00\"",
        action: 'continue',
        suggestions: [
          'Berikan tanggal dan waktu',
          'Contoh: "15 Januari jam 10:00"',
          'Lihat ruangan tersedia'
        ]
      };
    }
    
    try {
      // Cek semua ruangan dari database
      const allRooms = await this.roomDatabaseService.getAllRooms();
      const endTime = this.calculateEndTime(time, 2); // Default 2 jam
      
      let availableRooms = [];
      let bookedRooms = [];
      
      for (const room of allRooms) {
        const isAvailable = await this.checkRoomAvailabilityInDatabase(
          room.id,
          date,
          time,
          endTime
        );
        
        if (isAvailable) {
          availableRooms.push(room);
        } else {
          bookedRooms.push(room);
        }
      }
      
      console.log('RBA: Jadwal ketersediaan:', { availableRooms, bookedRooms });
      
      let message = "📅 **AI MENGE CEK JADWAL DATABASE SPACIO**\n\n";
      message += `🔍 **Hasil pengecekan untuk ${date} jam ${time}:**\n\n`;
      
      if (availableRooms.length > 0) {
        message += `✅ **${availableRooms.length} ruangan TERSEDIA:**\n`;
        availableRooms.forEach((room, index) => {
          message += `${index + 1}. ${room.name} (${room.capacity} orang)\n`;
        });
        message += '\n';
      }
      
      if (bookedRooms.length > 0) {
        message += `❌ **${bookedRooms.length} ruangan SUDAH TERBOOKING:**\n`;
        bookedRooms.forEach((room, index) => {
          message += `${index + 1}. ${room.name} (${room.capacity} orang)\n`;
        });
        message += '\n';
      }
      
      if (availableRooms.length === 0) {
        message += "⚠️ **TIDAK ADA RUANGAN TERSEDIA**\n\n";
        message += "💡 **Saran:** Coba tanggal atau waktu yang berbeda";
      }
      
      return {
        message,
        action: 'continue',
        quickActions: [
          { label: 'Pilih Ruangan', action: 'pilih_ruangan', icon: '🏢', type: 'primary' },
          { label: 'Cek Tanggal Lain', action: 'cek_tanggal_lain', icon: '📆', type: 'secondary' },
          { label: 'Cek Waktu Lain', action: 'cek_waktu_lain', icon: '⏰', type: 'secondary' }
        ],
        suggestions: [
          'Pilih ruangan yang tersedia',
          'Cek tanggal lain',
          'Cek waktu lain',
          'Lihat semua ruangan'
        ]
      };
      
    } catch (error) {
      console.error('RBA: Error checking schedule:', error);
      return {
        message: "❌ **AI mengalami kesalahan saat mengecek jadwal database Spacio**\n\n" +
                "Silakan coba lagi atau hubungi administrator.",
        action: 'error',
        suggestions: ['Coba lagi', 'Hubungi administrator']
      };
    }
  }

  // Handle room info intent
  private handleRoomInfoIntent(extractedInfo: any): RBAResponse {
    return {
      message: "Saya akan memberikan informasi detail tentang ruangan. Silakan pilih ruangan yang ingin Anda ketahui informasinya:",
      action: 'continue',
      quickActions: [
        { label: 'Samudrantha (10 orang)', action: 'info_samudrantha', icon: '🏢', type: 'primary' },
        { label: 'Cedaya (8 orang)', action: 'info_cedaya', icon: '🏢', type: 'primary' },
        { label: 'Celebes (6 orang)', action: 'info_celebes', icon: '🏢', type: 'primary' },
        { label: 'Semua Ruangan', action: 'info_semua', icon: '📋', type: 'secondary' }
      ],
      suggestions: [
        'Lihat info ruangan Samudrantha',
        'Lihat info ruangan Cedaya',
        'Lihat info ruangan Celebes',
        'Lihat semua ruangan'
      ]
    };
  }

  // Handle help intent
  private handleHelpIntent(complexity: string): RBAResponse {
    const message = complexity === 'complex' 
      ? "Saya siap membantu Anda dengan pertanyaan yang kompleks! Saya bisa membantu dengan berbagai hal terkait pemesanan ruangan. Silakan jelaskan apa yang Anda butuhkan."
      : "Saya siap membantu Anda! 🎯\n\nSaya bisa membantu:\n• Memesan ruangan meeting\n• Mencari ruangan yang sesuai\n• Memberikan informasi ruangan\n• Membantu dengan jadwal\n• Membatalkan atau mengubah pemesanan\n\nApa yang ingin Anda lakukan?";
    
    return {
      message,
      action: 'continue',
      quickActions: [
        { label: 'Pesan Ruangan', action: 'pesan_ruangan', icon: '🏢', type: 'primary' },
        { label: 'Lihat Ruangan', action: 'lihat_ruangan', icon: '👀', type: 'secondary' },
        { label: 'Cek Jadwal', action: 'cek_jadwal', icon: '📅', type: 'secondary' },
        { label: 'Bantuan Lain', action: 'bantuan_lain', icon: '❓', type: 'secondary' }
      ],
      suggestions: [
        'Pesan ruangan untuk rapat tim',
        'Cari ruangan untuk presentasi',
        'Lihat jadwal ruangan tersedia',
        'Bantuan dengan pemesanan'
      ]
    };
  }

  // Handle general intent
  private handleGeneralIntent(userInput: string, extractedInfo: any, sentiment: string): RBAResponse {
    const message = sentiment === 'positive' 
      ? "Terima kasih! Saya senang bisa membantu Anda. Ada yang bisa saya bantu lagi?"
      : "Halo! 👋 Saya adalah RoomBooking Assistant (RBA). Saya siap membantu Anda dengan pemesanan ruang rapat.\n\nSilakan pilih opsi di bawah ini:";
    
    return {
      message,
      action: 'continue',
      quickActions: [
        { label: 'Pesan Ruangan', action: 'pesan_ruangan', icon: '🏢', type: 'primary' },
        { label: 'Lihat Ruangan', action: 'lihat_ruangan', icon: '👀', type: 'secondary' },
        { label: 'Cek Jadwal', action: 'cek_jadwal', icon: '📅', type: 'secondary' },
        { label: 'Bantuan', action: 'bantuan', icon: '❓', type: 'secondary' }
      ],
      suggestions: [
        'Pesan ruangan untuk rapat tim besok pagi',
        'Cari ruangan untuk presentasi client',
        'Lihat jadwal ruangan tersedia',
        'Buat booking untuk brainstorming 8 orang'
      ]
    };
  }

  // Analyze user intent and extract entities
  private async analyzeUserIntent(userInput: string): Promise<{
    intent: string;
    entities: any;
    confidence: number;
  }> {
    const lowerInput = userInput.toLowerCase();
    
    // Intent detection
    let intent = 'general_inquiry';
    let confidence = 0.5;
    
    if (lowerInput.includes('pesan') || lowerInput.includes('booking') || lowerInput.includes('reservasi')) {
      intent = 'book_room';
      confidence = 0.9;
    } else if (lowerInput.includes('batal') || lowerInput.includes('cancel')) {
      intent = 'cancel_booking';
      confidence = 0.9;
    } else if (lowerInput.includes('ubah') || lowerInput.includes('modify') || lowerInput.includes('edit')) {
      intent = 'modify_booking';
      confidence = 0.8;
    } else if (lowerInput.includes('ruangan') || lowerInput.includes('room')) {
      intent = 'room_inquiry';
      confidence = 0.7;
    } else if (lowerInput.includes('jadwal') || lowerInput.includes('schedule')) {
      intent = 'schedule_inquiry';
      confidence = 0.7;
    } else if (lowerInput.includes('bantuan') || lowerInput.includes('help')) {
      intent = 'help_request';
      confidence = 0.9;
    }

    // Entity extraction
    const entities = {
      participants: this.extractParticipants(lowerInput),
      date: this.extractDate(lowerInput),
      time: this.extractTime(lowerInput),
      roomType: this.extractRoomType(lowerInput),
      meetingType: this.extractMeetingType(lowerInput),
      facilities: this.extractFacilities(lowerInput),
      topic: this.extractTopic(userInput)
    };

    return { intent, entities, confidence };
  }

  // Extract participants from user input
  private extractParticipants(input: string): number | null {
    const patterns = [
      /(\d+)\s*orang/,
      /(\d+)\s*peserta/,
      /untuk\s*(\d+)/,
      /(\d+)\s*people/,
      /capacity\s*(\d+)/,
      /^(\d+)$/,  // Simple number like "15"
      /^(\d+)\s*$/,  // Number with spaces
      /(\d+)\s*$/  // Number at end of string
    ];
    
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        const num = parseInt(match[1], 10);
        // Only accept reasonable numbers (1-100)
        if (num >= 1 && num <= 100) {
          return num;
        }
      }
    }
    return null;
  }

  // Extract date from user input
  private extractDate(input: string): string | null {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (input.includes('besok') || input.includes('tomorrow')) {
      return tomorrow.toISOString().split('T')[0];
    } else if (input.includes('hari ini') || input.includes('today')) {
      return today.toISOString().split('T')[0];
    } else if (input.includes('lusa')) {
      const dayAfterTomorrow = new Date(today);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      return dayAfterTomorrow.toISOString().split('T')[0];
    }
    
    // Try to extract date patterns
    const datePatterns = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
      /(\d{4})-(\d{1,2})-(\d{1,2})/,
      /(\d{1,2})-(\d{1,2})-(\d{4})/
    ];
    
    for (const pattern of datePatterns) {
      const match = input.match(pattern);
      if (match) {
        const [, part1, part2, part3] = match;
        // Try to format as YYYY-MM-DD
        if (part3.length === 4) {
          return `${part3}-${part2.padStart(2, '0')}-${part1.padStart(2, '0')}`;
        }
      }
    }
    
    return null;
  }

  // Extract time from user input
  private extractTime(input: string): string | null {
    const timePatterns = [
      /(\d{1,2}):(\d{2})/,
      /(\d{1,2})\.(\d{2})/,
      /jam\s*(\d{1,2}):(\d{2})/,
      /pukul\s*(\d{1,2}):(\d{2})/
    ];
    
    for (const pattern of timePatterns) {
      const match = input.match(pattern);
      if (match) {
        const [, hour, minute] = match;
        return `${hour.padStart(2, '0')}:${minute}`;
      }
    }
    
    // Handle time descriptions
    if (input.includes('pagi')) {
      return '09:00';
    } else if (input.includes('siang')) {
      return '12:00';
    } else if (input.includes('sore')) {
      return '15:00';
    } else if (input.includes('malam')) {
      return '19:00';
    }
    
    return null;
  }

  // Extract room type from user input
  private extractRoomType(input: string): string | null {
    if (input.includes('besar') || input.includes('large')) {
      return 'large';
    } else if (input.includes('kecil') || input.includes('small')) {
      return 'small';
    } else if (input.includes('conference') || input.includes('konferensi')) {
      return 'conference';
    } else if (input.includes('meeting') || input.includes('rapat')) {
      return 'meeting';
    }
    return null;
  }

  // Extract meeting type from user input
  private extractMeetingType(input: string): string | null {
    if (input.includes('internal')) {
      return 'internal';
    } else if (input.includes('external') || input.includes('client')) {
      return 'external';
    }
    return null;
  }

  // Extract food order from user input
  private extractFoodOrder(input: string): string | null {
    if (input.includes('berat') || input.includes('makan siang')) {
      return 'berat';
    } else if (input.includes('ringan') || input.includes('snack')) {
      return 'ringan';
    } else if (input.includes('tidak') || input.includes('no food')) {
      return 'tidak';
    }
    return null;
  }

  // Extract topic from user input
  private extractTopic(input: string): string | null {
    // Look for topic indicators with more specific patterns
    const topicPatterns = [
      // Pattern untuk "presentasi client"
      /presentasi\s+([a-zA-Z\s]+?)(?:\s+untuk|\s+besok|\s+hari ini|\s+jam|\s+\d+\s+orang|$)/,
      // Pattern untuk "rapat tim"
      /rapat\s+([a-zA-Z\s]+?)(?:\s+untuk|\s+besok|\s+hari ini|\s+jam|\s+\d+\s+orang|$)/,
      // Pattern untuk "meeting"
      /meeting\s+([a-zA-Z\s]+?)(?:\s+untuk|\s+besok|\s+hari ini|\s+jam|\s+\d+\s+orang|$)/,
      // Pattern untuk "brainstorming"
      /brainstorming\s+([a-zA-Z\s]+?)(?:\s+untuk|\s+besok|\s+hari ini|\s+jam|\s+\d+\s+orang|$)/,
      // Pattern untuk "untuk [topic]"
      /untuk\s+([a-zA-Z\s]+?)(?:\s+besok|\s+hari ini|\s+jam|\s+\d+\s+orang|$)/,
      // Pattern untuk "tentang [topic]"
      /tentang\s+([a-zA-Z\s]+?)(?:\s+besok|\s+hari ini|\s+jam|\s+\d+\s+orang|$)/
    ];
    
    for (const pattern of topicPatterns) {
      const match = input.match(pattern);
      if (match) {
        let topic = match[1].trim();
        // Clean up the topic - remove common words that shouldn't be part of topic
        topic = topic.replace(/\b(untuk|dengan|oleh|dari|ke|di|pada|jam|orang|besok|hari ini|lusa)\b/g, '').trim();
        // Remove extra spaces
        topic = topic.replace(/\s+/g, ' ').trim();
        
        // Only return if topic is meaningful (more than 2 characters)
        if (topic.length > 2) {
          return topic;
        }
      }
    }
    
    return null;
  }

  // Build comprehensive prompt for RBA
  private buildRBAPrompt(userInput: string, analysis: any): string {
    const conversationContext = this.context.conversationHistory
      .slice(-6)
      .map(msg => {
        const timestamp = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('id-ID') : '';
        const role = msg.role === 'user' ? '👤 User' : '🤖 RBA';
        return `${role} [${timestamp}]: ${msg.content}`;
      })
      .join('\n');

    const bookingStatus = this.getBookingStatus();
    const availableRooms = this.getAvailableRoomsInfo();
    const userPreferences = this.getUserPreferencesInfo();
    
    // Debug: Log values to see what's happening
    console.log('DEBUG - conversationContext:', conversationContext);
    console.log('DEBUG - bookingStatus:', bookingStatus);
    console.log('DEBUG - availableRooms:', availableRooms);
    console.log('DEBUG - userPreferences:', userPreferences);

    return `Halo! Saya adalah RBA (RoomBooking Assistant) - asisten AI SUPER CERDAS yang memahami semua input user dengan kecerdasan buatan tingkat tinggi. Saya di sini untuk membantu Anda dengan cara yang natural, ramah, efisien, dan sangat cerdas.

🧠 KECERDASAN SAYA:
- Memahami bahasa alami dalam berbagai bentuk (formal, informal, singkat, panjang, campuran bahasa)
- Menganalisis konteks, emosi, dan niat user dengan akurasi tinggi
- Memberikan rekomendasi yang tepat berdasarkan kebutuhan spesifik
- Belajar dari setiap interaksi untuk memberikan layanan yang lebih personal
- Memahami input yang kompleks dan ambigu dengan kecerdasan tinggi
- Menyesuaikan respons berdasarkan mood dan urgency user

🎯 KEMAMPUAN PEMAHAMAN:
- Deteksi bahasa: Indonesia, Inggris, campuran
- Analisis emosi: positif, negatif, netral, grateful, frustrated
- Deteksi urgency: tinggi, normal, rendah
- Analisis kompleksitas: sederhana, sedang, kompleks
- Deteksi konteks: presentasi, diskusi, training, review, urgent
- Pemahaman aksi: create, search, check, confirm, modify

💬 KONTEKS PERCAKAPAN:
${conversationContext || 'Belum ada percakapan sebelumnya'}

${bookingStatus}

${availableRooms}

${userPreferences}

ANALISIS INPUT USER (ENHANCED):
- Intent: ${analysis.intent}
- Confidence: ${analysis.confidence}
- Sentiment: ${analysis.sentiment}
- Urgency: ${analysis.urgency}
- Complexity: ${analysis.complexity}
- Context: ${analysis.context}
- Language: ${analysis.language}
- Emotion: ${analysis.emotion}
- Action: ${analysis.action}
- Entities: ${JSON.stringify(analysis.entities)}

PESAN USER TERBARU: "${userInput}"

🧠 ENHANCED PARSING INTELLIGENCE:

TANGGAL (Super Cerdas):
- "besok" = tanggal besok dalam format YYYY-MM-DD
- "hari ini" = tanggal hari ini dalam format YYYY-MM-DD  
- "lusa" = tanggal lusa dalam format YYYY-MM-DD
- "minggu depan" = 7 hari dari sekarang
- Format tanggal: DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY
- Nama bulan: Januari, Februari, Maret, April, Mei, Juni, Juli, Agustus, September, Oktober, November, Desember
- Selalu konversi tanggal relatif ke format YYYY-MM-DD yang tepat

WAKTU (Super Cerdas):
- Format: HH:MM, HH.MM, jam HH:MM, pukul HH:MM
- AM/PM: 2pm = 14:00, 2am = 02:00
- Deskripsi: pagi=09:00, siang=12:00, sore=15:00, malam=19:00
- Bahasa Inggris: morning=09:00, noon=12:00, afternoon=15:00, evening=19:00

PESERTA (Super Cerdas):
- Angka: 10, 15, 20
- Dengan kata: 10 orang, 15 peserta, 20 people
- Deskripsi: team of 5, group of 8, untuk 12
- Range: 5-10 orang, between 8-15 people

TOPIK (Super Cerdas):
- Bersih dan spesifik, tidak termasuk informasi lain
- Contoh: "presentasi client untuk 10 orang besok jam 10" → topik: "presentasi client"
- Contoh: "rapat tim besok pagi" → topik: "rapat tim"
- Contoh: "brainstorming produk baru" → topik: "brainstorming produk baru"
- Contoh: "meeting review bulanan" → topik: "meeting review bulanan"

RUANGAN (Super Cerdas):
- Tipe: besar/large, kecil/small, conference, meeting, presentation, training
- Fasilitas: proyektor, papan tulis, AC, sound system, video conference, WiFi
- Kebutuhan khusus: aksesibilitas, privasi, rekaman, streaming

FITUR UTAMA RBA:
1. Pemesanan Cerdas & Rekomendasi
   - Pencarian Berbasis Niat: Memahami bahasa alami pengguna
   - Rekomendasi Proaktif: Berdasarkan riwayat dan preferensi
   - Penjadwalan Otomatis: Memesan ruangan secara langsung
   - Integrasi Kalender: Sinkronisasi jadwal

2. Asisten Virtual 24/7
   - FAQ Otomatis: Menjawab pertanyaan umum
   - Panduan Penggunaan: Membantu navigasi aplikasi
   - Dukungan Multi-bahasa: Bahasa Indonesia

3. Notifikasi & Pengingat
   - Konfirmasi Pemesanan: Konfirmasi segera
   - Pengingat Pra-Pemesanan: Pengingat sebelum waktu
   - Notifikasi Perubahan: Informasi perubahan
   - Survei Pasca-Pemesanan: Umpan balik

4. Personalisasi
   - Memahami Preferensi: Belajar dari riwayat
   - Riwayat Pemesanan: Akses cepat ke riwayat
   - Profil Pengguna: Rekomendasi personal

5. Analitik & Wawasan
   - Laporan Penggunaan: Data penggunaan ruangan
   - Identifikasi Pola: Deteksi pola penggunaan
   - Umpan Balik Terkonsolidasi: Analisis umpan balik

FORMAT RESPONS (JSON):
{
  "message": "Pesan respons untuk user (maksimal 300 karakter, gunakan emoji yang sesuai)",
  "action": "continue|complete|error|clarify|recommend|confirm",
  "bookingData": {
    "roomName": "nama ruangan jika dipilih",
    "topic": "topik rapat",
    "pic": "nama PIC",
    "participants": "jumlah peserta",
    "date": "tanggal (YYYY-MM-DD)",
    "time": "waktu (HH:MM)",
    "endTime": "waktu selesai (HH:MM)",
    "meetingType": "internal|external",
    "facilities": "AC|Projector|Sound System|Whiteboard|TV|WiFi|Microphone|Camera|Video Conference|Coffee Machine|Water Dispenser|Printer|Scanner|Presentation Screen|Laptop Connection|Power Outlets|Air Purifier|Blinds/Curtains|Lighting Control"
  },
  "nextState": "IDLE|ASKING_ROOM|ASKING_TOPIC|ASKING_PIC|ASKING_PARTICIPANTS|ASKING_DATE|ASKING_TIME|ASKING_MEETING_TYPE|ASKING_FOOD_TYPE|CONFIRMING",
  "quickActions": [
    {"label": "Opsi 1", "action": "action1", "icon": "🏢", "type": "primary"},
    {"label": "Opsi 2", "action": "action2", "icon": "📅", "type": "secondary"}
  ],
  "suggestions": ["Saran 1", "Saran 2", "Saran 3"],
  "recommendations": {
    "rooms": [
      {"name": "Ruang A", "capacity": 10, "facilities": ["proyektor", "papan tulis"]}
    ],
    "reasons": ["Sesuai kapasitas", "Fasilitas lengkap"]
  },
  "notifications": [
    {"type": "confirmation", "message": "Pemesanan berhasil", "scheduled": "2025-01-10T10:00:00Z"}
  ]
}

CARA BERBICARA SAYA (ENHANCED):
- Seperti teman yang sangat cerdas dan membantu
- Gunakan bahasa yang natural dan conversational sesuai konteks
- Emoji yang tepat dan tidak berlebihan
- Langsung ke inti dengan kecerdasan tinggi
- Proaktif memberikan saran yang sangat berguna
- Mengingat konteks percakapan dengan detail
- Responsif terhadap kebutuhan spesifik user
- Menyesuaikan tone berdasarkan emosi dan urgency user
- Memberikan solusi yang tepat dan efisien

CONTOH RESPONS YANG SUPER CERDAS:
- "Wah, untuk presentasi client 10 orang besok pagi, saya rekomendasikan Samudrantha! Ruangannya pas, ada proyektor, dan cocok untuk presentasi. Mau saya bookingkan sekarang?"
- "Oke, saya lihat Anda butuh ruangan urgent untuk brainstorming tim. Ada beberapa pilihan bagus nih... Cedaya atau Celebes cocok untuk diskusi kreatif."
- "Hmm, untuk training 15 orang dengan kebutuhan rekaman, Balidwipa perfect! Ada sound system dan space yang cukup. Gimana, proceed?"

CONTOH PARSING YANG SUPER CERDAS:
- Input: "besok jam 10 untuk presentasi client 12 orang" → date: "2025-01-11", time: "10:00", participants: 12, topic: "presentasi client"
- Input: "hari ini siang rapat tim urgent" → date: "2025-01-10", time: "12:00", topic: "rapat tim", urgency: "high"
- Input: "lusa pagi brainstorming produk baru dengan 8 orang" → date: "2025-01-12", time: "09:00", participants: 8, topic: "brainstorming produk baru"
- Input: "training 15 orang dengan kebutuhan rekaman besok sore" → participants: 15, date: "2025-01-11", time: "15:00", topic: "training", requirements: ["rekaman"]

RESPONS HANYA BERUPA JSON, TANPA TEKS TAMBAHAN.`;
  }

  // Call Google Gemini API
  private async callGeminiAPI(prompt: string): Promise<string> {
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.9,
        topK: 50,
        topP: 0.98,
        maxOutputTokens: 2048
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ]
    };

    const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates.length > 0) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('No response from Gemini API');
    }
  }

  // Process Gemini response and return structured data
  private async processGeminiResponse(geminiResponse: string, userInput: string, analysis: any): Promise<RBAResponse> {
    try {
      // Clean response
      const cleanResponse = geminiResponse.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanResponse);

      // Update context
      if (parsed.bookingData) {
        this.context.currentBooking = { ...this.context.currentBooking, ...parsed.bookingData };
      }

      if (parsed.nextState) {
        this.context.bookingState = this.mapStringToState(parsed.nextState);
      }

      return {
        message: parsed.message || "Maaf, saya tidak dapat memproses permintaan Anda.",
        action: parsed.action || 'continue',
        bookingData: parsed.bookingData,
        nextState: parsed.nextState ? this.mapStringToState(parsed.nextState) : undefined,
        quickActions: parsed.quickActions || [],
        suggestions: parsed.suggestions || [],
        recommendations: parsed.recommendations,
        notifications: parsed.notifications || []
      };
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      console.error('Raw response:', geminiResponse);
      
      // Fallback response
      return {
        message: "Maaf, terjadi kesalahan dalam memproses respons. Silakan coba lagi dengan kata-kata yang lebih jelas.",
        action: 'error',
        suggestions: ['Mulai pemesanan baru', 'Lihat ruangan tersedia', 'Bantuan']
      };
    }
  }

  // Helper methods
  private addToHistory(role: 'user' | 'assistant', content: string, intent?: string, entities?: any): void {
    this.context.conversationHistory.push({
      role,
      content,
      timestamp: new Date(),
      intent,
      entities
    });

    // Keep only last 20 messages
    if (this.context.conversationHistory.length > 20) {
      this.context.conversationHistory = this.context.conversationHistory.slice(-20);
    }
  }

  private getBookingStatus(): string {
    const data = this.context.currentBooking;
    console.log('DEBUG - currentBooking data:', data);
    const fields = [];
    
    if (data.roomName) fields.push(`🏢 Ruangan: ${data.roomName}`);
    if (data.topic) fields.push(`📋 Topik: ${data.topic}`);
    if (data.pic) fields.push(`👤 PIC: ${data.pic}`);
    if (data.participants) fields.push(`👥 Peserta: ${data.participants} orang`);
    if (data.date) fields.push(`📅 Tanggal: ${data.date}`);
    if (data.time) fields.push(`⏰ Waktu: ${data.time}`);
    if (data.endTime) fields.push(`⏰ Selesai: ${data.endTime}`);
    if (data.meetingType) fields.push(`📝 Tipe: ${data.meetingType}`);
    if (data.facilities && data.facilities.length > 0) fields.push(`🏢 Fasilitas: ${data.facilities.join(', ')}`);
    
    console.log('DEBUG - fields array:', fields);
    
    if (fields.length > 0) {
      const result = `📊 STATUS BOOKING SAAT INI:\n${fields.join('\n')}`;
      console.log('DEBUG - bookingStatus result:', result);
      return result;
    } else {
      const result = '📊 STATUS BOOKING: Belum ada data booking yang sedang diproses';
      console.log('DEBUG - bookingStatus result (empty):', result);
      return result;
    }
  }

  private getAvailableRoomsInfo(): string {
    const result = `🏢 RUANGAN TERSEDIA:

1. 🏢 Samudrantha Meeting Room (10 orang)
   📍 Ruang besar untuk rapat tim
   🔧 Fasilitas: Proyektor, Papan Tulis, AC
   💡 Cocok untuk: Rapat tim, presentasi internal

2. 🏢 Cedaya Meeting Room (8 orang)
   📍 Ruang meeting standar
   🔧 Fasilitas: Proyektor, AC
   💡 Cocok untuk: Meeting kecil, diskusi

3. 🏢 Celebes Meeting Room (6 orang)
   📍 Ruang meeting kecil
   🔧 Fasilitas: Papan Tulis, AC
   💡 Cocok untuk: Meeting intimate, brainstorming

4. 🏢 Kalamanthana Meeting Room (4 orang)
   📍 Ruang meeting intimate
   🔧 Fasilitas: AC
   💡 Cocok untuk: Meeting 1-on-1, interview

5. 🏢 Nusanipa Meeting Room (12 orang)
   📍 Ruang meeting medium
   🔧 Fasilitas: Proyektor, Papan Tulis, AC
   💡 Cocok untuk: Rapat tim medium, workshop

6. 🏢 Balidwipa Meeting Room (15 orang)
   📍 Ruang meeting besar
   🔧 Fasilitas: Proyektor, Papan Tulis, AC, Sound System
   💡 Cocok untuk: Presentasi client, training

7. 🏢 Swarnadwipa Meeting Room (20 orang)
   📍 Ruang meeting extra besar
   🔧 Fasilitas: Proyektor, Papan Tulis, AC, Sound System
   💡 Cocok untuk: Seminar, workshop besar

8. 🏢 Jawadwipa Meeting Room (25 orang)
   📍 Auditorium kecil
   🔧 Fasilitas: Proyektor, Papan Tulis, AC, Sound System, Podium
   💡 Cocok untuk: Presentasi besar, konferensi kecil`;
    
    console.log('DEBUG - availableRooms result:', result);
    return result;
  }

  private getUserPreferencesInfo(): string {
    const prefs = this.context.userPreferences;
    const preferredRooms = prefs.preferredRooms.length > 0 ? prefs.preferredRooms.join(', ') : 'Belum ada';
    const preferredTimes = prefs.preferredTimes.length > 0 ? prefs.preferredTimes.join(', ') : 'Belum ada';
    const meetingTypes = prefs.meetingTypes.length > 0 ? prefs.meetingTypes.join(', ') : 'Belum ada';
    const facilityPreferences = prefs.facilityPreferences.length > 0 ? prefs.facilityPreferences.join(', ') : 'Belum ada';
    
    const result = `👤 PREFERENSI USER:

🏢 Preferensi Ruangan: ${preferredRooms}
⏰ Preferensi Waktu: ${preferredTimes}
📝 Tipe Meeting: ${meetingTypes}
🍽️ Preferensi Makanan: ${facilityPreferences}

📊 Riwayat Interaksi:
- Total percakapan: ${this.context.conversationHistory.length}
- Status booking: ${this.context.bookingState}
- Session ID: ${this.context.sessionId}`;
    
    console.log('DEBUG - userPreferences result:', result);
    return result;
  }

  private mapStringToState(stateString: string): BookingState {
    const stateMap: { [key: string]: BookingState } = {
      'IDLE': BookingState.IDLE,
      'ASKING_ROOM': BookingState.ASKING_ROOM,
      'ASKING_TOPIC': BookingState.ASKING_TOPIC,
      'ASKING_PIC': BookingState.ASKING_PIC,
      'ASKING_PARTICIPANTS': BookingState.ASKING_PARTICIPANTS,
      'ASKING_DATE': BookingState.ASKING_DATE,
      'ASKING_TIME': BookingState.ASKING_TIME,
      'ASKING_MEETING_TYPE': BookingState.ASKING_MEETING_TYPE,
      'ASKING_FOOD_TYPE': BookingState.ASKING_FOOD_TYPE,
      'CONFIRMING': BookingState.CONFIRMING
    };

    return stateMap[stateString] || BookingState.IDLE;
  }

  // Enhanced extraction of additional information with AI intelligence
  private extractAdditionalInfoEnhanced(userInput: string): Partial<Booking> {
    const lowerInput = userInput.toLowerCase();
    const extracted: Partial<Booking> = {};
    
    // Extract topic with enhanced patterns
    const topicPatterns = [
      /topik[:\s]*([^,]+)/i,
      /tema[:\s]*([^,]+)/i,
      /judul[:\s]*([^,]+)/i,
      /tentang[:\s]*([^,]+)/i,
      /mengenai[:\s]*([^,]+)/i,
      /rapat[:\s]*([^,]+)/i,
      /meeting[:\s]*([^,]+)/i
    ];
    
    for (const pattern of topicPatterns) {
      const match = userInput.match(pattern);
      if (match && match[1].trim()) {
        extracted.topic = match[1].trim();
        break;
      }
    }
    
    // Extract PIC with enhanced patterns
    const picPatterns = [
      /pic[:\s]*([^,]+)/i,
      /penanggung[:\s]*([^,]+)/i,
      /penanggung\s+jawab[:\s]*([^,]+)/i,
      /koordinator[:\s]*([^,]+)/i,
      /pemimpin[:\s]*([^,]+)/i,
      /leader[:\s]*([^,]+)/i
    ];
    
    for (const pattern of picPatterns) {
      const match = userInput.match(pattern);
      if (match && match[1].trim()) {
        extracted.pic = match[1].trim();
        break;
      }
    }
    
    // Extract meeting type
    if (lowerInput.includes('internal') || lowerInput.includes('dalam')) {
      extracted.meetingType = 'internal';
    } else if (lowerInput.includes('external') || lowerInput.includes('luar') || lowerInput.includes('client')) {
      extracted.meetingType = 'external';
    }
    
    // Extract food order
    // Extract facilities from user input
    const facilityKeywords = {
      'AC': ['ac', 'air conditioning', 'pendingin'],
      'Projector': ['proyektor', 'projector', 'proyeksi'],
      'Sound System': ['sound', 'audio', 'speaker', 'suara'],
      'Whiteboard': ['whiteboard', 'papan tulis', 'papan'],
      'TV': ['tv', 'televisi', 'monitor'],
      'WiFi': ['wifi', 'internet', 'koneksi'],
      'Microphone': ['microphone', 'mic', 'mikrofon'],
      'Camera': ['camera', 'kamera', 'webcam'],
      'Video Conference': ['video conference', 'video call', 'zoom', 'meet'],
      'Coffee Machine': ['coffee', 'kopi', 'mesin kopi'],
      'Water Dispenser': ['water', 'air', 'dispenser'],
      'Printer': ['printer', 'cetak', 'print'],
      'Scanner': ['scanner', 'scan'],
      'Presentation Screen': ['screen', 'layar', 'presentasi'],
      'Laptop Connection': ['laptop', 'koneksi laptop', 'vga', 'hdmi'],
      'Power Outlets': ['power', 'stop kontak', 'outlet'],
      'Air Purifier': ['air purifier', 'pembersih udara'],
      'Blinds/Curtains': ['blinds', 'curtains', 'tirai', 'gorden'],
      'Lighting Control': ['lighting', 'pencahayaan', 'lampu']
    };

    const extractedFacilities: string[] = [];
    for (const [facility, keywords] of Object.entries(facilityKeywords)) {
      if (keywords.some(keyword => lowerInput.includes(keyword))) {
        extractedFacilities.push(facility);
      }
    }
    
    if (extractedFacilities.length > 0) {
      extracted.facilities = extractedFacilities;
    }
    
    return extracted;
  }
  
  // Generate intelligent feedback for user input
  private generateIntelligentFeedback(extractedInfo: Partial<Booking>, userInput: string): string {
    const feedbacks = [];
    
    if (extractedInfo.topic) {
      feedbacks.push(`✅ **Topik:** "${extractedInfo.topic}"`);
    }
    if (extractedInfo.pic) {
      feedbacks.push(`✅ **PIC:** "${extractedInfo.pic}"`);
    }
    if (extractedInfo.meetingType) {
      feedbacks.push(`✅ **Jenis Rapat:** ${extractedInfo.meetingType}`);
    }
    if (extractedInfo.facilities && extractedInfo.facilities.length > 0) {
      feedbacks.push(`✅ **Fasilitas:** ${extractedInfo.facilities.join(', ')}`);
    }
    
    if (feedbacks.length === 0) {
      return "🤔 **AI tidak dapat memahami informasi yang diberikan.**\n\n" +
             "💡 **Silakan coba format yang lebih jelas:**\n" +
             "• \"Topik: presentasi client\"\n" +
             "• \"PIC: Budi Santoso\"\n" +
             "• \"Jenis: internal\"\n" +
             "• \"Makanan: ringan\"\n\n" +
             "**Atau ketik 'lewati' untuk menggunakan default.**";
    }
    
    let message = "🧠 **AI BERHASIL MEMAHAMI INFORMASI ANDA:**\n\n";
    message += feedbacks.join('\n') + '\n\n';
    
    // Check what's still missing from the complete booking data
    const currentBooking = this.context.currentBooking;
    const stillMissing = [];
    
    if (!currentBooking.topic && !extractedInfo.topic) {
      stillMissing.push('topik rapat');
    }
    if (!currentBooking.pic && !extractedInfo.pic) {
      stillMissing.push('PIC');
    }
    if (!currentBooking.meetingType && !extractedInfo.meetingType) {
      stillMissing.push('jenis rapat');
    }
    if ((!currentBooking.facilities || currentBooking.facilities.length === 0) && (!extractedInfo.facilities || extractedInfo.facilities.length === 0)) {
      stillMissing.push('fasilitas');
    }
    
    if (stillMissing.length > 0) {
      message += "📝 **Masih diperlukan:**\n";
      stillMissing.forEach((field, index) => {
        message += `${index + 1}. ${field}\n`;
      });
      message += "\n**Silakan berikan informasi yang masih kurang atau ketik 'lewati' untuk default.**";
    } else {
      message += "🎉 **Semua informasi sudah lengkap! Melanjutkan ke konfirmasi...**";
    }
    
    return message;
  }

  private updateUserPreferences(bookingData?: Partial<Booking>): void {
    if (!bookingData) return;

    if (bookingData.roomName) {
      this.context.userPreferences.preferredRooms.push(bookingData.roomName);
    }
    if (bookingData.time) {
      this.context.userPreferences.preferredTimes.push(bookingData.time);
    }
    if (bookingData.meetingType) {
      this.context.userPreferences.meetingTypes.push(bookingData.meetingType);
    }
    if (bookingData.facilities && bookingData.facilities.length > 0) {
      this.context.userPreferences.facilityPreferences.push(...bookingData.facilities);
    }
  }

  // Public methods for external access
  public getContext(): RBAContext {
    return { ...this.context };
  }

  public resetContext(): void {
    this.context = {
      conversationHistory: [],
      currentBooking: {},
      bookingState: BookingState.IDLE,
      userPreferences: {
        preferredRooms: [],
        preferredTimes: [],
        meetingTypes: ['internal'],
        facilityPreferences: ['tidak']
      },
      sessionId: this.context.sessionId,
      userId: this.context.userId
    };
  }

  public updateBookingData(data: Partial<Booking>): void {
    this.context.currentBooking = { ...this.context.currentBooking, ...data };
  }

  public setBookingState(state: BookingState): void {
    this.context.bookingState = state;
  }

  public setAvailableRooms(rooms: MeetingRoom[]): void {
    this.availableRooms = rooms;
  }
}

// Export singleton factory
export const createRoomBookingAssistant = (userId: string, sessionId: string): RoomBookingAssistant => {
  return new RoomBookingAssistant(userId, sessionId);
};

