// RoomBooking Assistant (RBA) - Versi Optimized dengan Gemini AI
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

export class RoomBookingAssistantOptimized {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  private context: RBAContext;
  private availableRooms: MeetingRoom[] = [];
  private roomDatabaseService: RoomDatabaseService;

  constructor(userId: string, sessionId: string) {
    // Initialize Gemini API key
    const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    const processKey = (process as any).env?.GEMINI_API_KEY;
    const fallbackKey = 'AIzaSyA_Rde7sVAyaQ3aE_V1ycbMD45PTQnxQko';
    
    this.apiKey = envKey || processKey || fallbackKey;
    
    // Get user data from localStorage for auto-fill PIC
    let userPIC = '';
    try {
      const userDataStr = localStorage.getItem('user_data');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        userPIC = userData.full_name || userData.username || userData.email?.split('@')[0] || '';
      }
    } catch (error) {
      console.log('Failed to get user data from localStorage:', error);
    }

    // Initialize context
    this.context = {
      conversationHistory: [],
      currentBooking: {},
      bookingState: BookingState.IDLE,
      userPreferences: {
        preferredRooms: [],
        preferredTimes: [],
        meetingTypes: [],
        facilityPreferences: []
      },
      sessionId,
      userId,
      dataCollection: {
        pic: userPIC
      },
      availableRooms: []
    };

    this.roomDatabaseService = new RoomDatabaseService();
    
