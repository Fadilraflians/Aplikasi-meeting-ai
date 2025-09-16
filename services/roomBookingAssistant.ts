// RoomBooking Assistant (RBA) - AI Assistant yang Cerdas dan Proaktif
import { Booking, BookingState, MeetingRoom } from '../types';
import RoomDatabaseService, { RoomRecommendation, Room } from './roomDatabaseService';
import { ConversationService } from './conversationService';
import { Conversation, ConversationMessage } from '../src/types/conversation';

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
  dataCollection: {
    topic?: string;
    pic?: string;
    meetingType?: 'internal' | 'external';
    date?: string;
    time?: string;
    participants?: number;
    roomPreference?: string;
  };
  availableRooms: MeetingRoom[];
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
  private conversationService: ConversationService;

  constructor(userId: string, sessionId: string) {
    // Initialize Gemini API key from environment variables
    const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    const processKey = (process as any).env?.GEMINI_API_KEY;
    const fallbackKey = 'AIzaSyA_Rde7sVAyaQ3aE_V1ycbMD45PTQnxQko';
    
    this.apiKey = envKey || processKey || fallbackKey;
    
    // Detailed logging for AI connection status
    console.log('🔍 AI CONNECTION DEBUG INFO:');
    console.log('📋 Environment Variables Check:');
    console.log('  - import.meta.env.VITE_GEMINI_API_KEY:', envKey ? '✅ Found' : '❌ Not found');
    console.log('  - process.env.GEMINI_API_KEY:', processKey ? '✅ Found' : '❌ Not found');
    console.log('  - Fallback API Key:', fallbackKey ? '✅ Available' : '❌ Not available');
    console.log('🔑 Final API Key Status:', this.apiKey ? '✅ SET' : '❌ EMPTY');
    console.log('🔗 API Key Length:', this.apiKey?.length || 0, 'characters');
    console.log('🌐 Gemini API URL:', this.baseUrl);
    
    if (this.apiKey && this.apiKey !== '') {
      console.log('✅ GEMINI API ENABLED - Using AI Agent mode');
      console.log('🤖 RBA will use advanced AI capabilities');
      console.log('🚀 AI Agent is ready to process natural language inputs');
      
      // Test API key format
      if (this.apiKey.startsWith('AIza')) {
        console.log('✅ API Key format is valid (starts with AIza)');
      } else {
        console.log('⚠️ API Key format might be invalid (should start with AIza)');
      }
    } else {
    console.log('🚫 GEMINI API DISABLED - Using booking-only mode');
    console.log('✅ RBA will focus only on room booking functionality');
    }
    
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
      userId,
      dataCollection: {},
      availableRooms: []
    };
    
    // Initialize room database service
    this.roomDatabaseService = new RoomDatabaseService();
    
    // Initialize conversation service for MongoDB
    this.conversationService = new ConversationService();
    
    console.log('✅ RBA Initialized - Booking Only Mode');
    console.log('📊 MongoDB conversation storage enabled');
  }

  // Main method to process user input
  public async processInput(userInput: string): Promise<RBAResponse> {
    try {
      console.log('🎯 RBA processInput called with:', userInput);
      console.log('🔑 Current API Key Status:', this.apiKey ? '✅ Available' : '❌ Empty');
      console.log('🤖 AI Mode:', this.apiKey ? 'ENABLED' : 'DISABLED');
      
      // Add user input to conversation history
      this.addToHistory('user', userInput);

      // Check if input is booking-related
      const isBookingIntent = this.detectBookingIntent(userInput);
      console.log('🔍 Booking Intent Detected:', isBookingIntent);
      console.log('📝 Input Analysis:', {
        input: userInput,
        length: userInput.length,
        isGreeting: ['hai', 'hello', 'hi', 'halo'].includes(userInput.toLowerCase().trim()),
        hasBookingKeywords: ['pesan', 'ruang', 'meeting', 'rapat'].some(keyword => 
          userInput.toLowerCase().includes(keyword)
        )
      });
      
      if (!isBookingIntent) {
        console.log('❌ Non-booking input detected, returning default response');
        return {
          message: "Maaf, saya hanya bisa membantu dengan pemesanan ruangan meeting. Silakan gunakan opsi 'Pesan Ruangan' untuk memulai booking.",
          action: 'continue',
          quickActions: [
            { label: 'Pesan Ruangan', action: 'book_room', type: 'primary' as const },
            { label: 'Lihat Ruangan', action: 'view_rooms', type: 'secondary' as const }
          ]
        };
      }

      // Process booking-related input
      console.log('✅ Booking intent confirmed, processing with AI...');
      return await this.processBookingInput(userInput);
    } catch (error) {
      console.error('❌ RBA Error:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return this.handleBookingError(userInput, error);
    }
  }

  // Detect if user input is booking-related - NO LIMITATIONS
  private detectBookingIntent(userInput: string): boolean {
    // AI Agent sekarang menerima SEMUA input tanpa batasan
    // Tidak ada lagi pembatasan keyword - AI akan memproses semua input
    console.log('🤖 AI Agent: Processing ALL user input without limitations');
    return true; // Selalu true - AI akan memproses semua input
  }

  // Process booking-related input
  private async processBookingInput(userInput: string): Promise<RBAResponse> {
    try {
      // Analyze input for booking information
      const bookingAnalysis = this.analyzeBookingInput(userInput);
      
      // Check if this is a confirmation response
      if (bookingAnalysis.extractedData.isConfirmation && bookingAnalysis.confidence > 0.7) {
        return this.handleBookingConfirmationYes();
      }
      
      // Check if data is complete enough for direct confirmation
      if (bookingAnalysis.confidence >= 0.8 && bookingAnalysis.missingFields.length <= 1) {
        return this.handleSmartBookingConfirmation();
      }
      
      // Update current booking context with new data
      this.updateBookingContext(bookingAnalysis.extractedData);
      
      // Generate response based on booking analysis
      return await this.generateBookingResponse(bookingAnalysis, userInput);
      
    } catch (error) {
      console.error('Booking processing error:', error);
      return this.handleBookingError(userInput, error);
    }
  }

  // Generate booking response with AI capabilities
  private async generateBookingResponse(bookingAnalysis: any, userInput: string): Promise<RBAResponse> {
    // Use Gemini API if available, otherwise fallback to rule-based response
    if (this.apiKey && this.apiKey !== '') {
      try {
        return await this.generateAIResponse(bookingAnalysis, userInput);
      } catch (error) {
        console.warn('⚠️ AI response failed, falling back to rule-based:', error);
        return this.generateRuleBasedResponse(bookingAnalysis, userInput);
      }
    } else {
      return this.generateRuleBasedResponse(bookingAnalysis, userInput);
    }
  }

  // Generate AI-powered response using Gemini
  private async generateAIResponse(bookingAnalysis: any, userInput: string): Promise<RBAResponse> {
    try {
      console.log('🚀 Starting AI Response Generation...');
      console.log('📝 User Input:', userInput);
      console.log('🔍 Booking Analysis:', JSON.stringify(bookingAnalysis, null, 2));
      
      // Use advanced prompt for better AI responses
      const prompt = await this.buildAdvancedAIPrompt(userInput, bookingAnalysis);
      console.log('📋 Generated Advanced Prompt Length:', prompt.length);
      console.log('📋 Prompt Preview:', prompt.substring(0, 300) + '...');
      
      const aiResponse = await this.callGeminiAPI(prompt);
      console.log('✅ AI Response received, processing...');
      
      const processedResponse = await this.processGeminiResponse(aiResponse, userInput, bookingAnalysis);
      console.log('🎯 Final Processed Response:', JSON.stringify(processedResponse, null, 2));
      
      return processedResponse;
    } catch (error) {
      console.error('❌ AI Response generation failed:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    }
  }

  // Generate rule-based response (fallback)
  private generateRuleBasedResponse(bookingAnalysis: any, userInput: string): RBAResponse {
    const { extractedData, missingFields, confidence } = bookingAnalysis;
    
    let response = '';
    const quickActions = [];
    
    if (confidence >= 0.8 && missingFields.length <= 1) {
      // Data is almost complete - show confirmation with facilities
      const roomName = extractedData.roomName;
      const roomFacilities = roomName ? this.getRoomFacilities(roomName) : [];
      
      response = `Baik! Saya sudah mencatat detail pemesanan Anda:
- Ruangan: ${roomName || 'Belum dipilih'}
- Topik Rapat: ${extractedData.topic || 'Belum ditentukan'}
- PIC: ${extractedData.pic || 'Belum ditentukan'}
- Jumlah Peserta: ${extractedData.participants || 'Belum ditentukan'} orang
- Tanggal & Jam: ${extractedData.date || 'Belum ditentukan'}, ${extractedData.time || 'Belum ditentukan'}
- Jenis Rapat: ${extractedData.meetingType || 'Belum ditentukan'}`;

      if (roomFacilities.length > 0) {
        response += `\n\nFasilitas yang tersedia di ${roomName}:
${roomFacilities.map(facility => `- ${facility}`).join('\n')}

Silakan pilih fasilitas yang ingin Anda gunakan:`;
        
        // Add facility selection quick actions
        roomFacilities.forEach(facility => {
          quickActions.push({
            label: `Pilih ${facility}`,
            action: `select_facility_${facility.toLowerCase().replace(/\s+/g, '_')}`,
            type: 'secondary'
          });
        });
      }
      
      response += `\n\nApakah semua informasi ini sudah benar? (Ya/Tidak)`;
      
      quickActions.push(
        { label: 'Ya, Benar', action: 'confirm_booking', type: 'primary' },
        { label: 'Tidak, Ubah', action: 'edit_booking', type: 'secondary' }
      );
    } else if (missingFields.length > 0) {
      // Missing information - ask for specific fields
      response = `Untuk melengkapi pemesanan, saya masih membutuhkan informasi berikut:
- ${missingFields.join('\n- ')}

Silakan berikan informasi tersebut.`;
      
      quickActions.push(
        { label: 'Pesan Ruangan', action: 'book_room', type: 'primary' },
        { label: 'Lihat Ruangan', action: 'view_rooms', type: 'secondary' }
      );
    } else {
      // General booking help
      response = `Saya siap membantu Anda memesan ruangan meeting. Silakan berikan informasi berikut:
- Nama ruangan yang diinginkan
- Topik rapat
- PIC (Penanggung Jawab)
- Jumlah peserta
- Tanggal dan jam
- Jenis rapat (Internal/Eksternal)`;
      
      quickActions.push(
        { label: 'Pesan Ruangan', action: 'book_room', type: 'primary' },
        { label: 'Lihat Ruangan', action: 'view_rooms', type: 'secondary' }
      );
    }
    
    // Add to conversation history
    this.addToHistory('assistant', response);
    
    return {
      message: response,
      action: 'continue',
      quickActions: quickActions,
      bookingData: extractedData
    };
  }

  // Handle facility selection
  private handleFacilitySelection(facility: string): RBAResponse {
    console.log('🔧 Facility selected:', facility);
    
    // Get current booking data
    const currentBooking = this.context.currentBooking;
    const currentFacilities = currentBooking.facilities || [];
    
    // Check if facility is already selected
    if (currentFacilities.includes(facility)) {
      // Remove facility if already selected
      const updatedFacilities = currentFacilities.filter(f => f !== facility);
      this.context.currentBooking.facilities = updatedFacilities;
      
      return {
        message: `✅ Fasilitas "${facility}" telah dihapus dari pilihan Anda.\n\nFasilitas yang dipilih: ${updatedFacilities.length > 0 ? updatedFacilities.join(', ') : 'Belum ada'}`,
        action: 'continue',
        quickActions: this.generateFacilityQuickActions(currentBooking.roomName || ''),
        bookingData: this.context.currentBooking
      };
    } else {
      // Add facility if not selected
      const updatedFacilities = [...currentFacilities, facility];
      this.context.currentBooking.facilities = updatedFacilities;
      
      return {
        message: `✅ Fasilitas "${facility}" telah ditambahkan ke pilihan Anda.\n\nFasilitas yang dipilih: ${updatedFacilities.join(', ')}`,
        action: 'continue',
        quickActions: this.generateFacilityQuickActions(currentBooking.roomName || ''),
        bookingData: this.context.currentBooking
      };
    }
  }

  // Generate facility quick actions for a room
  private generateFacilityQuickActions(roomName: string): any[] {
    const roomFacilities = this.getRoomFacilities(roomName);
    const selectedFacilities = this.context.currentBooking.facilities || [];
    
    const quickActions = [];
    
    roomFacilities.forEach(facility => {
      const isSelected = selectedFacilities.includes(facility);
      quickActions.push({
        label: `${isSelected ? '✅' : '⬜'} ${facility}`,
        action: `select_facility_${facility.toLowerCase().replace(/\s+/g, '_')}`,
        type: isSelected ? 'primary' : 'secondary'
      });
    });
    
    // Add confirmation button if facilities are selected
    if (selectedFacilities.length > 0) {
      quickActions.push({
        label: 'Selesai Pilih Fasilitas',
        action: 'finish_facility_selection',
        type: 'primary'
      });
    }
    
    return quickActions;
  }

  // Handle finish facility selection
  private handleFinishFacilitySelection(): RBAResponse {
    const currentBooking = this.context.currentBooking;
    const selectedFacilities = currentBooking.facilities || [];
    
    if (selectedFacilities.length === 0) {
      return {
        message: 'Anda belum memilih fasilitas apapun. Silakan pilih fasilitas yang ingin Anda gunakan.',
        action: 'continue',
        quickActions: this.generateFacilityQuickActions(currentBooking.roomName || ''),
        bookingData: currentBooking
      };
    }
    
    // Show final confirmation with selected facilities
    const response = `Baik! Saya sudah mencatat detail pemesanan Anda:
- Ruangan: ${currentBooking.roomName || 'Belum dipilih'}
- Topik Rapat: ${currentBooking.topic || 'Belum ditentukan'}
- PIC: ${currentBooking.pic || 'Belum ditentukan'}
- Jumlah Peserta: ${currentBooking.participants || 'Belum ditentukan'} orang
- Tanggal & Jam: ${currentBooking.date || 'Belum ditentukan'}, ${currentBooking.time || 'Belum ditentukan'}
- Jenis Rapat: ${currentBooking.meetingType || 'Belum ditentukan'}
- Fasilitas yang dipilih: ${selectedFacilities.join(', ')}

Apakah semua informasi ini sudah benar? (Ya/Tidak)`;
    
    return {
      message: response,
      action: 'continue',
      quickActions: [
        { label: 'Ya, Benar', action: 'confirm_booking', type: 'primary' },
        { label: 'Tidak, Ubah', action: 'edit_booking', type: 'secondary' },
        { label: 'Ubah Fasilitas', action: 'change_facilities', type: 'secondary' }
      ],
      bookingData: currentBooking
    };
  }

  // Handle booking errors
  private handleBookingError(userInput: string, error: any): RBAResponse {
    console.error('Booking error:', error);
    
    let response = 'Maaf, terjadi kesalahan dalam memproses permintaan Anda. ';
    
    if (error.message === 'QUOTA_EXCEEDED') {
      response += 'Saat ini saya dalam mode terbatas karena quota API harian sudah habis. Silakan coba lagi besok atau gunakan fitur booking manual.';
    } else {
      response += 'Silakan coba lagi atau gunakan opsi di bawah ini.';
    }
    
    const quickActions = [
      { label: 'Pesan Ruangan', action: 'book_room', type: 'primary' as const },
      { label: 'Lihat Ruangan', action: 'view_rooms', type: 'secondary' as const },
      { label: 'Bantuan', action: 'help', type: 'secondary' as const }
    ];
    
    this.addToHistory('assistant', response);
    
    return {
      message: response,
      action: 'continue',
      quickActions: quickActions
    };
  }


  // Update booking context with new data
  private updateBookingContext(newData: Partial<Booking>): void {
    console.log('🔍 updateBookingContext - newData:', newData);
    console.log('🔍 updateBookingContext - current context before:', this.context.currentBooking);
    this.context.currentBooking = { ...this.context.currentBooking, ...newData };
    console.log('🔍 updateBookingContext - current context after:', this.context.currentBooking);
  }

  // Handle intelligent fallback when API quota is exceeded
  private handleIntelligentFallback(userInput: string, error: any): RBAResponse {
    const lowerInput = userInput.toLowerCase();
    
    // Check if it's a booking intent
    const bookingKeywords = ['pesan', 'booking', 'reservasi', 'ruang', 'meeting', 'rapat'];
    const hasBookingIntent = bookingKeywords.some(keyword => lowerInput.includes(keyword));
    
    if (hasBookingIntent) {
      // Analyze booking input for fallback
      const bookingAnalysis = this.analyzeBookingInput(userInput);
      
      if (bookingAnalysis.confidence > 0.5) {
        // High confidence - provide smart response
        return this.generateSmartBookingResponse(bookingAnalysis);
      } else {
        // Low confidence - ask for more details
        return this.generateBookingGuidanceResponse(bookingAnalysis);
      }
    } else {
      // General conversation - provide helpful response
      return this.generateGeneralFallbackResponse(userInput);
    }
  }

  // Generate smart booking response for fallback
  private generateSmartBookingResponse(bookingAnalysis: any): RBAResponse {
    const { extractedData, missingFields } = bookingAnalysis;
    
    let message = "Baik! Saya akan membantu Anda booking ruang meeting. ";
    
    if (extractedData.date) {
      message += `Tanggal: ${extractedData.date}. `;
    }
    if (extractedData.time) {
      message += `Waktu: ${extractedData.time}. `;
    }
    if (extractedData.participants) {
      message += `Peserta: ${extractedData.participants} orang. `;
    }
    if (extractedData.topic) {
      message += `Topik: ${extractedData.topic}. `;
    }
    
    if (missingFields.length > 0) {
      message += `\n\nUntuk melengkapi booking, saya masih perlu: ${missingFields.join(', ')}.`;
    } else {
      message += "\n\nSemua informasi sudah lengkap! Apakah Anda ingin melanjutkan dengan booking?";
    }
    
    const quickActions = this.generateContextualQuickActions(bookingAnalysis, "");
    
    return {
      message: message,
      action: 'continue',
      quickActions: quickActions,
      bookingData: extractedData
    };
  }

  // Generate booking guidance response for fallback
  private generateBookingGuidanceResponse(bookingAnalysis: any): RBAResponse {
    const { missingFields } = bookingAnalysis;
    
    let message = "Baik! Saya akan membantu Anda booking ruang meeting. ";
    message += "Untuk memberikan rekomendasi ruangan terbaik, saya perlu informasi berikut:\n\n";
    message += "• Tanggal dan waktu yang diinginkan\n";
    message += "• Jumlah peserta\n";
    message += "• Topik atau jenis meeting\n";
    message += "• Fasilitas yang dibutuhkan (opsional)\n\n";
    message += "Silakan berikan informasi tersebut atau gunakan tombol di bawah.";
    
    const quickActions = [
      { label: 'Hari Ini', action: 'date_hari_ini', icon: '📅', type: 'secondary' as const },
      { label: 'Besok', action: 'date_besok', icon: '📅', type: 'secondary' as const },
      { label: 'Lihat Ruangan', action: 'view_rooms', icon: '🏢', type: 'secondary' as const },
      { label: 'Bantuan', action: 'help', icon: '❓', type: 'secondary' as const }
    ];
    
    return {
      message: message,
      action: 'continue',
      quickActions: quickActions
    };
  }

  // Generate general fallback response
  private generateGeneralFallbackResponse(userInput: string): RBAResponse {
    const lowerInput = userInput.toLowerCase();
    
    let message = "Halo! Saya Spacio AI Assistant. ";
    
    if (lowerInput.includes('hi') || lowerInput.includes('halo') || lowerInput.includes('hai')) {
      message += "Ada yang bisa saya bantu? Saya bisa membantu Anda dengan booking ruang meeting atau menjawab pertanyaan tentang ruangan dan fasilitas.";
    } else if (lowerInput.includes('bantuan') || lowerInput.includes('help')) {
      message += "Saya bisa membantu Anda dengan:\n\n• Booking ruang meeting\n• Informasi ruangan dan fasilitas\n• Panduan penggunaan sistem\n\nApa yang ingin Anda ketahui?";
    } else {
      message += "Saya bisa membantu Anda dengan booking ruang meeting atau menjawab pertanyaan tentang ruangan dan fasilitas. Ada yang bisa saya bantu?";
    }
    
    const quickActions = [
      { label: 'Pesan Ruangan', action: 'booking_start', icon: '📅', type: 'primary' as const },
      { label: 'Lihat Ruangan', action: 'view_rooms', icon: '🏢', type: 'secondary' as const },
      { label: 'Bantuan', action: 'help', icon: '❓', type: 'secondary' as const }
    ];
    
    return {
      message: message,
      action: 'continue',
      quickActions: quickActions
    };
  }

  // Build advanced Gemini prompt with interactive booking system
  private buildAdvancedGeminiPrompt(userInput: string, bookingAnalysis: any): string {
    const { extractedData, missingFields, confidence } = bookingAnalysis;
    const conversationHistory = this.buildConversationHistoryForPrompt();
    
    let prompt = `Anda adalah Spacio AI Assistant - Asisten AI Pemesanan Ruangan yang ramah dan cerdas.

TUJUAN: Membantu user memesan ruangan meeting dengan cara yang natural dan interaktif.

INFORMASI YANG DIBUTUHKAN:
1. Nama Ruangan
2. Topik Rapat  
3. PIC (Penanggung Jawab)
4. Jumlah Peserta
5. Tanggal & Jam
6. Jenis Rapat (Internal/Eksternal)

RUANGAN TERSEDIA:
- Samudrantha Meeting Room (Kapasitas: 10 orang)
- Cedaya Meeting Room (Kapasitas: 15 orang)
- Celebes Meeting Room (Kapasitas: 15 orang)
- Kalamanthana Meeting Room (Kapasitas: 15 orang)
- Ruang Nasionalis (Kapasitas: 15 orang)
- Ruang Meeting A (Kapasitas: 8 orang)
- Ruang Konferensi Bintang (Kapasitas: 12 orang)
- Auditorium Utama (Kapasitas: 50 orang)
- Ruang Kolaborasi Alpha (Kapasitas: 6 orang)

RIWAYAT PERCAKAPAN:
${conversationHistory}

INPUT USER SAAT INI: "${userInput}"

DATA YANG SUDAH DIKUMPULKAN:
${JSON.stringify(extractedData, null, 2)}

FIELD YANG MASIH KURANG: ${missingFields.join(', ') || 'Tidak ada'}

TINGKAT KELENGKAPAN: ${(confidence * 100).toFixed(0)}%

PANDUAN RESPON:

1. JIKA DATA SUDAH LENGKAP (6 field):
Langsung konfirmasi dengan format:
"Baik! Saya sudah mencatat semua detail pemesanan Anda:
- Ruangan: [Nama Ruangan]
- Topik Rapat: [Topik]
- PIC: [PIC]
- Jumlah Peserta: [Jumlah] orang
- Tanggal & Jam: [Tanggal], pukul [Jam]
- Jenis Rapat: [Jenis]

Apakah semua informasi ini sudah benar? (Ya/Tidak)"

2. JIKA USER KONFIRMASI "YA":
Langsung ke form berhasil:
"Pemesanan ruangan Anda berhasil! Terima kasih telah menggunakan layanan kami.

Detail pemesanan:
- ID Booking: AI-${Math.floor(Math.random() * 1000)}
- Ruangan: [Nama Ruangan]
- Tanggal: [Tanggal]
- Waktu: [Jam]

Silakan periksa email Anda untuk detail lebih lanjut."

3. JIKA RUANGAN TIDAK DITEMUKAN:
"Maaf, [nama ruangan] tidak terdaftar dalam sistem kami. Berikut rekomendasi ruangan yang tersedia untuk [jumlah] peserta:

1. [Ruang 1] (Kapasitas: [X] orang)
2. [Ruang 2] (Kapasitas: [X] orang)
3. [Ruang 3] (Kapasitas: [X] orang)

Mana yang ingin Anda pilih?"

4. JIKA MASIH ADA YANG KURANG:
"Untuk melengkapi pemesanan, saya masih membutuhkan:
- [Field yang kurang 1]
- [Field yang kurang 2]

Silakan berikan informasi tersebut."

5. JIKA USER MINTA REKOMENDASI:
"Baik, berikut rekomendasi ruangan untuk [jumlah] peserta pada [tanggal] pukul [jam]:

1. [Ruang 1] (Kapasitas: [X] orang)
2. [Ruang 2] (Kapasitas: [X] orang)
3. [Ruang 3] (Kapasitas: [X] orang)

Mana yang ingin Anda pilih?"

KARAKTERISTIK RESPON:
- Ramah dan sopan
- Jelas dan mudah dipahami
- Natural dalam Bahasa Indonesia
- Selalu berikan opsi atau pertanyaan lanjutan
- Hindari kalimat yang terlalu panjang

Jawab sesuai dengan situasi di atas:`;

    return prompt;
  }

  // Build conversation history for prompt
  private buildConversationHistoryForPrompt(): string {
    const history = this.context.conversationHistory.slice(-6); // Last 6 messages
    if (history.length === 0) return "Belum ada riwayat percakapan.";
    
    return history.map((msg, index) => {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      const content = msg.content.length > 100 ? msg.content.substring(0, 100) + '...' : msg.content;
      return `${index + 1}. ${role}: ${content}`;
    }).join('\n');
  }

  // Build conversation context for OpenAI API
  private buildConversationContext(userInput: string, bookingAnalysis: any): any[] {
    const systemPrompt = this.buildAdvancedSystemPrompt();
    const conversationHistory = this.buildConversationHistory();
    const currentContext = this.buildCurrentContext(bookingAnalysis);
    
    return [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userInput },
      { role: 'assistant', content: currentContext }
    ];
  }

  // Build advanced system prompt for OpenAI
  private buildAdvancedSystemPrompt(): string {
    return `Anda adalah Spacio AI Assistant - Sistem AI Pemesanan & Asisten Ruangan Cerdas yang sangat advanced.

KEMAMPUAN ANDA:
1. CONTEXTUAL UNDERSTANDING - Memahami konteks percakapan dan mengingat riwayat
2. AMBIGUITY RESOLUTION - Menangani ambiguitas dengan pertanyaan klarifikasi yang spesifik
3. MULTI-TURN CONVERSATIONS - Mempertahankan percakapan kompleks dan bertahap
4. KNOWLEDGE BASE & Q&A - Menjawab pertanyaan tentang ruangan, fasilitas, dan kebijakan
5. INTELLIGENT ROOM RECOMMENDATION - Merekomendasikan ruangan berdasarkan kriteria multi-dimensi
6. PROACTIVE ASSISTANCE - Memberikan saran dan rekomendasi yang proaktif

KONTEKS SISTEM SPACIO:
- Aplikasi: Spacio (Smart Room Booking & Assistant AI)
- Database: Ruangan dengan kapasitas, lokasi, fasilitas standar, status ketersediaan
- Fitur: Booking, rekomendasi cerdas, Q&A, konflik detection, notifikasi

DATABASE RUANGAN (Contoh):
- Ruang Meeting A: Lantai 3, Kapasitas 8, Fasilitas: Proyektor, Whiteboard, Wi-Fi
- Ruang Konferensi Bintang: Lantai 5, Kapasitas 12, Fasilitas: Proyektor, Sound System, Video Conference
- Auditorium Utama: Lantai 1, Kapasitas 50, Fasilitas: Panggung, Sound System, Layar Besar
- Ruang Kolaborasi Alpha: Lantai 2, Kapasitas 6, Fasilitas: Whiteboard Besar, TV Smart, Meja Fleksibel

TUGAS ANDA:
1. ANALISIS INPUT: Ekstrak informasi booking dari input user dengan NLU lanjutan
2. CONTEXTUAL RESPONSE: Berikan respons berdasarkan konteks percakapan sebelumnya
3. AMBIGUITY HANDLING: Jika input tidak jelas, ajukan pertanyaan klarifikasi yang spesifik
4. KNOWLEDGE Q&A: Jawab pertanyaan tentang ruangan, fasilitas, kebijakan dengan akurat
5. SMART RECOMMENDATION: Berikan rekomendasi ruangan berdasarkan algoritma prioritas
6. PROACTIVE GUIDANCE: Berikan saran dan panduan yang proaktif

ALGORITMA REKOMENDASI RUANGAN:
1. Ketersediaan Waktu (Prioritas Utama)
2. Kapasitas (Paling mendekati jumlah peserta)
3. Fasilitas Kunci (Sesuai kebutuhan)
4. Jenis Ruangan (Berdasarkan topik meeting)
5. Lokasi (Preferensi pengguna)

CONTOH RESPON CERDAS:
- "Apa fasilitas di Ruang Meeting A?" → "Ruang Meeting A memiliki: Proyektor, Whiteboard, Wi-Fi, Meja Konferensi, dan Kursi Ergonomis. Cocok untuk rapat tim hingga 8 orang."
- "Besok jam 2 rapat strategi 10 orang" → "Baik! Untuk rapat strategi 10 orang besok jam 2, saya merekomendasikan Ruang Konferensi Bintang di Lantai 5. Kapasitas 12 orang dengan proyektor dan sound system. Apakah Anda setuju?"
- "Apakah ada yang lebih kecil?" → "Ya, ada Ruang Meeting A di Lantai 3 dengan kapasitas 8 orang. Namun untuk 10 orang mungkin agak sempit. Apakah Anda ingin tetap menggunakan Ruang Konferensi Bintang?"

RESPONS HARUS:
- Natural dan conversational dalam Bahasa Indonesia
- Cerdas dan informatif dengan konteks yang tepat
- Proaktif dalam memberikan saran dan rekomendasi
- Menangani ambiguitas dengan pertanyaan klarifikasi yang spesifik
- Mengingat konteks percakapan sebelumnya

Jawab dengan cerdas dan proaktif:`;
  }

  // Build conversation history for context
  private buildConversationHistory(): any[] {
    const history = this.context.conversationHistory.slice(-6); // Last 6 messages
    return history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
  }

  // Build current context information
  private buildCurrentContext(bookingAnalysis: any): string {
    const { extractedData, missingFields, confidence } = bookingAnalysis;
    
    let context = "KONTEKS SAAT INI:\n";
    
    if (Object.keys(extractedData).length > 0) {
      context += `Data yang sudah dikumpulkan: ${JSON.stringify(extractedData)}\n`;
    }
    
    if (missingFields.length > 0) {
      context += `Informasi yang masih kurang: ${missingFields.join(', ')}\n`;
    }
    
    context += `Tingkat kepercayaan analisis: ${(confidence * 100).toFixed(0)}%\n`;
    
    if (this.context.currentBooking && Object.keys(this.context.currentBooking).length > 0) {
      context += `Booking yang sedang diproses: ${JSON.stringify(this.context.currentBooking)}\n`;
    }
    
    return context;
  }

  // Generate contextual quick actions
  private generateContextualQuickActions(bookingAnalysis: any, userInput: string): any[] {
    const { extractedData, missingFields, confidence } = bookingAnalysis;
    const actions = [];
    
    // If booking intent detected
    if (bookingAnalysis.hasBookingIntent) {
      // Check if this is a confirmation response
      if (extractedData.isConfirmation && confidence > 0.7) {
        // User confirmed - show booking success actions
        actions.push(
          { label: 'Lihat Detail Lengkap', action: 'view_booking_details', icon: '📋', type: 'primary' },
          { label: 'Booking Lagi', action: 'booking_start', icon: '📅', type: 'secondary' }
        );
      } else if (confidence > 0.7 && missingFields.length <= 2) {
        // High confidence - show confirmation
        actions.push(
          { label: 'Konfirmasi Booking', action: 'confirm_smart_booking', icon: '✅', type: 'primary' }
        );
      } else {
        // Low confidence - show completion options based on missing fields
        if (missingFields.includes('tanggal')) {
          actions.push(
            { label: 'Hari Ini', action: 'date_hari_ini', icon: '📅', type: 'secondary' },
            { label: 'Besok', action: 'date_besok', icon: '📅', type: 'secondary' }
          );
        }
        
        if (missingFields.includes('waktu')) {
          actions.push(
            { label: 'Jam 9 Pagi', action: 'time_09_00', icon: '🕘', type: 'secondary' },
            { label: 'Jam 2 Siang', action: 'time_14_00', icon: '🕐', type: 'secondary' }
          );
        }
        
        if (missingFields.includes('jumlah peserta')) {
          actions.push(
            { label: '5 Orang', action: 'participants_5', icon: '👥', type: 'secondary' },
            { label: '10 Orang', action: 'participants_10', icon: '👥', type: 'secondary' },
            { label: '15 Orang', action: 'participants_15', icon: '👥', type: 'secondary' }
          );
        }
        
        if (missingFields.includes('nama ruangan')) {
          actions.push(
            { label: 'Lihat Ruangan', action: 'view_rooms', icon: '🏢', type: 'secondary' }
          );
        }
        
        if (missingFields.includes('topik rapat')) {
          actions.push(
            { label: 'Rapat Tim', action: 'topic_rapat_tim', icon: '👥', type: 'secondary' },
            { label: 'Presentasi', action: 'topic_presentasi', icon: '📊', type: 'secondary' },
            { label: 'Training', action: 'topic_training', icon: '🎓', type: 'secondary' }
          );
        }
        
        if (missingFields.includes('PIC (penanggung jawab)')) {
          actions.push(
            { label: 'Saya Sendiri', action: 'pic_self', icon: '👤', type: 'secondary' }
          );
        }
        
        if (missingFields.includes('jenis rapat (internal/eksternal)')) {
          actions.push(
            { label: 'Internal', action: 'meeting_type_internal', icon: '🏢', type: 'secondary' },
            { label: 'Eksternal', action: 'meeting_type_external', icon: '🌐', type: 'secondary' }
          );
        }
      }
      
      // Add room-specific actions if room is specified
      if (extractedData.roomName) {
        actions.push(
          { label: 'Lihat Detail Ruangan', action: `room_detail_${extractedData.roomName.toLowerCase().replace(/\s+/g, '_')}`, icon: '🏢', type: 'secondary' }
        );
      }
      
      // Add recommendation action if participants are specified
      if (extractedData.participants) {
        actions.push(
          { label: 'Rekomendasi Ruangan', action: 'view_recommendations', icon: '💡', type: 'secondary' }
        );
      }
    } else {
      // General conversation - show general actions
      actions.push(
        { label: 'Pesan Ruangan', action: 'booking_start', icon: '📅', type: 'primary' },
        { label: 'Lihat Ruangan', action: 'view_rooms', icon: '🏢', type: 'secondary' },
        { label: 'Reservasi Saya', action: 'my_reservations', icon: '📋', type: 'secondary' }
      );
    }
    
    // Always show help
    actions.push(
      { label: 'Bantuan', action: 'help', icon: '❓', type: 'secondary' }
    );
    
    return actions;
  }

  // Advanced booking input analysis - NO LIMITATIONS
  private analyzeBookingInput(userInput: string): {
    hasBookingIntent: boolean;
    extractedData: Partial<Booking>;
    confidence: number;
    missingFields: string[];
  } {
    const lower = userInput.toLowerCase();
    const extracted: Partial<Booking> = {};
    const missingFields: string[] = [];
    
    // AI Agent sekarang menganalisis SEMUA input tanpa batasan
    // Tidak ada lagi pembatasan keyword - AI akan menganalisis semua input secara cerdas
    console.log('🧠 AI Agent: Analyzing ALL input intelligently without limitations');
    
    // Selalu anggap sebagai booking intent untuk analisis AI
    const isBookingContinuation = true;
    
    // Spacio room names from database
    const spacioRooms = [
      'samudrantha meeting room', 'cedaya meeting room', 'celebes meeting room',
      'kalamanthana meeting room', 'ruang nasionalis', 'ruang meeting a',
      'ruang konferensi bintang', 'auditorium utama', 'ruang kolaborasi alpha'
    ];
    
    // Extract room name - more flexible matching
    const roomMatch = spacioRooms.find(room => lower.includes(room));
    if (roomMatch) {
      extracted.roomName = roomMatch.charAt(0).toUpperCase() + roomMatch.slice(1);
    } else {
      // Try to extract any room name mentioned (even if not in database)
      const roomPatterns = [
        /([a-zA-Z\s]+)\s+meeting\s+room/i,
        /ruang\s+([a-zA-Z\s]+)/i,
        /([a-zA-Z\s]+)\s+room/i,
        /booking\s+ruang\s+([a-zA-Z\s]+)/i,
        /pesan\s+ruang\s+([a-zA-Z\s]+)/i
      ];
      
      for (const pattern of roomPatterns) {
        const match = userInput.match(pattern);
        if (match && match[1]) {
          const roomName = match[1].trim();
          if (roomName.length > 2) {
            extracted.roomName = roomName;
            extracted.roomNotFound = true; // Flag untuk ruangan tidak ditemukan
            break;
          }
        }
      }
      
      // If no specific room mentioned, but "ruang meeting" is mentioned, set default
      if (!extracted.roomName && (lower.includes('ruang meeting') || lower.includes('booking ruang'))) {
        extracted.roomName = 'Ruang Meeting (Belum Dipilih)';
        extracted.roomNotFound = true;
      }
    }
    
    // Extract PIC (Person in Charge) - more flexible and comprehensive
    const picPatterns = [
      /pic[:\s-]*([a-zA-Z\s]+)/i,
      /penanggung jawab[:\s-]*([a-zA-Z\s]+)/i,
      /atas nama[:\s-]*([a-zA-Z\s]+)/i,
      /pic-nya\s+([a-zA-Z\s]+)/i,
      /picnya\s+([a-zA-Z]+)/i,
      /pic\s+([a-zA-Z\s]+)/i,
      /penanggung\s+jawab\s+([a-zA-Z\s]+)/i,
      /penanggung\s+jawabnya\s+([a-zA-Z]+)/i,
      /yang\s+bertanggung\s+jawab\s+([a-zA-Z\s]+)/i,
      /bertanggung\s+jawab\s+([a-zA-Z\s]+)/i
    ];
    
    for (const pattern of picPatterns) {
      const match = userInput.match(pattern);
      if (match && match[1]) {
        const pic = match[1].trim();
        if (pic.length > 1 && pic !== 'belum' && pic !== 'ditentukan') {
          extracted.pic = pic;
          break;
        }
      }
    }
    
    // If no PIC found with patterns, try to find names after common words
    if (!extracted.pic) {
      const namePatterns = [
        /picnya\s+([a-zA-Z]+)/i,
        /pic\s+([a-zA-Z]+)/i,
        /penanggung\s+jawab\s+([a-zA-Z]+)/i,
        /penanggung\s+jawabnya\s+([a-zA-Z]+)/i,
        /yang\s+bertanggung\s+jawab\s+([a-zA-Z]+)/i,
        /bertanggung\s+jawab\s+([a-zA-Z]+)/i
      ];
      
      for (const pattern of namePatterns) {
        const match = userInput.match(pattern);
        if (match && match[1]) {
          const pic = match[1].trim();
          if (pic !== 'belum' && pic !== 'ditentukan') {
            extracted.pic = pic;
            break;
          }
        }
      }
    }
    
    // If still no PIC found, try to extract names from context
    if (!extracted.pic) {
      // Look for common Indonesian names or name patterns
      const namePatterns = [
        /([A-Z][a-z]+\s+[A-Z][a-z]+)/, // First Last format
        /([A-Z][a-z]+)/ // Single name
      ];
      
      for (const pattern of namePatterns) {
        const match = userInput.match(pattern);
        if (match && match[1]) {
          const name = match[1].trim();
          // Check if it's not a common booking word
          const excludeWords = ['ruang', 'room', 'meeting', 'rapat', 'booking', 'pesan', 
                               'tanggal', 'date', 'jam', 'time', 'pukul', 'orang', 'peserta',
                               'internal', 'eksternal', 'pic', 'penanggung', 'jawab', 'untuk',
                               'topik', 'topic', 'presentasi', 'diskusi', 'agenda'];
          
          if (!excludeWords.includes(name.toLowerCase()) && name.length > 2) {
            extracted.pic = name;
            break;
          }
        }
      }
    }
    
    // Extract topic/meeting purpose - more flexible and comprehensive
    const topicPatterns = [
      // Pattern untuk "untuk [topic]"
      /untuk\s+([^,]+?)(?:\s+pic|\s+\d+\s+orang|\s+tanggal|\s+jam|\s+internal|\s+eksternal|$)/i,
      // Pattern untuk "topik [topic]"
      /topik[:\s-]*([^,]+?)(?:\s+pic|\s+\d+\s+orang|\s+tanggal|\s+jam|\s+internal|\s+eksternal|$)/i,
      // Pattern untuk "rapat [topic]"
      /rapat[:\s-]*([^,]+?)(?:\s+pic|\s+\d+\s+orang|\s+tanggal|\s+jam|\s+internal|\s+eksternal|$)/i,
      // Pattern untuk "topiknya [topic]"
      /topiknya\s+([^,]+?)(?:\s+pic|\s+\d+\s+orang|\s+tanggal|\s+jam|\s+internal|\s+eksternal|$)/i,
      // Pattern untuk "meeting [topic]"
      /meeting[:\s-]*([^,]+?)(?:\s+pic|\s+\d+\s+orang|\s+tanggal|\s+jam|\s+internal|\s+eksternal|$)/i,
      // Pattern untuk "presentasi [topic]"
      /presentasi[:\s-]*([^,]+?)(?:\s+pic|\s+\d+\s+orang|\s+tanggal|\s+jam|\s+internal|\s+eksternal|$)/i,
      // Pattern untuk "diskusi [topic]"
      /diskusi[:\s-]*([^,]+?)(?:\s+pic|\s+\d+\s+orang|\s+tanggal|\s+jam|\s+internal|\s+eksternal|$)/i
    ];
    
    for (const pattern of topicPatterns) {
      const match = userInput.match(pattern);
      if (match && match[1]) {
        const topic = match[1].trim();
        if (topic && topic.length > 2) {
          extracted.topic = topic;
          break;
        }
      }
    }
    
    // If no topic found, try simpler patterns
    if (!extracted.topic) {
      const simpleTopicPatterns = [
        /topiknya\s+([a-zA-Z\s]+)/i,
        /untuk\s+([a-zA-Z\s]+)/i,
        /rapat\s+([a-zA-Z\s]+)/i,
        /meeting\s+([a-zA-Z\s]+)/i,
        /presentasi\s+([a-zA-Z\s]+)/i,
        /diskusi\s+([a-zA-Z\s]+)/i,
        /agenda\s+([a-zA-Z\s]+)/i
      ];
      
      for (const pattern of simpleTopicPatterns) {
        const match = userInput.match(pattern);
        if (match && match[1]) {
          const topic = match[1].trim();
          if (topic.length > 2 && !topic.includes('pic') && !topic.includes('orang') && 
              !topic.includes('tanggal') && !topic.includes('jam') && !topic.includes('internal') && 
              !topic.includes('eksternal')) {
            extracted.topic = topic;
            break;
          }
        }
      }
    }
    
    // If still no topic found, try to extract from context
    if (!extracted.topic) {
      // Look for common meeting topics in the input
      const commonTopics = [
        'tim', 'team', 'development', 'proyek', 'project', 'client', 'customer', 
        'vendor', 'supplier', 'partner', 'review', 'evaluasi', 'planning', 
        'perencanaan', 'training', 'pelatihan', 'presentasi', 'demo', 'demo',
        'brainstorming', 'strategi', 'strategy', 'budget', 'anggaran', 'sales',
        'penjualan', 'marketing', 'pemasaran', 'hr', 'human resources', 'sdm',
        'finance', 'keuangan', 'accounting', 'akuntansi', 'legal', 'hukum',
        'compliance', 'kepatuhan', 'quality', 'kualitas', 'production', 'produksi'
      ];
      
      for (const topic of commonTopics) {
        if (lower.includes(topic)) {
          extracted.topic = topic.charAt(0).toUpperCase() + topic.slice(1);
          break;
        }
      }
    }
    
    // If still no topic, try to extract any meaningful words
    if (!extracted.topic) {
      // Extract words that might be topics (avoid common booking words)
      const excludeWords = ['ruang', 'room', 'meeting', 'rapat', 'booking', 'pesan', 
                           'tanggal', 'date', 'jam', 'time', 'pukul', 'orang', 'peserta',
                           'internal', 'eksternal', 'pic', 'penanggung', 'jawab', 'untuk',
                           'topik', 'topic', 'presentasi', 'diskusi', 'agenda', 'sampai',
                           'dari', 'ke', 'dengan', 'dan', 'atau', 'yang', 'ini', 'itu'];
      
      const words = userInput.toLowerCase().split(/\s+/);
      const potentialTopics = words.filter(word => 
        word.length > 3 && 
        !excludeWords.includes(word) &&
        !/^\d+$/.test(word) && // not just numbers
        !/^[a-z]$/.test(word) // not single letters
      );
      
      if (potentialTopics.length > 0) {
        // Take the first meaningful word, but make sure it's not too generic
        const topic = potentialTopics[0];
        if (topic !== 'rapat' && topic !== 'meeting' && topic !== 'booking') {
          extracted.topic = topic.charAt(0).toUpperCase() + topic.slice(1);
        }
      }
    }
    
    // Final validation - if topic is too generic, don't set it
    if (extracted.topic && (extracted.topic.toLowerCase() === 'rapat' || 
                           extracted.topic.toLowerCase() === 'meeting' ||
                           extracted.topic.toLowerCase() === 'booking')) {
      extracted.topic = undefined;
    }
    
    // Extract participants count
    const participantPatterns = [
      /(\d+)\s*(?:orang|peserta|people|pax)/i,
      /untuk\s+(\d+)\s*(?:orang|peserta|people|pax)/i,
      /(\d+)\s*(?:orang|peserta|people|pax)\s*(?:yang|akan|hadir)/i
    ];
    
    for (const pattern of participantPatterns) {
      const match = userInput.match(pattern);
      if (match && match[1]) {
        extracted.participants = parseInt(match[1]);
        break;
      }
    }
    
    // Extract date - more comprehensive
    if (lower.includes('besok')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      extracted.date = tomorrow.toISOString().split('T')[0];
    } else if (lower.includes('hari ini')) {
      extracted.date = new Date().toISOString().split('T')[0];
    } else if (lower.includes('lusa')) {
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      extracted.date = dayAfterTomorrow.toISOString().split('T')[0];
    } else {
      // Try to extract specific dates
      const datePatterns = [
        /(\d{1,2})\s*(?:september|oktober|november|desember|januari|februari|maret|april|mei|juni|juli|agustus)\s*(\d{4})/i,
        /(\d{4})-(\d{1,2})-(\d{1,2})/,
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/
      ];
      
      for (const pattern of datePatterns) {
        const match = userInput.match(pattern);
        if (match) {
          // Convert to ISO date format
          let year, month, day;
          if (pattern.source.includes('september|oktober')) {
            // Indonesian month names
            const monthNames = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 
                              'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];
            const monthIndex = monthNames.findIndex(m => lower.includes(m));
            if (monthIndex !== -1) {
              day = parseInt(match[1]);
              month = monthIndex + 1;
              year = parseInt(match[2]);
            }
          } else {
            year = parseInt(match[1]);
            month = parseInt(match[2]);
            day = parseInt(match[3]);
          }
          
          if (year && month && day) {
            extracted.date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            break;
          }
        }
      }
    }
    
    // Extract time - more comprehensive including time ranges
    const timeRangePatterns = [
      /jam\s*(\d{1,2})\s*sampai\s*jam\s*(\d{1,2})/i,
      /jam\s*(\d{1,2})\s*-\s*jam\s*(\d{1,2})/i,
      /jam\s*(\d{1,2})\s*ke\s*jam\s*(\d{1,2})/i,
      /(\d{1,2})\s*sampai\s*(\d{1,2})/i,
      /(\d{1,2})\s*-\s*(\d{1,2})/i,
      /(\d{1,2})\s*ke\s*(\d{1,2})/i
    ];
    
    // Check for time range patterns first
    for (const pattern of timeRangePatterns) {
      const match = lower.match(pattern);
      if (match) {
        const [, startHour, endHour] = match;
        const startHourNum = parseInt(startHour);
        const endHourNum = parseInt(endHour);
        
        if (startHourNum >= 0 && startHourNum <= 23 && endHourNum >= 0 && endHourNum <= 23) {
          extracted.time = `${startHourNum.toString().padStart(2, '0')}:00`;
          extracted.endTime = `${endHourNum.toString().padStart(2, '0')}:00`;
          break;
        }
      }
    }
    
    // If no time range found, check for single time patterns
    if (!extracted.time) {
      const timePatterns = [
        /(\d{1,2}):(\d{2})\s*(?:pagi|siang|sore|malam)?/i,
        /(\d{1,2})\s*(?:pagi|siang|sore|malam)/i,
        /jam\s+(\d{1,2})(?::(\d{2}))?\s*(?:pagi|siang|sore|malam)?/i,
        /jam\s+(\d{1,2})/i,
        /pukul\s+(\d{1,2})(?::(\d{2}))?/i
      ];
      
      for (const pattern of timePatterns) {
        const match = userInput.match(pattern);
        if (match) {
          let hour = parseInt(match[1]);
          const minute = match[2] ? parseInt(match[2]) : 0;
          const period = match[3] || (match[0].includes('pagi') ? 'pagi' : 
                                     match[0].includes('siang') ? 'siang' :
                                     match[0].includes('sore') ? 'sore' :
                                     match[0].includes('malam') ? 'malam' : '');
          
          if (period === 'sore' || period === 'malam') {
            hour += 12;
          } else if (period === 'siang' && hour < 12) {
            hour += 12;
          }
          
          extracted.time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          break;
        }
      }
    }
    
    // Extract meeting type - more intelligent detection
    if (lower.includes('internal')) {
      extracted.meetingType = 'internal';
    } else if (lower.includes('eksternal')) {
      extracted.meetingType = 'external';
    } else {
      // Intelligent detection based on context
      if (lower.includes('client') || lower.includes('customer') || lower.includes('vendor') || 
          lower.includes('supplier') || lower.includes('partner') || lower.includes('eksternal')) {
        extracted.meetingType = 'external';
      } else if (lower.includes('tim') || lower.includes('team') || lower.includes('internal') ||
                 lower.includes('karyawan') || lower.includes('staff') || lower.includes('internal')) {
        extracted.meetingType = 'internal';
      } else {
        // Default to internal if unclear
        extracted.meetingType = 'internal';
      }
    }
    
    // Check for confirmation responses
    const confirmationKeywords = ['ya', 'benar', 'setuju', 'ok', 'oke', 'baik', 'lanjutkan'];
    const isConfirmation = confirmationKeywords.some(keyword => lower.includes(keyword));
    
    if (isConfirmation) {
      extracted.isConfirmation = true;
    }
    
    // Combine with data from conversation history
    const combinedData = { ...this.context.currentBooking, ...extracted };
    
    // Calculate confidence based on required fields
    const requiredFields = ['roomName', 'topic', 'pic', 'participants', 'date', 'time', 'meetingType'];
    const extractedFields = requiredFields.filter(field => combinedData[field as keyof Booking]);
    const confidence = extractedFields.length / requiredFields.length;
    
    // Determine missing fields
    if (!combinedData.roomName) missingFields.push('nama ruangan');
    if (!combinedData.topic) missingFields.push('topik rapat');
    if (!combinedData.pic) missingFields.push('PIC (penanggung jawab)');
    if (!combinedData.participants) missingFields.push('jumlah peserta');
    if (!combinedData.date) missingFields.push('tanggal');
    if (!combinedData.time) missingFields.push('jam');
    if (!combinedData.meetingType) missingFields.push('jenis rapat (internal/eksternal)');
    
    console.log('🔍 analyzeBookingInput - extracted data:', extracted);
    console.log('🔍 analyzeBookingInput - combined data:', combinedData);
    console.log('🔍 analyzeBookingInput - confidence:', confidence);
    console.log('🔍 analyzeBookingInput - missing fields:', missingFields);
    
    // AI Agent selalu memberikan confidence tinggi untuk semua input
    const aiConfidence = Math.max(confidence, 0.7); // Minimum 70% confidence
    
    return {
      hasBookingIntent: true, // Selalu true - AI memproses semua input
      extractedData: combinedData,
      confidence: aiConfidence,
      missingFields: missingFields
    };
  }

  // Build smart booking prompt
  private buildSmartBookingPrompt(userInput: string, analysis: any): string {
    const { extractedData, missingFields, confidence } = analysis;
    
    return `Anda adalah Spacio AI Assistant - Sistem AI Pemesanan Ruangan Cerdas.

ANALISIS INPUT USER:
Input: "${userInput}"
Data yang berhasil diekstrak: ${JSON.stringify(extractedData)}
Confidence: ${(confidence * 100).toFixed(0)}%
Field yang masih kurang: ${missingFields.join(', ')}

TUGAS ANDA:
1. Berikan respons yang cerdas berdasarkan data yang sudah diekstrak
2. Jika data lengkap (>80%), berikan konfirmasi dan lanjut ke proses booking
3. Jika data kurang lengkap, tanyakan field yang masih kurang dengan cara yang natural
4. Berikan saran fasilitas berdasarkan topik meeting
5. Jika ada konflik potensial, berikan peringatan dan alternatif

CONTOH RESPON CERDAS:
- Data lengkap: "Baik! Saya sudah mencatat semua detail. Besok jam 10 untuk rapat tim 8 orang. Saya akan mencari ruangan dengan kapasitas minimal 8 orang dan fasilitas yang sesuai. Apakah Anda setuju dengan detail ini?"
- Data kurang: "Baik! Saya sudah mencatat beberapa detail. Untuk melengkapi booking, saya masih perlu tahu: ${missingFields.join(', ')}. Bisakah Anda memberikan informasi tersebut?"

RESPONS HARUS:
- Natural dan conversational dalam Bahasa Indonesia
- Cerdas dan informatif
- Mengarahkan ke proses booking yang sistematis
- Memberikan insight yang berguna

Jawab sekarang:`;
  }

  // Generate smart quick actions based on analysis
  private generateSmartQuickActions(analysis: any): any[] {
    const { extractedData, missingFields } = analysis;
    const actions = [];
    
    // If data is complete, show confirmation
    if (missingFields.length === 0) {
      actions.push(
        { label: 'Konfirmasi Booking', action: 'confirm_smart_booking', icon: '✅', type: 'primary' },
        { label: 'Ubah Detail', action: 'modify_booking', icon: '✏️', type: 'secondary' }
      );
    } else {
      // Show actions for missing fields
      if (missingFields.includes('tanggal')) {
        actions.push(
          { label: 'Hari Ini', action: 'date_hari_ini', icon: '📅', type: 'secondary' },
          { label: 'Besok', action: 'date_besok', icon: '📅', type: 'secondary' }
        );
      }
      
      if (missingFields.includes('waktu')) {
        actions.push(
          { label: 'Pagi (09:00)', action: 'time_pagi', icon: '🕘', type: 'secondary' },
          { label: 'Siang (12:00)', action: 'time_siang', icon: '🕛', type: 'secondary' },
          { label: 'Sore (15:00)', action: 'time_sore', icon: '🕒', type: 'secondary' }
        );
      }
      
      if (missingFields.includes('jumlah peserta')) {
        actions.push(
          { label: '5 Orang', action: 'participants_5', icon: '👥', type: 'secondary' },
          { label: '10 Orang', action: 'participants_10', icon: '👥', type: 'secondary' },
          { label: '15 Orang', action: 'participants_15', icon: '👥', type: 'secondary' }
        );
      }
    }
    
    // Always show general actions
    actions.push(
      { label: 'Bantuan', action: 'help', icon: '❓', type: 'secondary' }
    );
    
    return actions;
  }

  // Build prompt for general chat
  private buildGeneralChatPrompt(userInput: string): string {
    return `Anda adalah Spacio AI Assistant - Sistem AI Pemesanan Ruangan Cerdas yang sangat advanced.

KEMAMPUAN ANDA:
1. NATURAL LANGUAGE UNDERSTANDING (NLU) - Memahami bahasa alami Indonesia
2. SMART ROOM MATCHING - Mencocokkan ruangan berdasarkan kriteria optimal
3. CONFLICT DETECTION - Mendeteksi konflik jadwal dan memberikan alternatif
4. FACILITY MANAGEMENT - Mengelola fasilitas dan memberikan saran otomatis
5. CONVERSATIONAL BOOKING - Proses booking melalui percakapan natural

KONTEKS SISTEM:
- Aplikasi: Spacio (Smart Room Booking System)
- Database: Ruangan dengan kapasitas, lokasi, fasilitas standar
- Fitur: Booking, konflik detection, saran alternatif, notifikasi

PESAN USER: "${userInput}"

TUGAS ANDA:
1. ANALISIS INPUT: Ekstrak informasi booking dari input user (tanggal, waktu, peserta, topik, PIC, fasilitas)
2. SMART RESPONSE: Berikan respons yang cerdas berdasarkan konteks dan kebutuhan
3. GUIDED BOOKING: Jika user ingin booking, bimbing mereka melalui proses yang sistematis
4. CONFLICT HANDLING: Jika ada konflik, berikan alternatif yang optimal
5. FACILITY SUGGESTION: Berikan saran fasilitas berdasarkan topik meeting

CONTOH RESPON CERDAS:
- "pesan ruangan" → "Baik! Saya akan membantu Anda booking ruang meeting. Silakan berikan detail: tanggal, waktu, jumlah peserta, topik meeting, dan PIC. Saya akan mencari ruangan terbaik yang tersedia."
- "besok jam 10 rapat tim 8 orang" → "Baik! Besok jam 10 untuk rapat tim 8 orang. Saya akan cek ketersediaan ruangan dengan kapasitas minimal 8 orang. Apakah ada fasilitas khusus yang dibutuhkan? (proyektor, whiteboard, video conference)"
- "hi" → "Halo! Saya Spacio AI Assistant - sistem booking ruang meeting cerdas. Saya bisa membantu Anda memesan ruangan dengan analisis optimal, deteksi konflik, dan saran fasilitas. Apa yang bisa saya bantu?"

RESPONS HARUS:
- Natural dan conversational dalam Bahasa Indonesia
- Cerdas dan informatif (2-4 kalimat)
- Mengarahkan ke proses booking yang sistematis
- Memberikan value dan insight yang berguna

Jawab sekarang:`;
  }

  // Call Gemini API
  private async callGeminiAPI(prompt: string): Promise<string> {
    const url = `${this.baseUrl}?key=${this.apiKey}`;
    
    console.log('🤖 Calling Gemini API...');
    console.log('📝 Prompt length:', prompt.length);
    console.log('🔗 API URL:', url);
    console.log('🔑 Using API Key:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'NO KEY');
    console.log('⏰ Timestamp:', new Date().toISOString());
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    console.log('📡 Gemini API Response Status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Gemini API Error:', errorData);
      
      // Handle quota exceeded error
      if (response.status === 429) {
        console.warn('⚠️ Gemini API quota exceeded, switching to fallback mode');
        throw new Error('QUOTA_EXCEEDED');
      }
      
      throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('✅ Gemini API Response received');
    console.log('📊 Response Status:', response.status);
    console.log('📋 Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('📄 Full Response Data:', JSON.stringify(data, null, 2));
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const aiResponse = data.candidates[0].content.parts[0].text;
      console.log('🤖 AI Response Length:', aiResponse.length, 'characters');
      console.log('🤖 AI Response Preview:', aiResponse.substring(0, 200) + '...');
      console.log('🎯 AI Response Type:', typeof aiResponse);
      return aiResponse;
    } else {
      console.error('❌ Invalid response structure:', data);
      console.error('🔍 Available keys in response:', Object.keys(data));
      throw new Error('Invalid response from Gemini API');
    }
  }

  // Handle quick action clicks with improved functionality
  public async handleQuickAction(action: string, currentBooking: Partial<Booking> = {}): Promise<RBAResponse> {
    try {
      console.log('RBA: Handling quick action:', action);
      
      // Handle quick actions for data collection
      if (action.startsWith('topic_') || action.startsWith('topik_')) {
        const topic = action.replace(/^(topic_|topik_)/, '').replace(/_/g, ' ');
        this.context.dataCollection.topic = topic;
        return await this.processInput(`topik ${topic}`);
      }
      
      if (action.startsWith('meeting_')) {
        const meetingType = action.replace('meeting_', '') as 'internal' | 'external';
        this.context.dataCollection.meetingType = meetingType;
        return await this.processInput(`meeting ${meetingType}`);
      }
      
      if (action.startsWith('date_')) {
        const dateType = action.replace('date_', '');
        let dateValue = '';
        if (dateType === 'hari_ini') dateValue = 'hari ini';
        else if (dateType === 'besok') dateValue = 'besok';
        else if (dateType === 'lusa') dateValue = 'lusa';
        return await this.processInput(dateValue);
      }
      
      if (action.startsWith('time_')) {
        const time = action.replace('time_', '');
        return await this.processInput(`jam ${time}`);
      }
      
      if (action.startsWith('participants_')) {
        const participants = parseInt(action.replace('participants_', ''));
        return await this.processInput(`${participants} orang`);
      }
      
      if (action === 'confirm_booking') {
        return this.handleConfirmation();
      }
      
      // Handle facility selection
      if (action.startsWith('select_facility_')) {
        const facility = action.replace('select_facility_', '').replace(/_/g, ' ');
        return this.handleFacilitySelection(facility);
      }
      
      if (action === 'finish_facility_selection') {
        return this.handleFinishFacilitySelection();
      }
      
      // Handle common quick actions
      if (action === 'book_room' || action === 'Pesan Ruangan') {
        return {
          message: "Baik! Mari kita mulai proses pemesanan ruangan. Silakan beri tahu saya:\n\n• Ruangan yang diinginkan\n• Topik rapat\n• Jumlah peserta\n• Tanggal dan waktu\n• Jenis rapat (internal/eksternal)",
          action: 'continue',
          quickActions: [
            { label: 'Samudrantha (10 orang)', action: 'room_samudrantha', type: 'primary' },
            { label: 'Cedaya (15 orang)', action: 'room_cedaya', type: 'primary' },
            { label: 'Celebes (15 orang)', action: 'room_celebes', type: 'primary' },
            { label: 'Lihat Semua Ruangan', action: 'view_all_rooms', type: 'secondary' }
          ]
        };
      }
      
      if (action === 'view_rooms' || action === 'Lihat Ruangan') {
        const rooms = await this.getAvailableRoomsFromDatabase();
        const roomOptions = rooms.slice(0, 4).map(room => ({
          label: `${room.room_name} (${room.capacity} orang)`,
          action: `room_${room.room_name.toLowerCase().replace(/\s+/g, '_')}`,
          type: 'primary' as const
        }));
        
        return {
          message: `Berikut adalah ruangan yang tersedia:\n\n${rooms.map(room => 
            `🏢 ${room.room_name} (${room.capacity} orang)\n   📍 ${room.description || 'Ruang meeting standar'}\n   🔧 ${room.features || 'AC, Proyektor'}\n   📊 ${room.is_available ? '✅ Tersedia' : '❌ Tidak Tersedia'}\n`
          ).join('\n')}`,
          action: 'continue',
          quickActions: roomOptions
        };
      }
      
      if (action === 'bantuan' || action === 'Bantuan') {
        return {
          message: "Tentu! Saya dapat membantu Anda dengan:\n\n• 📅 Pemesanan ruang rapat\n• 🏢 Informasi ruangan tersedia\n• ⏰ Cek ketersediaan waktu\n• 📋 Panduan proses booking\n• ❓ Pertanyaan umum\n\nApa yang ingin Anda ketahui?",
          action: 'continue',
          quickActions: [
            { label: 'Cara Booking', action: 'help_booking', type: 'primary' },
            { label: 'Lihat Ruangan', action: 'view_rooms', type: 'primary' },
            { label: 'Cek Ketersediaan', action: 'check_availability', type: 'secondary' },
            { label: 'FAQ', action: 'faq', type: 'secondary' }
          ]
        };
      }
      
      // Handle room selection
      if (action.startsWith('room_')) {
        const roomName = action.replace('room_', '').replace(/_/g, ' ');
        this.context.currentBooking.roomName = roomName;
        return {
          message: `Bagus! Anda memilih ${roomName}. Sekarang saya perlu informasi tambahan:\n\n• Topik rapat\n• PIC (Penanggung Jawab)\n• Jumlah peserta\n• Tanggal dan waktu\n• Jenis rapat`,
          action: 'continue',
          quickActions: [
            { label: 'Hari Ini', action: 'date_hari_ini', type: 'primary' },
            { label: 'Besok', action: 'date_besok', type: 'primary' },
            { label: 'Lusa', action: 'date_lusa', type: 'secondary' }
          ]
        };
      }
      
      // Handle help actions
      if (action === 'help_booking') {
        return {
          message: "Proses booking sangat mudah! Ikuti langkah berikut:\n\n1️⃣ Pilih ruangan yang sesuai\n2️⃣ Tentukan topik rapat\n3️⃣ Masukkan nama PIC\n4️⃣ Tentukan jumlah peserta\n5️⃣ Pilih tanggal dan waktu\n6️⃣ Pilih jenis rapat (internal/eksternal)\n7️⃣ Konfirmasi pemesanan\n\nSaya akan membantu Anda melalui setiap langkah!",
          action: 'continue',
          quickActions: [
            { label: 'Mulai Booking', action: 'book_room', type: 'primary' },
            { label: 'Lihat Ruangan', action: 'view_rooms', type: 'secondary' }
          ]
        };
      }
      
      // Handle PIC input
      if (action === 'input_pic') {
        return {
          message: "Silakan masukkan nama PIC (Penanggung Jawab) rapat:\n\nContoh: John Doe, Sarah Wilson, dll.\n\nKetik nama PIC Anda:",
          action: 'continue',
          quickActions: [
            { label: 'Batal', action: 'cancel', type: 'secondary' }
          ]
        };
      }
      
      // Handle duration selection
      if (action === 'duration_2_hours') {
        if (this.context.currentBooking.time) {
          const startTime = this.context.currentBooking.time;
          const [hours, minutes] = startTime.split(':').map(Number);
          const endHours = hours + 2;
          const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          this.context.currentBooking.endTime = endTime;
          
          return {
            message: `✅ Durasi rapat ditetapkan 2 jam\n⏰ Waktu berakhir: ${endTime}\n\nData pemesanan Anda:\n${this.getBookingStatus()}`,
            action: 'continue',
            quickActions: [
              { label: 'Konfirmasi Booking', action: 'confirm_booking', type: 'primary' },
              { label: 'Ubah Data', action: 'modify_data', type: 'secondary' }
            ]
          };
        }
      }
      
      if (action === 'duration_3_hours') {
        if (this.context.currentBooking.time) {
          const startTime = this.context.currentBooking.time;
          const [hours, minutes] = startTime.split(':').map(Number);
          const endHours = hours + 3;
          const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          this.context.currentBooking.endTime = endTime;
          
          return {
            message: `✅ Durasi rapat ditetapkan 3 jam\n⏰ Waktu berakhir: ${endTime}\n\nData pemesanan Anda:\n${this.getBookingStatus()}`,
            action: 'continue',
            quickActions: [
              { label: 'Konfirmasi Booking', action: 'confirm_booking', type: 'primary' },
              { label: 'Ubah Data', action: 'modify_data', type: 'secondary' }
            ]
          };
        }
      }
      
      if (action === 'duration_4_hours') {
        if (this.context.currentBooking.time) {
          const startTime = this.context.currentBooking.time;
          const [hours, minutes] = startTime.split(':').map(Number);
          const endHours = hours + 4;
          const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          this.context.currentBooking.endTime = endTime;
          
          return {
            message: `✅ Durasi rapat ditetapkan 4 jam\n⏰ Waktu berakhir: ${endTime}\n\nData pemesanan Anda:\n${this.getBookingStatus()}`,
            action: 'continue',
            quickActions: [
              { label: 'Konfirmasi Booking', action: 'confirm_booking', type: 'primary' },
              { label: 'Ubah Data', action: 'modify_data', type: 'secondary' }
            ]
          };
        }
      }
      
      if (action === 'modify_data') {
        return this.handleModifyData();
      }
      
      if (action === 'change_room') {
        return this.handleChangeRoom();
      }
      
      if (action === 'booking_start') {
        return this.startBookingProcess();
      }
      
      if (action === 'my_reservations') {
        return {
          message: "Untuk melihat reservasi Anda, silakan gunakan menu 'Reservasi Saya' di aplikasi atau hubungi admin.",
          action: 'continue',
          quickActions: [
            { label: 'Pesan Ruangan', action: 'booking_start', icon: '📅', type: 'primary' },
            { label: 'Bantuan', action: 'help', icon: '❓', type: 'secondary' }
          ]
        };
      }
      
      if (action === 'help') {
        return {
          message: "Saya Spacio AI Assistant - Sistem AI Pemesanan & Asisten Ruangan Cerdas! Saya bisa membantu Anda:\n\n• Booking ruang meeting dengan rekomendasi cerdas\n• Menjawab pertanyaan tentang ruangan dan fasilitas\n• Memberikan informasi kebijakan dan prosedur\n• Membantu dengan multi-turn conversations\n• Menangani ambiguitas dengan klarifikasi\n\nKetik 'pesan ruangan' untuk mulai booking atau tanyakan apa saja!",
          action: 'continue',
          quickActions: [
            { label: 'Pesan Ruangan', action: 'booking_start', icon: '📅', type: 'primary' },
            { label: 'Lihat Ruangan', action: 'view_rooms', icon: '🏢', type: 'secondary' },
            { label: 'Reservasi Saya', action: 'my_reservations', icon: '📋', type: 'secondary' }
          ]
        };
      }
      
      if (action === 'view_rooms') {
        return {
          message: "Berikut adalah daftar ruangan yang tersedia di Spacio:\n\n🏢 **RUANGAN TERSEDIA:**\n\n• **Ruang Meeting A** (Lantai 3)\n  Kapasitas: 8 orang\n  Fasilitas: Proyektor, Whiteboard, Wi-Fi\n\n• **Ruang Konferensi Bintang** (Lantai 5)\n  Kapasitas: 12 orang\n  Fasilitas: Proyektor, Sound System, Video Conference\n\n• **Auditorium Utama** (Lantai 1)\n  Kapasitas: 50 orang\n  Fasilitas: Panggung, Sound System, Layar Besar\n\n• **Ruang Kolaborasi Alpha** (Lantai 2)\n  Kapasitas: 6 orang\n  Fasilitas: Whiteboard Besar, TV Smart, Meja Fleksibel\n\nTanyakan detail ruangan tertentu atau mulai booking!",
          action: 'continue',
          quickActions: [
            { label: 'Pesan Ruangan', action: 'booking_start', icon: '📅', type: 'primary' },
            { label: 'Detail Ruang Meeting A', action: 'room_detail_meeting_a', icon: '🏢', type: 'secondary' },
            { label: 'Detail Ruang Konferensi Bintang', action: 'room_detail_bintang', icon: '🏢', type: 'secondary' }
          ]
        };
      }
      
      if (action === 'view_recommendations') {
        return {
          message: "Saya akan memberikan rekomendasi ruangan terbaik berdasarkan kebutuhan Anda. Untuk memberikan rekomendasi yang akurat, saya perlu informasi lengkap tentang:\n\n• Tanggal dan waktu yang diinginkan\n• Jumlah peserta\n• Topik atau jenis meeting\n• Fasilitas yang dibutuhkan\n• Preferensi lokasi (opsional)\n\nSilakan berikan informasi tersebut atau gunakan tombol di bawah untuk melengkapi data booking.",
          action: 'continue',
          quickActions: [
            { label: 'Lengkapi Data Booking', action: 'booking_start', icon: '📅', type: 'primary' },
            { label: 'Lihat Semua Ruangan', action: 'view_rooms', icon: '🏢', type: 'secondary' },
            { label: 'Bantuan', action: 'help', icon: '❓', type: 'secondary' }
          ]
        };
      }
      
      // Smart booking actions
      if (action === 'confirm_smart_booking') {
        return this.handleSmartBookingConfirmation();
      }
      
      if (action === 'confirm_booking_yes') {
        return this.handleBookingConfirmationYes();
      }
      
      if (action === 'confirm_booking_no') {
        return this.handleBookingConfirmationNo();
      }
      
      if (action === 'modify_booking_info') {
        return this.handleModifyBookingInfo();
      }
      
      if (action === 'modify_booking') {
        return {
          message: "Baik! Silakan berikan detail yang ingin Anda ubah. Saya akan membantu Anda memperbarui informasi booking.",
          action: 'continue',
          quickActions: [
            { label: 'Ubah Tanggal', action: 'modify_date', icon: '📅', type: 'secondary' },
            { label: 'Ubah Waktu', action: 'modify_time', icon: '🕐', type: 'secondary' },
            { label: 'Ubah Peserta', action: 'modify_participants', icon: '👥', type: 'secondary' }
          ]
        };
      }
      
      // Date actions
      if (action.startsWith('date_')) {
        const dateType = action.replace('date_', '');
        let dateValue = '';
        if (dateType === 'hari_ini') dateValue = 'hari ini';
        else if (dateType === 'besok') dateValue = 'besok';
        return await this.processInput(`tanggal ${dateValue}`);
      }
      
      // Time actions
      if (action.startsWith('time_')) {
        const timeType = action.replace('time_', '');
        let timeValue = '';
        if (timeType === 'pagi') timeValue = '09:00';
        else if (timeType === 'siang') timeValue = '12:00';
        else if (timeType === 'sore') timeValue = '15:00';
        return await this.processInput(`jam ${timeValue}`);
      }
      
      // Participants actions
      if (action.startsWith('participants_')) {
        const participants = action.replace('participants_', '');
        return await this.processInput(`${participants} orang`);
      }
      
      // Merge current booking data with context
      const mergedBooking = { ...this.context.currentBooking, ...currentBooking };
      
      switch (action) {
        case 'konfirmasi':
          return this.handleConfirmation();
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

  // Old handleConfirmation method removed - using new one below
  private handleConfirmationOld(bookingData: Partial<Booking>): RBAResponse {
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
    console.log('🔍 extractAdditionalInfoEnhanced result:', extractedInfo);
    
    // Merge with existing booking data
    const updatedBooking = {
      ...bookingData,
      ...extractedInfo
    };
    console.log('🔍 updatedBooking after merge:', updatedBooking);
    
    // Update context with new data
    this.context.currentBooking = updatedBooking;
    console.log('🔍 context.currentBooking after update:', this.context.currentBooking);
    
    // Provide intelligent feedback
    const feedback = this.generateIntelligentFeedback(extractedInfo, userInput);
    
    // Check if all data is now complete
    const currentBooking = this.context.currentBooking;
    const stillMissing = [];
    
    // Check all required fields
    if (!currentBooking.roomName) stillMissing.push('nama ruangan');
    if (!currentBooking.topic) stillMissing.push('topik rapat');
    if (!currentBooking.pic) stillMissing.push('PIC (Penanggung jawab)');
    if (!currentBooking.participants) stillMissing.push('jumlah peserta');
    if (!currentBooking.date) stillMissing.push('tanggal rapat');
    if (!currentBooking.time) stillMissing.push('waktu rapat');
    if (!currentBooking.meetingType) stillMissing.push('jenis rapat');
    
    console.log('🔍 Data completeness check:', {
      currentBooking,
      stillMissing,
      hasRoomName: !!currentBooking.roomName,
      hasTopic: !!currentBooking.topic,
      hasPic: !!currentBooking.pic,
      hasParticipants: !!currentBooking.participants,
      hasDate: !!currentBooking.date,
      hasTime: !!currentBooking.time,
      hasMeetingType: !!currentBooking.meetingType
    });
    
    if (stillMissing.length === 0) {
      // All data complete, proceed to confirmation
      console.log('✅ All data complete, proceeding to confirmation');
      return this.handleConfirmation();
    } else {
      // Still missing data, continue asking
      console.log('❌ Still missing data:', stillMissing);
      const missingMessage = `Untuk melengkapi pemesanan, saya masih membutuhkan informasi berikut:\n\n` +
        stillMissing.map((field, index) => `${index + 1}. ${field}`).join('\n') +
        `\n\nSilakan berikan informasi tersebut.`;
      
      return {
        message: missingMessage,
        action: 'continue',
        bookingData: updatedBooking,
        nextState: BookingState.CONFIRMING,
        quickActions: this.generateQuickActionsForMissingData(stillMissing)
      };
    }
  }
  
  // Validate booking data with detailed checks
  private validateBookingData(booking: Partial<Booking>): {
    isValid: boolean;
    missingFields: Array<{ field: string; label: string; description: string }>;
  } {
    const missingFields: Array<{ field: string; label: string; description: string }> = [];
    
    // Check room name - NO FALLBACK VALUES
    if (!booking.roomName || booking.roomName.trim() === '' || booking.roomName === 'NaN' || booking.roomName === 'undefined') {
      missingFields.push({
        field: 'roomName',
        label: '🏢 Nama Ruangan',
        description: 'Pilih ruangan yang akan digunakan untuk rapat'
      });
    }
    
    // Check topic - NO FALLBACK VALUES
    if (!booking.topic || booking.topic.trim() === '' || booking.topic === 'NaN' || booking.topic === 'undefined') {
      missingFields.push({
        field: 'topic',
        label: '📋 Topik Rapat',
        description: 'Masukkan topik atau agenda rapat'
      });
    }
    
    // Check PIC (Person in Charge) - NO FALLBACK VALUES
    if (!booking.pic || booking.pic.trim() === '' || booking.pic === 'NaN' || booking.pic === 'undefined' || booking.pic === 'Belum ditentukan') {
      missingFields.push({
        field: 'pic',
        label: '👤 PIC (Penanggung Jawab)',
        description: 'Masukkan nama penanggung jawab rapat'
      });
    }
    
    // Check participants - must be a valid number
    const participantsNum = Number(booking.participants);
    if (!booking.participants || 
        String(booking.participants) === '' || 
        String(booking.participants) === 'orang' ||
        isNaN(participantsNum) ||
        participantsNum <= 0) {
      missingFields.push({
        field: 'participants',
        label: '👥 Jumlah Peserta',
        description: 'Masukkan jumlah peserta rapat (minimal 1 orang)'
      });
    }
    
    // Check date - must be valid date format - NO FALLBACK VALUES
    if (!booking.date || booking.date.trim() === '' || booking.date === 'NaN' || booking.date === 'undefined') {
      missingFields.push({
        field: 'date',
        label: '📅 Tanggal Rapat',
        description: 'Pilih tanggal pelaksanaan rapat'
      });
    } else {
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(booking.date)) {
        missingFields.push({
          field: 'date',
          label: '📅 Tanggal Rapat',
          description: 'Format tanggal harus YYYY-MM-DD (contoh: 2025-01-17)'
        });
      }
    }
    
    // Check time - must be valid time format - NO FALLBACK VALUES
    if (!booking.time || booking.time.trim() === '' || booking.time === 'NaN' || booking.time === 'undefined' || booking.time === 'Belum ditentukan') {
      missingFields.push({
        field: 'time',
        label: '⏰ Waktu Rapat',
        description: 'Masukkan waktu mulai rapat (contoh: 10:00)'
      });
    } else {
      // Validate time format (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(booking.time)) {
        missingFields.push({
          field: 'time',
          label: '⏰ Waktu Rapat',
          description: 'Format waktu harus HH:MM (contoh: 10:00)'
        });
      }
    }
    
    // Check meeting type - NO FALLBACK VALUES
    if (!booking.meetingType || 
        String(booking.meetingType) === 'NaN' || 
        String(booking.meetingType) === 'undefined' ||
        (booking.meetingType !== 'internal' && booking.meetingType !== 'external')) {
      missingFields.push({
        field: 'meetingType',
        label: '🏢 Jenis Rapat',
        description: 'Pilih jenis rapat: Internal atau Eksternal'
      });
    }
    
    // Check end time - calculate if not provided
    if (!booking.endTime || booking.endTime.trim() === '' || booking.endTime === 'NaN:NaN' || booking.endTime === 'NaN' || booking.endTime === 'undefined') {
      if (booking.time && booking.time !== 'Belum ditentukan' && booking.time !== 'NaN' && booking.time !== 'undefined') {
        // Calculate end time (default 2 hours duration)
        const startTime = booking.time;
        const [hours, minutes] = startTime.split(':').map(Number);
        
        if (!isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
          const endHours = hours + 2;
          const endMinutes = minutes;
          
          if (endHours >= 24) {
            missingFields.push({
              field: 'endTime',
              label: '⏰ Waktu Berakhir',
              description: 'Waktu berakhir tidak valid. Silakan pilih waktu yang berbeda'
            });
          }
        } else {
          missingFields.push({
            field: 'endTime',
            label: '⏰ Waktu Berakhir',
            description: 'Waktu mulai tidak valid. Silakan masukkan waktu yang benar'
          });
        }
      } else {
        missingFields.push({
          field: 'endTime',
          label: '⏰ Waktu Berakhir',
          description: 'Masukkan waktu berakhir rapat'
        });
      }
    }
    
    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }

  // Generate quick actions based on missing data
  private generateQuickActionsForMissingData(missingFields: string[]): Array<{
    label: string;
    action: string;
    icon?: string;
    type?: 'primary' | 'secondary' | 'danger';
  }> {
    const quickActions = [];
    
    if (missingFields.includes('roomName')) {
      quickActions.push(
        { label: 'Lihat Ruangan', action: 'view_rooms', icon: '🏢', type: 'primary' },
        { label: 'Samudrantha (10 orang)', action: 'room_samudrantha', icon: '🏢', type: 'secondary' },
        { label: 'Cedaya (15 orang)', action: 'room_cedaya', icon: '🏢', type: 'secondary' },
        { label: 'Celebes (15 orang)', action: 'room_celebes', icon: '🏢', type: 'secondary' }
      );
    }
    
    if (missingFields.includes('date')) {
      quickActions.push(
        { label: 'Hari Ini', action: 'date_hari_ini', icon: '📅', type: 'primary' },
        { label: 'Besok', action: 'date_besok', icon: '📅', type: 'primary' },
        { label: 'Lusa', action: 'date_lusa', icon: '📅', type: 'secondary' }
      );
    }
    
    if (missingFields.includes('time')) {
      quickActions.push(
        { label: 'Pagi (09:00)', action: 'time_09:00', icon: '🌅', type: 'primary' },
        { label: 'Siang (13:00)', action: 'time_13:00', icon: '☀️', type: 'primary' },
        { label: 'Sore (15:00)', action: 'time_15:00', icon: '🌆', type: 'secondary' }
      );
    }
    
    if (missingFields.includes('participants')) {
      quickActions.push(
        { label: '5 Orang', action: 'participants_5', icon: '👥', type: 'primary' },
        { label: '10 Orang', action: 'participants_10', icon: '👥', type: 'primary' },
        { label: '15 Orang', action: 'participants_15', icon: '👥', type: 'secondary' }
      );
    }
    
    if (missingFields.includes('topic')) {
      quickActions.push(
        { label: 'Rapat Tim', action: 'topic_rapat_tim', icon: '👥', type: 'primary' },
        { label: 'Presentasi', action: 'topic_presentasi', icon: '📊', type: 'primary' },
        { label: 'Training', action: 'topic_training', icon: '🎓', type: 'secondary' }
      );
    }
    
    if (missingFields.includes('pic')) {
      quickActions.push(
        { label: 'Masukkan PIC', action: 'input_pic', icon: '👤', type: 'primary' }
      );
    }
    
    if (missingFields.includes('meetingType')) {
      quickActions.push(
        { label: 'Internal', action: 'meeting_internal', icon: '🏢', type: 'primary' },
        { label: 'Eksternal', action: 'meeting_external', icon: '🌐', type: 'primary' }
      );
    }
    
    if (missingFields.includes('endTime')) {
      quickActions.push(
        { label: '2 Jam (Default)', action: 'duration_2_hours', icon: '⏰', type: 'primary' },
        { label: '3 Jam', action: 'duration_3_hours', icon: '⏰', type: 'secondary' },
        { label: '4 Jam', action: 'duration_4_hours', icon: '⏰', type: 'secondary' }
      );
    }
    
    // Add help action
    quickActions.push({ label: 'Bantuan', action: 'help', icon: '❓', type: 'secondary' });
    
    return quickActions;
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
      return this.handleConfirmation();
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
      return this.handleConfirmation();
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
        { label: 'Rapat Tim', action: 'topic_rapat_tim', icon: '📋', type: 'secondary' },
        { label: 'Presentasi Client', action: 'topic_presentasi_client', icon: '📋', type: 'secondary' },
        { label: 'Brainstorming', action: 'topic_brainstorming', icon: '📋', type: 'secondary' },
        { label: 'Training', action: 'topic_training', icon: '📋', type: 'secondary' },
        { label: 'Review Project', action: 'topic_review_project', icon: '📋', type: 'secondary' }
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
        return this.handleConfirmation();
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
    const lower = input.toLowerCase();
    
    // Handle time range patterns like "jam 10 sampai jam 12"
    const timeRangePatterns = [
      /jam\s*(\d{1,2})\s*sampai\s*jam\s*(\d{1,2})/i,
      /jam\s*(\d{1,2})\s*-\s*jam\s*(\d{1,2})/i,
      /jam\s*(\d{1,2})\s*ke\s*jam\s*(\d{1,2})/i,
      /(\d{1,2})\s*sampai\s*(\d{1,2})/i,
      /(\d{1,2})\s*-\s*(\d{1,2})/i,
      /(\d{1,2})\s*ke\s*(\d{1,2})/i
    ];
    
    for (const pattern of timeRangePatterns) {
      const match = lower.match(pattern);
      if (match) {
        const [, startHour, endHour] = match;
        const startHourNum = parseInt(startHour);
        const endHourNum = parseInt(endHour);
        
        if (startHourNum >= 0 && startHourNum <= 23 && endHourNum >= 0 && endHourNum <= 23) {
          return `${startHourNum.toString().padStart(2, '0')}:00`;
        }
      }
    }
    
    // Handle single time patterns
    const timePatterns = [
      /(\d{1,2}):(\d{2})/,
      /(\d{1,2})\.(\d{2})/,
      /jam\s*(\d{1,2}):(\d{2})/i,
      /pukul\s*(\d{1,2}):(\d{2})/i,
      /jam\s*(\d{1,2})/i,
      /pukul\s*(\d{1,2})/i
    ];
    
    for (const pattern of timePatterns) {
      const match = lower.match(pattern);
      if (match) {
        const [, hour, minute] = match;
        const hourNum = parseInt(hour);
        const minuteNum = minute ? parseInt(minute) : 0;
        
        if (hourNum >= 0 && hourNum <= 23 && minuteNum >= 0 && minuteNum <= 59) {
          return `${hourNum.toString().padStart(2, '0')}:${minuteNum.toString().padStart(2, '0')}`;
        }
      }
    }
    
    // Handle time descriptions
    if (lower.includes('pagi')) {
      return '09:00';
    } else if (lower.includes('siang')) {
      return '12:00';
    } else if (lower.includes('sore')) {
      return '15:00';
    } else if (lower.includes('malam')) {
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

  // Build optimized AI prompt for RBA
  private async buildRBAPrompt(userInput: string, analysis: any): Promise<string> {
    const conversationContext = this.context.conversationHistory
      .slice(-4) // Reduced from 6 to save tokens
      .map(msg => {
        const role = msg.role === 'user' ? 'User' : 'RBA';
        return `${role}: ${msg.content}`;
      })
      .join('\n');

    const bookingStatus = this.getBookingStatus();
    const availableRooms = await this.getAvailableRoomsInfo();
    
    // Get current date for context
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return `Anda adalah RBA (RoomBooking Assistant) - AI yang cerdas untuk pemesanan ruangan meeting.

KONTEKS PERCAKAPAN:
${conversationContext || 'Percakapan baru'}

STATUS BOOKING:
${bookingStatus}

RUANGAN TERSEDIA:
${availableRooms}

ANALISIS INPUT:
- Intent: ${analysis.intent}
- Confidence: ${analysis.confidence}
- Entities: ${JSON.stringify(analysis.entities)}

INPUT USER: "${userInput}"

PARSING RULES:
- Tanggal: "besok"=${tomorrow}, "hari ini"=${today}, "lusa"=${new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0]}
- Waktu: "pagi"=09:00, "siang"=12:00, "sore"=15:00, "malam"=19:00
- Peserta: ekstrak angka dari input
- Topik: ekstrak setelah kata kunci "untuk", "tentang", "rapat", "meeting"

RESPONSE FORMAT (JSON ONLY):
{
  "message": "Pesan ramah dan helpful (max 200 karakter)",
  "action": "continue|complete|confirm|clarify|recommend",
  "bookingData": {
    "roomName": "nama ruangan",
    "topic": "topik rapat", 
    "pic": "nama PIC",
    "participants": "jumlah peserta",
    "date": "YYYY-MM-DD",
    "time": "HH:MM",
    "meetingType": "internal|external"
  },
  "quickActions": [
    {"label": "Opsi 1", "action": "action1", "type": "primary"},
    {"label": "Opsi 2", "action": "action2", "type": "secondary"}
  ],
  "suggestions": ["Saran 1", "Saran 2"]
}

CONTOH RESPONS CERDAS:
- "Untuk presentasi client 10 orang besok pagi, saya rekomendasikan Samudrantha! Ada proyektor dan cocok untuk presentasi. Mau saya bookingkan?"
- "Rapat tim urgent? Cedaya atau Celebes bagus untuk diskusi kreatif. Mana yang dipilih?"
- "Training 15 orang dengan rekaman? Balidwipa perfect dengan sound system lengkap!"

JAWAB HANYA DENGAN JSON, TANPA TEKS LAIN.`;
  }

  // Build advanced AI prompt with dynamic room data
  private async buildAdvancedAIPrompt(userInput: string, analysis: any): Promise<string> {
    const conversationContext = this.context.conversationHistory
      .slice(-3)
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const currentBooking = this.context.currentBooking;
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return `🤖 RBA AI Assistant - Professional Room Booking System

CONVERSATION HISTORY:
${conversationContext || 'New conversation'}

CURRENT BOOKING STATUS:
${JSON.stringify(currentBooking, null, 2)}

USER INPUT: "${userInput}"

ANALYSIS:
- Intent: ${analysis.intent}
- Confidence: ${analysis.confidence}%
- Entities: ${JSON.stringify(analysis.entities)}

AVAILABLE ROOMS:
- Samudrantha (10 pax) - Projector, Whiteboard, AC
- Cedaya (15 pax) - Sound System, Video Conference
- Celebes (15 pax) - Large Screen, WiFi
- Kalamanthana (15 pax) - Recording Equipment
- Ruang Nasionalis (15 pax) - Premium Setup
- Ruang Meeting A (8 pax) - Basic Setup
- Ruang Konferensi Bintang (12 pax) - Conference Ready
- Auditorium Utama (50 pax) - Full Equipment
- Ruang Kolaborasi Alpha (6 pax) - Collaborative Space

INTELLIGENT UNDERSTANDING:
- Dates: "besok"=${tomorrow}, "hari ini"=${today}, "lusa"=${new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0]}
- Times: "pagi"=09:00, "siang"=12:00, "sore"=15:00, "malam"=19:00
- Participants: Extract numbers from any context
- Topics: Understand any meeting purpose or topic
- Context: Understand urgency, preferences, and requirements

PROFESSIONAL RESPONSE STRATEGY:
1. GREETINGS ("hai", "hello", "hi") → Warm professional greeting + offer assistance
2. BOOKING REQUESTS → Process intelligently with recommendations
3. QUESTIONS → Provide helpful information and guidance
4. COMPLAINTS/ISSUES → Address professionally and offer solutions
5. GENERAL CHAT → Stay professional but friendly, guide to booking
6. COMPLEX REQUESTS → Break down into manageable steps
7. UNCLEAR INPUT → Ask clarifying questions professionally

RESPONSE FORMAT (JSON):
{
  "message": "Professional, helpful message (max 200 chars)",
  "action": "continue|complete|confirm|clarify|recommend|error|greeting|help",
  "bookingData": {
    "roomName": "room name",
    "topic": "meeting topic",
    "pic": "person in charge",
    "participants": "number",
    "date": "YYYY-MM-DD",
    "time": "HH:MM",
    "meetingType": "internal|external"
  },
  "quickActions": [
    {"label": "Action 1", "action": "action1", "type": "primary"},
    {"label": "Action 2", "action": "action2", "type": "secondary"}
  ],
  "suggestions": ["Suggestion 1", "Suggestion 2"],
  "recommendations": {
    "rooms": [{"name": "Room", "capacity": 10, "facilities": ["facility1"]}],
    "reasons": ["Reason 1", "Reason 2"]
  }
}

CRITICAL DATA COMPLETION RULES:
- NEVER use "Belum ditentukan", "NaN", "undefined", or empty strings in bookingData
- If any field is missing, set action to "continue" and ask for specific missing information
- Only set action to "complete" when ALL fields have valid, non-empty values
- For missing PIC: Ask "Siapa yang akan menjadi PIC (Penanggung Jawab) rapat ini?"
- For missing time: Ask "Jam berapa rapat akan dimulai? (contoh: 10:00)"
- For missing participants: Ask "Berapa jumlah peserta yang akan hadir?"
- Always provide specific, actionable questions for missing data

PROFESSIONAL EXAMPLES:
- "hai" → "Halo! Selamat datang di RBA Assistant. Saya siap membantu Anda dengan pemesanan ruang rapat. Ada yang bisa saya bantu hari ini?"
- "presentasi client 10 orang besok pagi" → "Untuk presentasi client 10 orang besok pagi, saya rekomendasikan Samudrantha Meeting Room. Ruangan ini memiliki proyektor dan kapasitas yang sesuai. Apakah Anda ingin saya proses pemesanannya?"
- "bantuan" → "Tentu! Saya dapat membantu Anda dengan pemesanan ruang rapat, informasi ruangan, atau pertanyaan lainnya. Apa yang ingin Anda ketahui?"
- "ruangan apa saja yang ada?" → "Kami memiliki 9 ruang meeting dengan berbagai kapasitas dan fasilitas. Mulai dari Ruang Kolaborasi Alpha (6 orang) hingga Auditorium Utama (50 orang). Ruangan mana yang ingin Anda ketahui lebih detail?"
- "bagaimana cara booking?" → "Proses booking sangat mudah! Anda hanya perlu memberikan informasi: ruangan, topik rapat, PIC, jumlah peserta, tanggal & waktu, dan jenis rapat. Saya akan membantu memproses semuanya."

PROFESSIONAL GUIDELINES:
- Always be polite and professional
- Use proper Indonesian language
- Provide clear and helpful information
- Offer specific solutions and recommendations
- Be proactive in suggesting next steps
- Handle any input gracefully and intelligently

RESPOND WITH JSON ONLY.`;
  }

  // Handle smart booking confirmation
  private handleSmartBookingConfirmation(): RBAResponse {
    const bookingData = this.context.currentBooking;
    
    // Check if all required data is present and valid
    const requiredFields = ['roomName', 'topic', 'pic', 'participants', 'date', 'time', 'meetingType'];
    const missingFields = requiredFields.filter(field => {
      const value = bookingData[field as keyof typeof bookingData];
      return !value || value === '' || value === 'NaN' || value === 'undefined' || value === 'Belum ditentukan';
    });
    
    if (missingFields.length > 0) {
      // If data is incomplete, ask for missing information instead of showing template
      const fieldLabels = {
        roomName: 'nama ruangan',
        topic: 'topik rapat',
        pic: 'PIC (penanggung jawab)',
        participants: 'jumlah peserta',
        date: 'tanggal',
        time: 'waktu mulai',
        meetingType: 'jenis rapat'
      };
      
      const missingList = missingFields.map(field => fieldLabels[field as keyof typeof fieldLabels]).join(', ');
      
      return {
        message: `❌ Data pemesanan belum lengkap. Masih diperlukan informasi: ${missingList}.\n\nSilakan lengkapi informasi tersebut terlebih dahulu.`,
        action: 'continue',
        quickActions: this.generateQuickActionsForMissingData(missingFields)
      };
    }
    
    // All data is complete, show confirmation with actual data
    let message = "Baik, saya sudah mencatat semua detail pemesanan Anda:\n\n";
    message += `• Ruangan: ${bookingData.roomName}\n`;
    message += `• Topik Rapat: ${bookingData.topic}\n`;
    message += `• PIC: ${bookingData.pic}\n`;
    message += `• Jumlah Peserta: ${bookingData.participants} orang\n`;
    message += `• Tanggal & Jam: ${bookingData.date}, pukul ${bookingData.time}\n`;
    message += `• Jenis Rapat: ${bookingData.meetingType}\n\n`;
    message += "Apakah semua informasi ini sudah benar dan siap saya proses?";
    
    return {
      message: message,
      action: 'continue',
      quickActions: [
        { label: 'Ya, Proses Booking', action: 'confirm_booking_yes', icon: '✅', type: 'primary' },
        { label: 'Tidak, Ubah Detail', action: 'confirm_booking_no', icon: '✏️', type: 'secondary' }
      ]
    };
  }

  // Handle booking confirmation yes
  private handleBookingConfirmationYes(): RBAResponse {
    const bookingData = this.context.currentBooking;
    const bookingId = `AI-${Math.floor(Math.random() * 1000) + 1}`;
    
    console.log('🔍 Current booking data from context:', bookingData);
    console.log('🔍 Context details:', {
      roomName: bookingData.roomName,
      topic: bookingData.topic,
      pic: bookingData.pic,
      participants: bookingData.participants,
      date: bookingData.date,
      time: bookingData.time,
      meetingType: bookingData.meetingType
    });
    
    // Use booking data with fallback values
    const displayData = {
      roomName: bookingData.roomName || 'Belum dipilih',
      topic: bookingData.topic || 'Belum ditentukan',
      pic: bookingData.pic || 'Belum ditentukan',
      participants: bookingData.participants || 1,
      date: bookingData.date || 'Belum ditentukan',
      time: bookingData.time || 'Belum ditentukan',
      meetingType: (bookingData.meetingType || 'internal') as 'internal' | 'external'
    };
    
    let message = "Pemesanan ruangan Anda berhasil! Terima kasih telah menggunakan layanan kami.\n\n";
    message += "Berikut detail singkat pemesanan Anda:\n";
    message += `• ID Booking: ${bookingId}\n`;
    message += `• Ruangan: ${displayData.roomName}\n`;
    message += `• Topik Rapat: ${displayData.topic}\n`;
    message += `• PIC: ${displayData.pic}\n`;
    message += `• Jumlah Peserta: ${displayData.participants} orang\n`;
    message += `• Tanggal: ${displayData.date}\n`;
    message += `• Waktu: ${displayData.time}\n`;
    message += `• Jenis Rapat: ${displayData.meetingType}\n\n`;
    message += "Silakan periksa email Anda untuk detail lebih lanjut atau mengakses form konfirmasi pemesanan lengkap.";
    
    const finalBookingData = {
      id: bookingId,
      roomName: displayData.roomName,
      roomId: bookingData.roomId || 1,
      topic: displayData.topic,
      date: displayData.date,
      time: displayData.time,
      endTime: bookingData.endTime || '',
      participants: displayData.participants,
      pic: displayData.pic,
      meetingType: displayData.meetingType,
      facilities: bookingData.facilities || [],
      imageUrl: bookingData.imageUrl || '',
      urgency: bookingData.urgency || 'normal',
      duration: bookingData.duration || 60,
      notes: bookingData.notes || ''
    };
    
    console.log('🔍 Final booking data:', finalBookingData);
    
    // Reset booking context after successful booking
    this.context.currentBooking = {};
    
    return {
      message: message,
      action: 'complete',
      bookingData: finalBookingData,
      quickActions: [
        { label: 'Lihat Detail Lengkap', action: 'view_booking_details', icon: '📋', type: 'primary' },
        { label: 'Booking Lagi', action: 'booking_start', icon: '📅', type: 'secondary' }
      ]
    };
  }

  // Handle booking confirmation no
  private handleBookingConfirmationNo(): RBAResponse {
    return {
      message: "Mohon maaf, bagian mana yang perlu saya perbaiki atau ubah? Silakan sebutkan informasi yang ingin Anda ubah.",
      action: 'continue',
      quickActions: [
        { label: 'Ubah Ruangan', action: 'modify_room', icon: '🏢', type: 'secondary' },
        { label: 'Ubah Tanggal & Jam', action: 'modify_datetime', icon: '📅', type: 'secondary' },
        { label: 'Ubah Peserta', action: 'modify_participants', icon: '👥', type: 'secondary' },
        { label: 'Ubah PIC', action: 'modify_pic', icon: '👤', type: 'secondary' },
        { label: 'Ubah Topik', action: 'modify_topic', icon: '📝', type: 'secondary' }
      ]
    };
  }

  // Handle modify booking info
  private handleModifyBookingInfo(): RBAResponse {
    return {
      message: "Baik, saya akan membantu Anda mengubah informasi booking. Silakan berikan informasi yang ingin Anda ubah atau gunakan tombol di bawah untuk memilih bagian yang ingin diubah.",
      action: 'continue',
      quickActions: [
        { label: 'Ubah Ruangan', action: 'modify_room', icon: '🏢', type: 'secondary' },
        { label: 'Ubah Tanggal & Jam', action: 'modify_datetime', icon: '📅', type: 'secondary' },
        { label: 'Ubah Peserta', action: 'modify_participants', icon: '👥', type: 'secondary' },
        { label: 'Ubah PIC', action: 'modify_pic', icon: '👤', type: 'secondary' },
        { label: 'Ubah Topik', action: 'modify_topic', icon: '📝', type: 'secondary' },
        { label: 'Ubah Jenis Rapat', action: 'modify_meeting_type', icon: '🏢', type: 'secondary' }
      ]
    };
  }

  // Start booking process
  private startBookingProcess(): RBAResponse {
    // Reset data collection
    this.context.dataCollection = {};
    
    return {
      message: "Baik! Mari kita lengkapi informasi pemesanan ruang rapat. Silakan berikan informasi berikut:\n\n• Topik atau tema rapat\n• PIC (atas nama siapa)\n• Jenis meeting (internal/eksternal)\n• Tanggal dan waktu\n• Jumlah peserta\n• Konsumsi (ringan/berat/tidak)\n\nSilakan berikan topik atau tema rapat Anda:",
      action: 'continue',
      quickActions: [
        { label: 'Rapat Tim', action: 'topic_rapat_tim', icon: '📋', type: 'secondary' },
        { label: 'Presentasi Client', action: 'topic_presentasi_client', icon: '📋', type: 'secondary' },
        { label: 'Brainstorming', action: 'topic_brainstorming', icon: '📋', type: 'secondary' },
        { label: 'Training', action: 'topic_training', icon: '📋', type: 'secondary' }
      ]
    };
  }

  // Call Google Gemini API
  // Extract booking data from user input
  private extractBookingData(userInput: string): Partial<Booking> {
    const lower = userInput.toLowerCase();
    const extracted: Partial<Booking> = {};

    // Extract topic
    const topicMatch = lower.match(/(?:topik|tema|subject|tentang|untuk)\s+([^,.\n;]+?)(?=(\s+(jam|pukul|besok|lusa|tanggal|orang|butuh|konsum|catering|pic|atas nama|internal|eksternal)\b)|$)/i);
    if (topicMatch) {
      extracted.topic = topicMatch[1].trim();
    }

    // Extract PIC
    const picMatch = lower.match(/(?:atas nama|pic)\s+([a-zA-Z.\- ]{2,50}?)(?=(\s+(topik|tema|subject|jam|pukul|besok|lusa|tanggal|orang|butuh|konsum|catering|internal|eksternal)\b)|$)/i);
    if (picMatch) {
      extracted.pic = picMatch[1].trim();
    }

    // Extract meeting type
    if (lower.includes('internal') || lower.includes('internal')) {
      extracted.meetingType = 'internal';
    } else if (lower.includes('external') || lower.includes('eksternal') || lower.includes('client') || lower.includes('klien')) {
      extracted.meetingType = 'external';
    }

    // Extract date
    const now = new Date();
    if (lower.includes('hari ini')) {
      extracted.date = now.toISOString().slice(0, 10);
    } else if (lower.includes('besok')) {
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      extracted.date = tomorrow.toISOString().slice(0, 10);
    } else if (lower.includes('lusa')) {
      const dayAfterTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
      extracted.date = dayAfterTomorrow.toISOString().slice(0, 10);
    }

    // Extract time
    const timeMatch = lower.match(/(?:jam|pukul)\s*(\d{1,2})(?::(\d{2}))?/);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1], 10);
      const minute = timeMatch[2] || '00';
      
      if (lower.includes('siang') || lower.includes('sore') || lower.includes('malam')) {
        if (hour < 12) hour += 12;
      }
      
      extracted.time = `${String(hour).padStart(2, '0')}:${minute}`;
    }

    // Extract participants
    const participantsMatch = lower.match(/(\d{1,3})\s*(?:orang|peserta|people|org)?/);
    if (participantsMatch) {
      extracted.participants = parseInt(participantsMatch[1], 10);
    }

    // Extract food order

    return extracted;
  }

  // Update data collection with extracted data
  private updateDataCollection(extractedData: Partial<Booking>): void {
    if (extractedData.topic) this.context.dataCollection.topic = extractedData.topic;
    if (extractedData.pic) this.context.dataCollection.pic = extractedData.pic;
    if (extractedData.meetingType) this.context.dataCollection.meetingType = extractedData.meetingType;
    if (extractedData.date) this.context.dataCollection.date = extractedData.date;
    if (extractedData.time) this.context.dataCollection.time = extractedData.time;
    if (extractedData.participants) this.context.dataCollection.participants = extractedData.participants;
  }

  // Get missing data
  private getMissingData(): string[] {
    const missing: string[] = [];
    const data = this.context.dataCollection;

    if (!data.topic) missing.push('topik rapat');
    if (!data.pic) missing.push('PIC (atas nama siapa)');
    if (!data.meetingType) missing.push('jenis meeting (internal/eksternal)');
    if (!data.date) missing.push('tanggal');
    if (!data.time) missing.push('jam');
    if (!data.participants) missing.push('jumlah peserta');

    return missing;
  }

  // Ask for missing data
  private async askForMissingData(missingData: string[]): Promise<RBAResponse> {
    const data = this.context.dataCollection;
    let message = "Baik! Mari kita lengkapi informasi pemesanan ruang rapat.\n\n";
    
    // Show collected data
    if (Object.keys(data).length > 0) {
      message += "**Data yang sudah saya catat:**\n";
      if (data.topic) message += `• Topik: ${data.topic}\n`;
      if (data.pic) message += `• PIC: ${data.pic}\n`;
      if (data.meetingType) message += `• Jenis Meeting: ${data.meetingType}\n`;
      if (data.date) message += `• Tanggal: ${data.date}\n`;
      if (data.time) message += `• Jam: ${data.time}\n`;
      if (data.participants) message += `• Peserta: ${data.participants} orang\n`;
      message += "\n";
    }

    // Ask for missing data
    message += `**Masih perlu melengkapi:** ${missingData.join(', ')}\n\n`;
    
    // Determine what to ask next
    const nextQuestion = this.getNextQuestion(missingData);
    message += nextQuestion.message;

    const quickActions = nextQuestion.quickActions || [];

    this.addToHistory('assistant', message);

    return {
      message,
      action: 'continue',
      quickActions
    };
  }

  // Get next question based on missing data
  private getNextQuestion(missingData: string[]): { message: string; quickActions: any[] } {
    const firstMissing = missingData[0];
    
    switch (firstMissing) {
      case 'topik rapat':
        return {
          message: "Silakan berikan topik atau tema rapat Anda:",
          quickActions: [
            { label: 'Rapat Tim', action: 'topic_rapat_tim' },
            { label: 'Presentasi', action: 'topic_presentasi' },
            { label: 'Brainstorming', action: 'topic_brainstorming' },
            { label: 'Training', action: 'topic_training' }
          ]
        };
      
      case 'PIC (atas nama siapa)':
        return {
          message: "Atas nama siapa pemesanan ini? (PIC):",
          quickActions: []
        };
      
      case 'jenis meeting (internal/eksternal)':
        return {
          message: "Apakah ini meeting internal atau eksternal?",
          quickActions: [
            { label: 'Internal', action: 'meeting_internal' },
            { label: 'Eksternal', action: 'meeting_external' }
          ]
        };
      
      case 'tanggal':
        return {
          message: "Tanggal berapa rapat akan dilaksanakan?",
          quickActions: [
            { label: 'Hari Ini', action: 'date_hari_ini' },
            { label: 'Besok', action: 'date_besok' },
            { label: 'Lusa', action: 'date_lusa' }
          ]
        };
      
      case 'jam':
        return {
          message: "Jam berapa rapat akan dimulai?",
          quickActions: [
            { label: '09:00', action: 'time_09:00' },
            { label: '10:00', action: 'time_10:00' },
            { label: '13:00', action: 'time_13:00' },
            { label: '14:00', action: 'time_14:00' },
            { label: '15:00', action: 'time_15:00' }
          ]
        };
      
      case 'jumlah peserta':
        return {
          message: "Berapa jumlah peserta yang akan hadir?",
          quickActions: [
            { label: '5 Orang', action: 'participants_5' },
            { label: '10 Orang', action: 'participants_10' },
            { label: '15 Orang', action: 'participants_15' },
            { label: '20 Orang', action: 'participants_20' }
          ]
        };
      
      default:
        return {
          message: "Silakan berikan informasi yang diperlukan:",
          quickActions: []
        };
    }
  }

  // Show recommendations and confirmation
  private async showRecommendationsAndConfirmation(): Promise<RBAResponse> {
    const data = this.context.dataCollection;
    
    // Get room recommendations
    const recommendations = await this.getRoomRecommendations(data);
    
    let message = "🎉 **Semua data sudah lengkap!**\n\n";
    message += "**Ringkasan Pemesanan:**\n";
    message += `• Topik: ${data.topic}\n`;
    message += `• PIC: ${data.pic}\n`;
    message += `• Jenis Meeting: ${data.meetingType}\n`;
    message += `• Tanggal: ${data.date}\n`;
    message += `• Jam: ${data.time}\n`;
    message += `• Peserta: ${data.participants} orang\n`;
    
    message += "**Rekomendasi Ruangan:**\n";
    recommendations.forEach((room, index) => {
      message += `${index + 1}. **${room.name}** (Kapasitas: ${room.capacity} orang)\n`;
      if (room.facilities) {
        message += `   Fasilitas: ${room.facilities.join(', ')}\n`;
      }
      message += `   Status: ${room.available ? '✅ Tersedia' : '❌ Tidak tersedia'}\n\n`;
    });
    
    message += "Apakah Anda ingin melanjutkan dengan pemesanan?";

    const quickActions = [
      { label: 'Konfirmasi Pemesanan', action: 'confirm_booking', type: 'primary' as const },
      { label: 'Ubah Data', action: 'modify_data', type: 'secondary' as const },
      { label: 'Pilih Ruangan Lain', action: 'change_room', type: 'secondary' as const }
    ];

    this.addToHistory('assistant', message);

    return {
      message,
      action: 'recommend',
      quickActions,
      recommendations: {
        rooms: recommendations,
        reasons: ['Berdasarkan kapasitas peserta', 'Fasilitas yang sesuai', 'Ketersediaan waktu']
      }
    };
  }

  // Get room recommendations based on data
  private async getRoomRecommendations(data: any): Promise<MeetingRoom[]> {
    try {
      // Get predefined rooms with facilities
      const predefinedRooms = this.getPredefinedRooms();
      
      // Filter rooms based on capacity
      const suitableRooms = predefinedRooms.filter((room: any) => 
        room.capacity >= data.participants
      );
      
      // Sort by capacity (closest to required capacity)
      suitableRooms.sort((a: any, b: any) => 
        Math.abs(a.capacity - data.participants) - Math.abs(b.capacity - data.participants)
      );
      
      // Return top 3 recommendations
      return suitableRooms.slice(0, 3);
    } catch (error) {
      console.error('Error getting room recommendations:', error);
      return [];
    }
  }

  // Get predefined rooms with their facilities
  private getPredefinedRooms(): MeetingRoom[] {
    return [
      {
        id: 1,
        name: 'Samudrantha Meeting Room',
        floor: '1',
        capacity: 10,
        address: 'Office Building',
        facilities: ['AC', 'Kursi', 'Meja', 'Makan', 'Projector', 'Whiteboard'],
        image: '/images/samudrantha.jpg',
        available: true
      },
      {
        id: 2,
        name: 'Cedaya Meeting Room',
        floor: '2',
        capacity: 15,
        address: 'Office Building',
        facilities: ['AC', 'Kursi', 'Meja', 'Makan', 'Projector', 'Whiteboard', 'Sound System'],
        image: '/images/cedaya.jpg',
        available: true
      },
      {
        id: 3,
        name: 'Celebes Meeting Room',
        floor: '2',
        capacity: 15,
        address: 'Office Building',
        facilities: ['AC', 'Kursi', 'Meja', 'Makan', 'Projector', 'Whiteboard', 'Sound System', 'Video Conference'],
        image: '/images/celebes.jpg',
        available: true
      },
      {
        id: 4,
        name: 'Kalamanthana Meeting Room',
        floor: '3',
        capacity: 15,
        address: 'Office Building',
        facilities: ['AC', 'Kursi', 'Meja', 'Makan', 'Projector', 'Whiteboard', 'Sound System', 'Video Conference', 'Coffee Machine'],
        image: '/images/kalamanthana.jpg',
        available: true
      },
      {
        id: 5,
        name: 'Ruang Nasionalis',
        floor: '3',
        capacity: 15,
        address: 'Office Building',
        facilities: ['AC', 'Kursi', 'Meja', 'Makan', 'Projector', 'Whiteboard', 'Sound System', 'Video Conference', 'Coffee Machine', 'Printer'],
        image: '/images/nasionalis.jpg',
        available: true
      },
      {
        id: 6,
        name: 'Ruang Meeting A',
        floor: '1',
        capacity: 8,
        address: 'Office Building',
        facilities: ['AC', 'Kursi', 'Meja', 'Makan', 'Projector'],
        image: '/images/meeting-a.jpg',
        available: true
      },
      {
        id: 7,
        name: 'Ruang Konferensi Bintang',
        floor: '4',
        capacity: 12,
        address: 'Office Building',
        facilities: ['AC', 'Kursi', 'Meja', 'Makan', 'Projector', 'Whiteboard', 'Sound System', 'Video Conference', 'Coffee Machine', 'Printer', 'Catering'],
        image: '/images/bintang.jpg',
        available: true
      },
      {
        id: 8,
        name: 'Auditorium Utama',
        floor: '5',
        capacity: 50,
        address: 'Office Building',
        facilities: ['AC', 'Kursi', 'Meja', 'Makan', 'Projector', 'Whiteboard', 'Sound System', 'Video Conference', 'Coffee Machine', 'Printer', 'Catering', 'Stage', 'Lighting'],
        image: '/images/auditorium.jpg',
        available: true
      },
      {
        id: 9,
        name: 'Ruang Kolaborasi Alpha',
        floor: '1',
        capacity: 6,
        address: 'Office Building',
        facilities: ['AC', 'Kursi', 'Meja', 'Makan', 'Projector', 'Whiteboard', 'Coffee Machine'],
        image: '/images/alpha.jpg',
        available: true
      }
    ];
  }

  // Get facilities for a specific room
  private getRoomFacilities(roomName: string): string[] {
    const rooms = this.getPredefinedRooms();
    const room = rooms.find(r => r.name === roomName);
    return room ? room.facilities : [];
  }

  // Get room by name
  private getRoomByName(roomName: string): MeetingRoom | null {
    const rooms = this.getPredefinedRooms();
    return rooms.find(r => r.name === roomName) || null;
  }

  // Handle confirmation with strict validation
  private handleConfirmation(): RBAResponse {
    const currentBooking = this.context.currentBooking;
    
    console.log('🔍 handleConfirmation - currentBooking:', currentBooking);
    
    // Strict validation - ensure all required data is present and valid
    const validationResult = this.validateBookingData(currentBooking);
    
    if (!validationResult.isValid) {
      console.log('❌ handleConfirmation - Validation failed:', validationResult.missingFields);
      
      const missingMessage = `❌ **Data pemesanan belum lengkap!**\n\n` +
        `Masih diperlukan informasi berikut:\n\n` +
        validationResult.missingFields.map((field, index) => 
          `**${index + 1}. ${field.label}**\n   ${field.description}`
        ).join('\n\n') +
        `\n\nSilakan lengkapi informasi tersebut terlebih dahulu sebelum melanjutkan.`;
      
      return {
        message: missingMessage,
        action: 'continue',
        bookingData: currentBooking,
        nextState: BookingState.CONFIRMING,
        quickActions: this.generateQuickActionsForMissingData(validationResult.missingFields.map(f => f.field))
      };
    }
    
    // All data is complete, create final booking data with strict validation
    // Use cleanBookingData method to ensure all fields have valid values
    const bookingData = this.cleanBookingData(currentBooking);
    
    // Check if any critical fields are still empty after cleaning
    const criticalFields = ['roomName', 'topic', 'pic', 'participants', 'date', 'time', 'meetingType'];
    const emptyFields = criticalFields.filter(field => {
      const value = bookingData[field as keyof typeof bookingData];
      return !value || value === '' || value === 'NaN' || value === 'undefined';
    });
    
    if (emptyFields.length > 0) {
      console.log('❌ Critical fields still empty after cleaning:', emptyFields);
      console.log('📋 Current booking data:', currentBooking);
      console.log('📋 Cleaned booking data:', bookingData);
      
      const missingMessage = `❌ **Data pemesanan belum lengkap!**\n\n` +
        `Masih diperlukan informasi berikut:\n\n` +
        emptyFields.map((field, index) => {
          const fieldLabels = {
            roomName: '🏢 Nama Ruangan',
            topic: '📋 Topik Rapat',
            pic: '👤 PIC (Penanggung Jawab)',
            participants: '👥 Jumlah Peserta',
            date: '📅 Tanggal Rapat',
            time: '⏰ Waktu Mulai',
            meetingType: '🏢 Jenis Rapat'
          };
          return `**${index + 1}. ${fieldLabels[field as keyof typeof fieldLabels]}**`;
        }).join('\n') +
        `\n\nSilakan lengkapi informasi tersebut terlebih dahulu sebelum melanjutkan.`;
      
      return {
        message: missingMessage,
        action: 'continue',
        bookingData: currentBooking,
        nextState: BookingState.CONFIRMING,
        quickActions: this.generateQuickActionsForMissingData(emptyFields)
      };
    }

    // Log final booking data for verification
    console.log('🎯 FINAL BOOKING DATA VERIFICATION:');
    console.log('📋 Room Name:', bookingData.roomName);
    console.log('📋 Topic:', bookingData.topic);
    console.log('📋 PIC:', bookingData.pic);
    console.log('📋 Participants:', bookingData.participants);
    console.log('📋 Date:', bookingData.date);
    console.log('📋 Time:', bookingData.time);
    console.log('📋 End Time:', bookingData.endTime);
    console.log('📋 Meeting Type:', bookingData.meetingType);
    console.log('📋 Room ID:', bookingData.roomId);
    console.log('📋 Facilities:', bookingData.facilities);
    
    // Verify no NaN or undefined values
    const hasInvalidValues = Object.entries(bookingData).some(([key, value]) => {
      if (typeof value === 'string') {
        return value === 'NaN' || value === 'undefined' || value === 'NaN:NaN';
      }
      return false;
    });
    
    if (hasInvalidValues) {
      console.error('❌ CRITICAL: Invalid values detected in booking data!');
      console.error('📋 Invalid data:', bookingData);
    } else {
      console.log('✅ All booking data validated successfully!');
    }

    const message = "✅ **Pemesanan berhasil dikonfirmasi!**\n\n" +
                   "Terima kasih telah menggunakan layanan pemesanan ruang rapat kami. " +
                   "Anda akan diarahkan ke halaman konfirmasi untuk melihat detail lengkap.";

    this.addToHistory('assistant', message);

    return {
      message,
      action: 'complete',
      bookingData
    };
  }

  // Clean and validate booking data
  private cleanBookingData(data: Partial<Booking>): Partial<Booking> {
    const cleaned: Partial<Booking> = {};
    
    // Clean each field with proper validation - PRESERVE VALID DATA
    cleaned.roomName = this.cleanStringField(data.roomName, '');
    cleaned.topic = this.cleanStringField(data.topic, '');
    cleaned.pic = this.cleanStringField(data.pic, '');
    cleaned.participants = this.cleanStringField(data.participants, '') as any;
    cleaned.date = this.cleanStringField(data.date, '');
    cleaned.time = this.cleanStringField(data.time, '');
    cleaned.endTime = this.cleanStringField(data.endTime, '');
    cleaned.meetingType = this.cleanStringField(data.meetingType, '') as 'internal' | 'external';
    
    // Log the cleaned data to verify
    console.log('🧹 CLEANED BOOKING DATA:');
    console.log('📋 Original data:', data);
    console.log('📋 Cleaned data:', cleaned);
    cleaned.roomId = data.roomId || 1;
    cleaned.facilities = data.facilities || [];
    
    // Special validation for participants
    if (String(cleaned.participants) === 'orang' || String(cleaned.participants) === 'NaN' || String(cleaned.participants) === 'undefined') {
      cleaned.participants = '10' as any;
    }
    
    // Special validation for endTime - FIXED CALCULATION
    if (!cleaned.endTime || cleaned.endTime === 'NaN:NaN' || cleaned.endTime === 'NaN' || cleaned.endTime === 'undefined' || cleaned.endTime.trim() === '') {
      if (cleaned.time && cleaned.time !== '' && cleaned.time !== 'NaN' && cleaned.time !== 'undefined') {
        const [hours, minutes] = cleaned.time.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
          const endHours = hours + 2;
          if (endHours >= 24) {
            // If end time exceeds 24 hours, set to 23:59
            cleaned.endTime = '23:59';
          } else {
            cleaned.endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          }
        } else {
          cleaned.endTime = '12:00'; // Default fallback
        }
      } else {
        cleaned.endTime = '12:00'; // Default fallback when no start time
      }
    }
    
    return cleaned;
  }
  
  // Helper method to clean string fields - PRESERVE VALID DATA
  private cleanStringField(value: any, fallback: string): string {
    // If value is null, undefined, or empty string, return empty
    if (value === null || value === undefined || value === '') {
      return '';
    }
    
    // If value is NaN, 'NaN', 'undefined', or 'Belum ditentukan', return empty
    if (value === 'NaN' || value === 'undefined' || value === 'Belum ditentukan' || 
        (typeof value === 'number' && isNaN(value))) {
      return '';
    }
    
    // If value is valid, return trimmed string
    const stringValue = String(value).trim();
    
    // Additional check for common invalid values
    if (stringValue === 'Belum ditentukan' || stringValue === 'NaN' || stringValue === 'undefined') {
      return '';
    }
    
    return stringValue;
  }

  // Handle modify data
  private handleModifyData(): RBAResponse {
    const message = "Baik! Mari kita ubah data pemesanan. " +
                   "Data mana yang ingin Anda ubah?";

    const quickActions = [
      { label: 'Ubah Topik', action: 'modify_topic', type: 'secondary' as const },
      { label: 'Ubah PIC', action: 'modify_pic', type: 'secondary' as const },
      { label: 'Ubah Tanggal', action: 'modify_date', type: 'secondary' as const },
      { label: 'Ubah Jam', action: 'modify_time', type: 'secondary' as const },
      { label: 'Ubah Peserta', action: 'modify_participants', type: 'secondary' as const }
    ];

    this.addToHistory('assistant', message);

    return {
      message,
      action: 'clarify',
      quickActions
    };
  }

  // Handle change room
  private handleChangeRoom(): RBAResponse {
    const message = "Baik! Mari kita pilih ruangan yang berbeda. " +
                   "Berikut adalah opsi ruangan lainnya:";

    const quickActions = [
      { label: 'Ruang Meeting B', action: 'room_meeting_b' },
      { label: 'Ruang Meeting C', action: 'room_meeting_c' },
      { label: 'Ruang Conference', action: 'room_conference' },
      { label: 'Ruang Training', action: 'room_training' }
    ];

    this.addToHistory('assistant', message);

    return {
      message,
      action: 'recommend',
      quickActions
    };
  }


  // Process Gemini response and return structured data
  private async processGeminiResponse(geminiResponse: string, userInput: string, analysis: any): Promise<RBAResponse> {
    try {
      // Clean response
      const cleanResponse = geminiResponse.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanResponse);

      // CRITICAL: Validate booking data before processing
      if (parsed.bookingData) {
        // Clean and validate booking data
        const cleanedBookingData = this.cleanBookingData(parsed.bookingData);
        
        // Check for invalid values
        const hasInvalidValues = Object.entries(cleanedBookingData).some(([key, value]) => {
          if (typeof value === 'string') {
            return value === 'NaN' || value === 'undefined' || value === 'Belum ditentukan' || value === 'NaN:NaN';
          }
          return false;
        });
        
        if (hasInvalidValues) {
          console.log('❌ AI Response contains invalid values, forcing continue action');
          console.log('📋 Invalid booking data:', cleanedBookingData);
          
          // Force action to continue and ask for missing data
          return {
            message: "❌ Data pemesanan belum lengkap. Silakan lengkapi informasi yang masih kurang.",
            action: 'continue',
            bookingData: this.context.currentBooking,
            quickActions: this.generateQuickActionsForMissingData(['pic', 'time', 'participants'])
          };
        }
        
        // Update context with cleaned data
        this.context.currentBooking = { ...this.context.currentBooking, ...cleanedBookingData };
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
    // Clean content - remove extra whitespace and normalize
    const cleanContent = content.trim().replace(/\s+/g, ' ');
    
    this.context.conversationHistory.push({
      role,
      content: cleanContent,
      timestamp: new Date(),
      intent,
      entities
    });

    // Keep only last 20 messages
    if (this.context.conversationHistory.length > 20) {
      this.context.conversationHistory = this.context.conversationHistory.slice(-20);
    }

    // Log conversation for debugging
    console.log(`💬 ${role.toUpperCase()}: ${cleanContent.substring(0, 50)}${cleanContent.length > 50 ? '...' : ''}`);

    // Save conversation to MongoDB
    this.saveConversationToMongoDB(role, cleanContent, intent, entities);
  }

  // Save conversation to MongoDB
  private async saveConversationToMongoDB(role: 'user' | 'assistant', content: string, intent?: string, entities?: any): Promise<void> {
    try {
      const message: ConversationMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: role === 'assistant' ? 'ai' : 'user',
        content,
        timestamp: new Date(),
        metadata: {
          bookingData: role === 'user' ? this.context.currentBooking : undefined
        }
      };

      // Check if conversation exists, if not create new one
      let conversation = await this.conversationService.getConversation(this.context.sessionId);
      
      if (!conversation) {
        // Create new conversation
        const newConversation: Conversation = {
          sessionId: this.context.sessionId,
          userId: this.context.userId,
          startTime: new Date(),
          messages: [message],
          status: 'active',
          bookingStatus: 'none',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await this.conversationService.saveConversation(newConversation);
        console.log('✅ New conversation saved to MongoDB');
      } else {
        // Add message to existing conversation
        await this.conversationService.addMessageToConversation(this.context.sessionId, message);
        console.log('✅ Message added to existing conversation');
      }

      // Update booking status if needed
      if (this.context.currentBooking && Object.keys(this.context.currentBooking).length > 0) {
        const bookingStatus = this.getBookingStatusFromContext();
        await this.conversationService.updateBookingStatus(
          this.context.sessionId, 
          this.context.currentBooking, 
          bookingStatus
        );
      }

    } catch (error) {
      console.error('❌ Error saving conversation to MongoDB:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  // Get booking status from context
  private getBookingStatusFromContext(): string {
    const data = this.context.currentBooking;
    const requiredFields = ['roomName', 'topic', 'pic', 'participants', 'date', 'time', 'meetingType'];
    const extractedFields = requiredFields.filter(field => data[field as keyof typeof data]);
    
    if (extractedFields.length === 0) {
      return 'none';
    } else if (extractedFields.length >= 6) {
      return 'completed';
    } else {
      return 'in_progress';
    }
  }

  private getBookingStatus(): string {
    const data = this.context.currentBooking;
    console.log('DEBUG - currentBooking data:', data);
    const fields = [];
    
    // Only display fields that have valid values - NO HARDCODED FALLBACKS
    if (data.roomName && String(data.roomName) !== 'NaN' && String(data.roomName) !== 'undefined' && data.roomName.trim() !== '') {
      fields.push(`🏢 Ruangan: ${data.roomName}`);
    }
    if (data.topic && String(data.topic) !== 'NaN' && String(data.topic) !== 'undefined' && data.topic.trim() !== '') {
      fields.push(`📋 Topik: ${data.topic}`);
    }
    if (data.pic && String(data.pic) !== 'NaN' && String(data.pic) !== 'undefined' && data.pic.trim() !== '') {
      fields.push(`👤 PIC: ${data.pic}`);
    }
    if (data.participants && String(data.participants) !== 'NaN' && String(data.participants) !== 'undefined' && String(data.participants).trim() !== '') {
      fields.push(`👥 Peserta: ${data.participants} orang`);
    }
    if (data.date && String(data.date) !== 'NaN' && String(data.date) !== 'undefined' && data.date.trim() !== '') {
      fields.push(`📅 Tanggal: ${data.date}`);
    }
    if (data.time && String(data.time) !== 'NaN' && String(data.time) !== 'undefined' && data.time.trim() !== '') {
      fields.push(`⏰ Waktu Mulai: ${data.time}`);
    }
    if (data.endTime && String(data.endTime) !== 'NaN:NaN' && String(data.endTime) !== 'NaN' && String(data.endTime) !== 'undefined' && data.endTime.trim() !== '') {
      fields.push(`⏰ Waktu Berakhir: ${data.endTime}`);
    }
    if (data.meetingType && String(data.meetingType) !== 'NaN' && String(data.meetingType) !== 'undefined' && data.meetingType.trim() !== '') {
      fields.push(`📝 Jenis Rapat: ${data.meetingType}`);
    }
    
    if (data.facilities && data.facilities.length > 0) {
      fields.push(`🏢 Fasilitas: ${data.facilities.join(', ')}`);
    }
    
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

  private async getAvailableRoomsInfo(): Promise<string> {
    try {
      // Get real-time data from database
      const rooms = await this.getAvailableRoomsFromDatabase();
      
      if (rooms.length === 0) {
        return `🏢 RUANGAN TERSEDIA:
⚠️ Sedang memuat data ruangan dari database...`;
      }
      
      let result = `🏢 RUANGAN TERSEDIA (Real-time dari Database):\n\n`;
      
      rooms.forEach((room, index) => {
        const status = room.is_available ? '✅ Tersedia' : '❌ Tidak Tersedia';
        const maintenance = room.is_maintenance ? '🔧 Maintenance' : '';
        
        result += `${index + 1}. 🏢 ${room.room_name} (${room.capacity} orang)\n`;
        result += `   📍 ${room.description || 'Ruang meeting standar'}\n`;
        result += `   🔧 Fasilitas: ${room.features || 'AC, Proyektor'}\n`;
        result += `   📊 Status: ${status} ${maintenance}\n`;
        if (room.floor) result += `   🏢 Lantai: ${room.floor}\n`;
        result += `\n`;
      });
      
      console.log('✅ Generated real-time room info from database');
      return result;
    } catch (error) {
      console.error('❌ Error getting room info from database:', error);
      // Fallback to static data
      return `🏢 RUANGAN TERSEDIA:

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
    }
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
    
    // Extract date
    const now = new Date();
    if (lowerInput.includes('hari ini')) {
      extracted.date = now.toISOString().slice(0, 10);
    } else if (lowerInput.includes('besok')) {
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      extracted.date = tomorrow.toISOString().slice(0, 10);
    } else if (lowerInput.includes('lusa')) {
      const dayAfterTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
      extracted.date = dayAfterTomorrow.toISOString().slice(0, 10);
    }
    
    // Extract time
    const timeMatch = lowerInput.match(/(?:jam|pukul)\s*(\d{1,2})(?::(\d{2}))?/);
    if (timeMatch) {
      const hour = parseInt(timeMatch[1]);
      const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      extracted.time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }
    
    // Extract participants
    const participantsMatch = lowerInput.match(/(\d+)\s*(?:orang|peserta|people|pax)/);
    if (participantsMatch) {
      extracted.participants = parseInt(participantsMatch[1]);
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
      userId: this.context.userId,
      dataCollection: {},
      availableRooms: []
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