    console.log('✅ RoomBookingAssistantOptimized initialized');
    console.log('🔑 API Key Status:', this.apiKey ? 'Available' : 'Not Available');
  }

  // Main method to process user input using Gemini AI
  public async processInput(userInput: string): Promise<RBAResponse> {
    try {
      console.log('🎯 RBA processInput called with:', userInput);
      
      // Add user input to conversation history
      this.addToHistory('user', userInput);

      // Use Gemini AI to process the input intelligently
      if (this.apiKey && this.apiKey !== '') {
        return await this.processWithGeminiAI(userInput);
      } else {
        // Fallback to rule-based processing if no API key
        return await this.processWithRules(userInput);
      }
    } catch (error) {
      console.error('Error processing input:', error);
      return {
        message: "Maaf, terjadi kesalahan. Silakan coba lagi.",
        action: 'error',
        quickActions: [
          { label: 'Mulai Booking', action: 'book_room', type: 'primary' },
          { label: 'Bantuan', action: 'help', type: 'secondary' }
        ]
      };
    }
  }

  // Handle quick actions
  public async handleQuickAction(action: string): Promise<RBAResponse> {
    console.log('🚀 Handling quick action:', action);

    switch (action) {
      case 'Pesan Ruangan':
        return this.startBookingProcess();
      
      case 'Bantuan':
        return this.handleHelp();
      
      case 'confirm_booking':
        return this.handleConfirmation();
      
      default:
        // Handle room selection
        if (action.startsWith('room_')) {
          const roomName = action.replace('room_', '').replace(/_/g, ' ');
          return this.selectRoom(roomName);
        }
        
        // Handle date selection
        if (action.startsWith('date_')) {
          const dateType = action.replace('date_', '');
          return this.selectDate(dateType);
        }
        
        // Handle time selection
        if (action.startsWith('time_')) {
          const time = action.replace('time_', '').replace(/_/g, ':');
          return this.selectTime(time);
        }
        
        // Handle participants
        if (action.startsWith('participants_')) {
          const participants = parseInt(action.replace('participants_', ''));
          return this.selectParticipants(participants);
        }
        
        // Handle topic selection
        if (action.startsWith('topic_')) {
          const topic = action.replace('topic_', '').replace(/_/g, ' ');
          this.context.currentBooking.topic = topic;
          return this.askForMissingInfo();
        }
        
        // Handle meeting type selection
        if (action.startsWith('meeting_')) {
          const meetingType = action.replace('meeting_', '') as 'internal' | 'external';
          this.context.currentBooking.meetingType = meetingType;
          return this.askForMissingInfo();
        }
        
        return {
          message: "Maaf, saya belum bisa menangani aksi tersebut. Silakan gunakan tombol yang tersedia.",
          action: 'continue',
          quickActions: [
            { label: 'Mulai Booking', action: 'book_room', type: 'primary' },
            { label: 'Bantuan', action: 'help', type: 'secondary' }
          ]
        };
    }
  }

  // Process input using Gemini AI for intelligent conversation
  private async processWithGeminiAI(userInput: string): Promise<RBAResponse> {
    try {
      console.log('🤖 Processing with Gemini AI...');
      
      // Prepare context for Gemini
      const systemPrompt = this.buildSystemPrompt();
      
      // Call Gemini API
      const response = await this.callGeminiAPI(systemPrompt, userInput);
      
      // Parse Gemini response and extract booking information
      const parsedResponse = this.parseGeminiResponse(response, userInput);
      
      // Add AI response to conversation history
      this.addToHistory('assistant', parsedResponse.message);
      
      return parsedResponse;
    } catch (error) {
      console.error('Error with Gemini AI:', error);
      // Fallback to rule-based processing
      return await this.processWithRules(userInput);
    }
  }

  // Build system prompt for Gemini AI
  private buildSystemPrompt(): string {
    const currentBooking = this.context.currentBooking;
    const missingFields = this.getMissingFields();
    
    return `Anda adalah asisten AI Spacio yang membantu pengguna memesan ruang rapat. 

KONTEKS SAAT INI:
- Status Booking: ${this.context.bookingState}
- Data Booking Saat Ini: ${JSON.stringify(currentBooking, null, 2)}
- Field yang Masih Dibutuhkan: ${missingFields.join(', ')}

RUANGAN TERSEDIA:
- Samudrantha (10 orang)
- Cedaya (15 orang) 
- Celebes (15 orang)
- Nusanipa (20 orang)
- Balidwipa (25 orang)
- Swarnadwipa (30 orang)
- Jawadwipa (35 orang)

TUGAS ANDA:
1. Bantu pengguna mengumpulkan informasi booking yang diperlukan
2. Berikan respons yang ramah dan membantu dalam bahasa Indonesia
3. Jika informasi sudah lengkap, konfirmasi booking
4. Jika ada informasi yang kurang, tanyakan dengan spesifik
5. Berikan quick actions yang relevan

FORMAT RESPONS:
- Gunakan bahasa Indonesia yang ramah
- Berikan quick actions untuk memudahkan pengguna
- Jika booking lengkap, set action: 'complete'
- Jika masih kurang info, set action: 'continue'

JANGAN:
- Buat booking tanpa informasi lengkap
- Berikan informasi yang tidak akurat
- Lupakan field yang diperlukan (ruangan, topik, PIC, tanggal, waktu, peserta, jenis rapat)`;
  }

  // Call Gemini API
  private async callGeminiAPI(systemPrompt: string, userInput: string): Promise<string> {
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `${systemPrompt}\n\nPesan terbaru dari pengguna: ${userInput}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    };

    const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Invalid response from Gemini API');
    }
  }

  // Parse Gemini response and extract booking information
  private parseGeminiResponse(geminiResponse: string, userInput: string): RBAResponse {
    console.log('🤖 Gemini Response:', geminiResponse);
    
    // Extract booking information from user input
    const extractedInfo = this.extractBookingInfo(userInput);
    
    // Update booking data
    this.updateBookingData(extractedInfo);
    
    // Check if booking is complete
    if (this.isBookingComplete()) {
      return this.handleConfirmation();
    }
    
    // Generate quick actions based on missing fields
    const missingFields = this.getMissingFields();
    const quickActions = this.generateQuickActionsForMissing(missingFields);
    
    return {
      message: geminiResponse,
      action: 'continue',
      bookingData: this.context.currentBooking,
      quickActions: quickActions
    };
  }

  // Fallback rule-based processing
  private async processWithRules(userInput: string): Promise<RBAResponse> {
    console.log('📋 Processing with rules (fallback)...');
    
    // Detect intent
    const intent = this.detectIntent(userInput);
    console.log('🔍 Detected intent:', intent);

    // Handle different intents
    switch (intent) {
      case 'book_room':
        return await this.handleBookingIntent(userInput);
      case 'greeting':
        return this.handleGreeting();
      case 'help':
        return this.handleHelp();
      case 'cancel':
        return this.handleCancel();
      default:
        return await this.handleGeneralInput(userInput);
    }
  }

  // Detect user intent
  private detectIntent(input: string): string {
    const lowerInput = input.toLowerCase();
    
    if (['hai', 'hello', 'hi', 'halo', 'selamat'].some(greeting => lowerInput.includes(greeting))) {
      return 'greeting';
    }
    
    if (['pesan', 'booking', 'ruang', 'meeting', 'rapat'].some(keyword => lowerInput.includes(keyword))) {
      return 'book_room';
    }
    
    if (['bantuan', 'help', 'tolong', 'cara'].some(keyword => lowerInput.includes(keyword))) {
      return 'help';
    }
    
    if (['batal', 'cancel', 'hapus'].some(keyword => lowerInput.includes(keyword))) {
      return 'cancel';
    }
    
    return 'general';
  }

  // Handle booking intent
  private async handleBookingIntent(input: string): Promise<RBAResponse> {
    if (this.context.bookingState === BookingState.IDLE) {
      return this.startBookingProcess();
    }
    
    // Extract information from input
    const extractedInfo = this.extractBookingInfo(input);
    
    // Update booking data
    this.updateBookingData(extractedInfo);
    
    // Check if we have enough data
    if (this.isBookingComplete()) {
      return this.handleConfirmation();
    }
    
    // Ask for missing information
    return this.askForMissingInfo();
  }

  // Start booking process
  private startBookingProcess(): RBAResponse {
    this.context.bookingState = BookingState.COLLECTING_DATA;
    this.context.currentBooking = {};
    
    return {
      message: "Baik! Mari kita mulai proses pemesanan ruangan. 🎯\n\nSaya akan membantu Anda mengumpulkan informasi yang diperlukan:\n\n• **Ruangan** yang diinginkan\n• **Topik** rapat\n• **Jumlah peserta**\n• **Tanggal dan waktu**\n• **Jenis rapat** (internal/eksternal)\n\nSilakan pilih ruangan yang diinginkan:",
      action: 'continue',
      bookingState: BookingState.COLLECTING_DATA,
      quickActions: [
        { label: 'Samudrantha (10 orang)', action: 'room_samudrantha', type: 'primary' },
        { label: 'Cedaya (15 orang)', action: 'room_cedaya', type: 'primary' },
        { label: 'Celebes (15 orang)', action: 'room_celebes', type: 'primary' },
        { label: 'Lihat Semua Ruangan', action: 'view_all_rooms', type: 'secondary' }
      ]
    };
  }

  // Select room
  private selectRoom(roomName: string): RBAResponse {
    this.context.currentBooking.roomName = roomName;
    this.context.currentBooking.roomId = this.getRoomId(roomName);
    
    // Check what information is still missing
    const missing = this.getMissingFields();
    
    if (missing.length === 0) {
      return this.handleConfirmation();
    }
    
    const missingText = missing.join(', ');
    
    return {
      message: `✅ Ruangan **${roomName}** telah dipilih!\n\nSekarang saya masih membutuhkan informasi berikut:\n\n• ${missingText}\n\nSilakan berikan informasi tersebut atau gunakan tombol di bawah.`,
      action: 'continue',
      bookingData: this.context.currentBooking,
      quickActions: this.generateQuickActionsForMissing(missing)
    };
  }

  // Select date
  private selectDate(dateType: string): RBAResponse {
    let date = '';
    switch (dateType) {
      case 'hari_ini':
        date = new Date().toISOString().split('T')[0];
        break;
      case 'besok':
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        date = tomorrow.toISOString().split('T')[0];
        break;
      case 'lusa':
        const dayAfterTomorrow = new Date();
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
        date = dayAfterTomorrow.toISOString().split('T')[0];
        break;
    }
    
    this.context.currentBooking.date = date;
    
    // Check what information is still missing
    const missing = this.getMissingFields();
    
    if (missing.length === 0) {
      return this.handleConfirmation();
    }
    
    const missingText = missing.join(', ');
    
    return {
      message: `✅ Tanggal **${date}** telah dipilih!\n\nSekarang saya masih membutuhkan informasi berikut:\n\n• ${missingText}\n\nSilakan berikan informasi tersebut atau gunakan tombol di bawah.`,
      action: 'continue',
      bookingData: this.context.currentBooking,
      quickActions: this.generateQuickActionsForMissing(missing)
    };
  }

  // Select time
  private selectTime(time: string): RBAResponse {
    // Ensure time format is correct (HH:MM)
    let formattedTime = time;
    if (!time.includes(':')) {
      // If no colon, assume it's just hours
      formattedTime = `${time.padStart(2, '0')}:00`;
    }
    
    this.context.currentBooking.time = formattedTime;
    
    // Check what information is still missing
    const missing = this.getMissingFields();
    
    if (missing.length === 0) {
      return this.handleConfirmation();
    }
    
    const missingText = missing.join(', ');
    
    return {
      message: `✅ Waktu **${formattedTime}** telah dipilih!\n\nSekarang saya masih membutuhkan informasi berikut:\n\n• ${missingText}\n\nSilakan berikan informasi tersebut atau gunakan tombol di bawah.`,
      action: 'continue',
      bookingData: this.context.currentBooking,
      quickActions: this.generateQuickActionsForMissing(missing)
    };
  }

  // Select participants
  private selectParticipants(participants: number): RBAResponse {
    this.context.currentBooking.participants = participants;
    
    // Check what information is still missing
    const missing = this.getMissingFields();
    
    if (missing.length === 0) {
      return this.handleConfirmation();
    }
    
    const missingText = missing.join(', ');
    
    return {
      message: `✅ **${participants} peserta** telah ditentukan!\n\nSekarang saya masih membutuhkan informasi berikut:\n\n• ${missingText}\n\nSilakan berikan informasi tersebut atau gunakan tombol di bawah.`,
      action: 'continue',
      bookingData: this.context.currentBooking,
      quickActions: this.generateQuickActionsForMissing(missing)
    };
  }

  // Handle confirmation
  private handleConfirmation(): RBAResponse {
    const booking = this.context.currentBooking;
    
    // Validate all required fields
    if (!this.isBookingComplete()) {
      return this.askForMissingInfo();
    }
    
    // Set default values for missing optional fields
    if (!booking.topic) {
      booking.topic = 'Meeting AI Booking';
    }
    if (!booking.pic) {
      // Get PIC from user data or use default
      let userPIC = 'AI User';
      try {
        const userDataStr = localStorage.getItem('user_data');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          userPIC = userData.full_name || userData.username || userData.email?.split('@')[0] || 'AI User';
        }
      } catch (error) {
        console.log('Failed to get user data for PIC:', error);
      }
      booking.pic = userPIC;
    }
    if (!booking.meetingType) {
      booking.meetingType = 'internal';
    }
    
    // Generate booking ID
    booking.id = `AI-${Date.now()}`;
    
    // Set end time (default 2 hours)
    const startTime = new Date(`${booking.date}T${booking.time}`);
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
    booking.endTime = endTime.toTimeString().slice(0, 5);
    
    console.log('✅ Booking completed:', booking);
    
    // Save booking to database
    try {
      this.saveBookingToDatabase(booking);
      console.log('✅ Booking saved to database successfully');
    } catch (error) {
      console.error('❌ Failed to save booking to database:', error);
      // Continue with confirmation even if database save fails
    }
    
    return {
      message: `🎉 **PEMESANAN BERHASIL DIPROSES!**\n\n✅ **Detail Pemesanan:**\n🏢 Ruangan: ${booking.roomName}\n👥 Peserta: ${booking.participants} orang\n📅 Tanggal: ${booking.date}\n⏰ Waktu: ${booking.time} - ${booking.endTime}\n📋 Topik: ${booking.topic}\n👤 PIC: ${booking.pic}\n🏢 Jenis: ${booking.meetingType}\n\n**Pemesanan Anda telah berhasil dibuat!**\nAnda akan diarahkan ke halaman konfirmasi.`,
      action: 'complete',
      bookingData: booking,
      quickActions: [],
      suggestions: [
        'Pemesanan berhasil dibuat',
        'Anda akan diarahkan ke halaman konfirmasi',
        'Terima kasih telah menggunakan layanan kami'
      ]
    };
  }

  // Extract booking information from user input using intelligent parsing
  private extractBookingInfo(input: string): Partial<Booking> {
    const lowerInput = input.toLowerCase();
    const extracted: Partial<Booking> = {};
    
    console.log('🔍 Extracting info from input:', input);
    
    // Extract room name
    const roomNames = ['samudrantha', 'cedaya', 'celebes', 'nusanipa', 'balidwipa', 'swarnadwipa', 'jawadwipa'];
    for (const roomName of roomNames) {
      if (lowerInput.includes(roomName)) {
        extracted.roomName = roomName.charAt(0).toUpperCase() + roomName.slice(1);
        extracted.roomId = this.getRoomId(roomName);
        break;
      }
    }
    
    // Extract topic - more intelligent extraction
    if (lowerInput.includes('topik') || lowerInput.includes('tentang') || lowerInput.includes('meeting') || lowerInput.includes('rapat')) {
      const topicPatterns = [
        /(?:topik|tentang|meeting|rapat)\s+(.+)/i,
        /(?:untuk|about|regarding)\s+(.+)/i
      ];
      
      for (const pattern of topicPatterns) {
        const match = input.match(pattern);
        if (match && match[1].trim().length > 3) {
          extracted.topic = match[1].trim();
          break;
        }
      }
    } else if (input.length > 15 && !lowerInput.includes('ruang') && !lowerInput.includes('tanggal') && !lowerInput.includes('jam') && !lowerInput.includes('peserta')) {
      // If input is long enough and doesn't contain other keywords, treat as topic
      extracted.topic = input.trim();
    }
    
    // Extract participants - more flexible patterns
    const participantPatterns = [
      /(\d+)\s*(?:orang|peserta|people|person)/i,
      /(?:untuk|for)\s*(\d+)/i,
      /(\d+)\s*(?:akan|will|going to)/i
    ];
    
    for (const pattern of participantPatterns) {
      const match = input.match(pattern);
      if (match) {
        const num = parseInt(match[1]);
        if (num > 0 && num <= 50) { // Reasonable range
          extracted.participants = num;
          break;
        }
      }
    }
    
    // Extract date - more comprehensive
    if (lowerInput.includes('hari ini') || lowerInput.includes('today')) {
      extracted.date = new Date().toISOString().split('T')[0];
    } else if (lowerInput.includes('besok') || lowerInput.includes('tomorrow')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      extracted.date = tomorrow.toISOString().split('T')[0];
    } else if (lowerInput.includes('lusa') || lowerInput.includes('day after tomorrow')) {
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      extracted.date = dayAfterTomorrow.toISOString().split('T')[0];
    }
    
    // Extract time - more comprehensive
    const timePatterns = [
      /(\d{1,2}):(\d{2})\s*(?:am|pm|pagi|siang|sore|malam)?/i,
      /(\d{1,2})\s*(?:am|pm|pagi|siang|sore|malam)/i,
      /(?:jam|pukul|at)\s*(\d{1,2}):?(\d{2})?/i
    ];
    
    for (const pattern of timePatterns) {
      const match = input.match(pattern);
      if (match) {
        let hours = parseInt(match[1]);
        const minutes = match[2] ? parseInt(match[2]) : 0;
        
        // Handle AM/PM and Indonesian time indicators
        if (lowerInput.includes('pm') || lowerInput.includes('siang') || lowerInput.includes('sore') || lowerInput.includes('malam')) {
          if (hours < 12) hours += 12;
        } else if (lowerInput.includes('am') || lowerInput.includes('pagi')) {
          if (hours === 12) hours = 0;
        }
        
        // Validate time
        if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
          extracted.time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          break;
        }
      }
    }
    
    // Extract meeting type
    if (lowerInput.includes('internal') || lowerInput.includes('dalam')) {
      extracted.meetingType = 'internal';
    } else if (lowerInput.includes('eksternal') || lowerInput.includes('luar')) {
      extracted.meetingType = 'external';
    }
    
    // Extract PIC if mentioned
    const picPatterns = [
      /(?:pic|penanggung jawab|penanggungjawab)\s+(.+)/i,
      /(?:oleh|by)\s+(.+)/i,
      /(?:atas nama|on behalf of)\s+(.+)/i
    ];
    
    for (const pattern of picPatterns) {
      const match = input.match(pattern);
      if (match && match[1].trim().length > 2) {
        extracted.pic = match[1].trim();
        break;
      }
    }
    
    console.log('🔍 Extracted info from input:', extracted);
    
    return extracted;
  }

  // Update booking data
  private updateBookingData(newData: Partial<Booking>): void {
    this.context.currentBooking = { ...this.context.currentBooking, ...newData };
  }

  // Check if booking is complete
  private isBookingComplete(): boolean {
    const booking = this.context.currentBooking;
    
    // Check all required fields
    const hasRoomName = booking.roomName && booking.roomName.trim() !== '';
    const hasDate = booking.date && booking.date.trim() !== '';
    const hasTime = booking.time && booking.time.trim() !== '';
    const hasParticipants = booking.participants && booking.participants > 0;
    const hasTopic = booking.topic && booking.topic.trim() !== '';
    const hasPic = booking.pic && booking.pic.trim() !== '';
    const hasMeetingType = booking.meetingType && booking.meetingType.trim() !== '';
    
    console.log('🔍 Booking completeness check:', {
      hasRoomName,
      hasDate,
      hasTime,
      hasParticipants,
      hasTopic,
      hasPic,
      hasMeetingType,
      roomName: booking.roomName,
      date: booking.date,
      time: booking.time,
      participants: booking.participants,
      topic: booking.topic,
      pic: booking.pic,
      meetingType: booking.meetingType
    });
    
    return hasRoomName && hasDate && hasTime && hasParticipants && hasTopic && hasPic && hasMeetingType;
  }

  // Get missing fields
  private getMissingFields(): string[] {
    const booking = this.context.currentBooking;
    const missing: string[] = [];
    
    if (!booking.roomName || booking.roomName.trim() === '') missing.push('ruangan');
    if (!booking.topic || booking.topic.trim() === '') missing.push('topik rapat');
    if (!booking.pic || booking.pic.trim() === '') missing.push('PIC');
    if (!booking.date || booking.date.trim() === '') missing.push('tanggal');
    if (!booking.time || booking.time.trim() === '') missing.push('waktu');
    if (!booking.participants || booking.participants <= 0) missing.push('jumlah peserta');
    if (!booking.meetingType || booking.meetingType.trim() === '') missing.push('jenis rapat');
    
    return missing;
  }

  // Ask for missing information
  private askForMissingInfo(): RBAResponse {
    const missing = this.getMissingFields();
    const missingText = missing.join(', ');
    
    console.log('❌ Missing information:', missing);
    console.log('📋 Current booking data:', this.context.currentBooking);
    
    return {
      message: `Untuk melengkapi pemesanan, saya masih membutuhkan informasi berikut:\n\n• ${missingText}\n\nSilakan berikan informasi tersebut atau gunakan tombol di bawah.`,
      action: 'continue',
      bookingData: this.context.currentBooking,
      quickActions: this.generateQuickActionsForMissing(missing)
    };
  }

  // Generate quick actions for missing information
  private generateQuickActionsForMissing(missing: string[]): Array<{label: string; action: string; type: 'primary' | 'secondary'}> {
    const actions: Array<{label: string; action: string; type: 'primary' | 'secondary'}> = [];
    
    if (missing.includes('ruangan')) {
      actions.push(
        { label: 'Samudrantha', action: 'room_samudrantha', type: 'primary' },
        { label: 'Cedaya', action: 'room_cedaya', type: 'primary' },
        { label: 'Celebes', action: 'room_celebes', type: 'secondary' }
      );
    }
    
    if (missing.includes('tanggal')) {
      actions.push(
        { label: 'Hari Ini', action: 'date_hari_ini', type: 'primary' },
        { label: 'Besok', action: 'date_besok', type: 'primary' },
        { label: 'Lusa', action: 'date_lusa', type: 'secondary' }
      );
    }
    
    if (missing.includes('waktu')) {
      actions.push(
        { label: '09:00', action: 'time_09_00', type: 'primary' },
        { label: '10:00', action: 'time_10_00', type: 'primary' },
        { label: '14:00', action: 'time_14_00', type: 'primary' },
        { label: '15:00', action: 'time_15_00', type: 'secondary' }
      );
    }
    
    if (missing.includes('jumlah peserta')) {
      actions.push(
        { label: '5 orang', action: 'participants_5', type: 'primary' },
        { label: '10 orang', action: 'participants_10', type: 'primary' },
        { label: '15 orang', action: 'participants_15', type: 'primary' },
        { label: '20 orang', action: 'participants_20', type: 'secondary' }
      );
    }
    
    if (missing.includes('jenis rapat')) {
      actions.push(
        { label: 'Internal', action: 'meeting_internal', type: 'primary' },
        { label: 'Eksternal', action: 'meeting_eksternal', type: 'primary' }
      );
    }
    
    if (missing.includes('topik rapat')) {
      actions.push(
        { label: 'Meeting Internal', action: 'topic_meeting_internal', type: 'primary' },
        { label: 'Meeting Eksternal', action: 'topic_meeting_eksternal', type: 'primary' },
        { label: 'Presentasi', action: 'topic_presentasi', type: 'secondary' },
        { label: 'Diskusi Tim', action: 'topic_diskusi_tim', type: 'secondary' }
      );
    }
    
    return actions;
  }

  // Handle greeting
  private handleGreeting(): RBAResponse {
    return {
      message: "Halo! 👋 Saya adalah asisten AI Spacio yang siap membantu Anda memesan ruang rapat dengan mudah! 🎯\n\nSilakan pilih salah satu opsi di bawah atau ketik pesan Anda secara manual.",
      action: 'continue',
      quickActions: [
        { label: 'Pesan Ruangan', action: 'book_room', type: 'primary' },
        { label: 'Bantuan', action: 'help', type: 'secondary' }
      ]
    };
  }

  // Handle help
  private handleHelp(): RBAResponse {
    return {
      message: "**FAQ - Pertanyaan yang Sering Diajukan:**\n\n**Q: Berapa lama waktu booking?**\nA: Booking bisa dilakukan minimal 1 jam sebelum waktu rapat.\n\n**Q: Apakah ada biaya booking?**\nA: Tidak ada biaya untuk booking ruangan meeting.\n\n**Q: Bagaimana cara cancel booking?**\nA: Hubungi admin atau gunakan fitur cancel di aplikasi.\n\n**Q: Apakah bisa booking untuk hari libur?**\nA: Ya, tapi perlu konfirmasi khusus dari admin.\n\n**Q: Fasilitas apa saja yang tersedia?**\nA: Proyektor, whiteboard, AC, Wi-Fi, dan sound system.",
      action: 'continue',
      quickActions: [
        { label: 'Mulai Booking', action: 'book_room', type: 'primary' },
        { label: 'Lihat Ruangan', action: 'view_rooms', type: 'secondary' }
      ]
    };
  }

  // Handle cancel
  private handleCancel(): RBAResponse {
    this.context.bookingState = BookingState.IDLE;
    this.context.currentBooking = {};
    
    return {
      message: "Pemesanan telah dibatalkan. Apakah ada yang bisa saya bantu lagi?",
      action: 'continue',
      quickActions: [
        { label: 'Mulai Booking Baru', action: 'book_room', type: 'primary' },
        { label: 'Bantuan', action: 'help', type: 'secondary' }
      ]
    };
  }

  // Handle general input
  private async handleGeneralInput(input: string): Promise<RBAResponse> {
    // Try to extract booking information from general input
    const extractedInfo = this.extractBookingInfo(input);
    
    if (Object.keys(extractedInfo).length > 0) {
      this.updateBookingData(extractedInfo);
      
      if (this.isBookingComplete()) {
        return this.handleConfirmation();
      }
      
      return this.askForMissingInfo();
    }
    
    return {
      message: "Maaf, saya belum memahami maksud Anda. Silakan gunakan tombol yang tersedia atau ketik pesan yang lebih spesifik.",
      action: 'continue',
      quickActions: [
        { label: 'Pesan Ruangan', action: 'book_room', type: 'primary' },
        { label: 'Bantuan', action: 'help', type: 'secondary' }
      ]
    };
  }

  // Get room ID from room name
  private getRoomId(roomName: string): number {
    const roomMap: { [key: string]: number } = {
      'samudrantha': 1,
      'cedaya': 2,
      'celebes': 3,
      'nusanipa': 4,
      'balidwipa': 5,
      'swarnadwipa': 6,
      'jawadwipa': 7
    };
    
    return roomMap[roomName.toLowerCase()] || 1;
  }

  // Save booking to database
  private saveBookingToDatabase(booking: Partial<Booking>): void {
    try {
      const bookingData = {
        id: booking.id,
        room_id: booking.roomId,
        room_name: booking.roomName,
        topic: booking.topic,
        meeting_date: booking.date,
        meeting_time: booking.time,
        end_time: booking.endTime,
        duration: 120, // 2 hours in minutes
        participants: booking.participants,
        pic: booking.pic,
        meeting_type: booking.meetingType,
        booking_state: 'BOOKED',
        source: 'ai',
        created_at: new Date().toISOString()
      };

      console.log('💾 Saving booking to database:', bookingData);

      // Call the existing API endpoint
      fetch('/api/bookings.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Database save failed: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(result => {
        console.log('✅ Database save result:', result);
        // Also save to localStorage for history
        this.saveToLocalStorageHistory(booking);
      })
      .catch(error => {
        console.error('❌ Error saving to database:', error);
      });

    } catch (error) {
      console.error('❌ Error saving to database:', error);
    }
  }

  // Save booking to localStorage history
  private saveToLocalStorageHistory(booking: Partial<Booking>): void {
    try {
      const historyItem = {
        id: booking.id,
        roomName: booking.roomName,
        topic: booking.topic,
        pic: booking.pic,
        participants: booking.participants,
        date: booking.date,
        time: booking.time,
        endTime: booking.endTime,
        meetingType: booking.meetingType,
        status: 'Selesai' as const,
        createdAt: new Date().toISOString(),
        source: 'ai'
      };

      // Get existing history
      const existingHistory = JSON.parse(localStorage.getItem('booking_history') || '[]');
      
      // Add new booking to history
      existingHistory.unshift(historyItem);
      
      // Keep only last 50 bookings
      if (existingHistory.length > 50) {
        existingHistory.splice(50);
      }
      
      // Save back to localStorage
      localStorage.setItem('booking_history', JSON.stringify(existingHistory));
      
      console.log('✅ Booking added to localStorage history');
    } catch (error) {
      console.error('❌ Error saving to localStorage history:', error);
    }
  }

  // Add to conversation history
  private addToHistory(role: 'user' | 'assistant', content: string): void {
    this.context.conversationHistory.push({
      role,
      content,
      timestamp: new Date()
    });
  }

  // Get conversation history
  public getConversationHistory(): Array<{role: 'user' | 'assistant'; content: string; timestamp: Date}> {
    return this.context.conversationHistory;
  }

  // Get current booking
  public getCurrentBooking(): Partial<Booking> {
    return this.context.currentBooking;
  }

  // Get booking state
  public getBookingState(): BookingState {
    return this.context.bookingState;
  }

  // Reset booking
  public resetBooking(): void {
    this.context.bookingState = BookingState.IDLE;
    this.context.currentBooking = {};
  }
}

// Factory function to create assistant
export function createRoomBookingAssistantOptimized(userId: string, sessionId: string): RoomBookingAssistantOptimized {
  return new RoomBookingAssistantOptimized(userId, sessionId);
}

export default RoomBookingAssistantOptimized;
