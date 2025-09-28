import { Booking, MeetingRoom, RBAResponse, BookingState } from '../types';
import { geminiConfig } from './geminiConfig';

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
  dataCollection: any;
  availableRooms: MeetingRoom[];
}

class RoomBookingAssistant {
  private context: RBAContext;
  private availableRooms: MeetingRoom[] = [];
  private apiKey: string;

  constructor(userId: string, sessionId: string) {
    this.apiKey = geminiConfig.getConfig().apiKey;
    
    // Get current user data from localStorage
    const userDataStr = localStorage.getItem('user_data');
    const userData = userDataStr ? JSON.parse(userDataStr) : null;
    const currentUsername = userData?.username || userData?.full_name || 'User';
    
    this.context = {
      conversationHistory: [],
      currentBooking: {
        pic: currentUsername // Auto-fill PIC from current user
      },
      bookingState: BookingState.IDLE,
      userPreferences: {
        preferredRooms: [],
        preferredTimes: [],
        meetingTypes: [],
        facilityPreferences: []
      },
      sessionId,
      userId,
      dataCollection: {},
      availableRooms: []
    };
    
    console.log('🔍 RBA - Auto-filled PIC from current user:', currentUsername);
  }

  // Main processing function
  public async processInput(userInput: string): Promise<RBAResponse> {
    console.log('🎯 RBA processInput called with:', userInput);
    console.log('🔑 Current API Key Status:', this.apiKey ? '✅ Available' : '❌ Missing');
    console.log('🤖 AI Mode:', this.apiKey ? 'ENABLED' : 'DISABLED');

    try {
      // Add user input to history
      this.addToHistory('user', userInput);

      // Analyze booking intent
      const bookingAnalysis = this.analyzeBookingInput(userInput);
      console.log('🔍 Booking Intent Detected:', bookingAnalysis.hasBookingIntent);
      console.log('📝 Input Analysis:', {
        input: userInput,
        length: userInput.length,
        isGreeting: this.isGreeting(userInput),
        hasBookingKeywords: this.hasBookingKeywords(userInput)
      });

      if (bookingAnalysis.hasBookingIntent) {
        console.log('✅ Booking intent confirmed, processing with AI...');
        return await this.generateAIResponse(userInput, bookingAnalysis);
      } else {
        console.log('❌ No booking intent detected, using fallback...');
        return this.generateGeneralResponse(userInput);
      }
    } catch (error) {
      console.error('❌ Error in processInput:', error);
      return this.handleError(error);
    }
  }

  // Analyze user input for booking intent
  private analyzeBookingInput(userInput: string): any {
    const lowerInput = userInput.toLowerCase();
    const extracted: Partial<Booking> = {};
    
    // Check for confirmation responses
    const confirmations = ['ya', 'benar', 'ok', 'setuju', 'betul', 'iya', 'yes', 'okay'];
    const rejections = ['tidak', 'salah', 'ubah', 'koreksi', 'no', 'wrong'];
    
    const isConfirmation = confirmations.some(conf => lowerInput.includes(conf));
    const isRejection = rejections.some(rej => lowerInput.includes(rej));
    
    if (isConfirmation) {
      (extracted as any).isConfirmation = true;
    } else if (isRejection) {
      (extracted as any).isRejection = true;
    }
    
    // Extract room name
    const roomNames = ['samudrantha', 'cedaya', 'celebes', 'kalamanthana', 'nusanipa', 'balidwipa', 'swarnadwipa', 'jawadwipa'];
    for (const room of roomNames) {
      if (lowerInput.includes(room)) {
        extracted.roomName = this.capitalizeFirst(room) + ' Meeting Room';
        break;
      }
    }

    // Extract participants
    const participantsMatch = lowerInput.match(/(\d+)\s*(?:orang|peserta|people|pax)/);
    if (participantsMatch) {
      extracted.participants = parseInt(participantsMatch[1]);
    }

    // Extract PIC - improved patterns
    const picPatterns = [
      /pic[:\s]*([^,]+)/i, 
      /penanggung[:\s]*([^,]+)/i,
      /picnya\s+([^,]+)/i,
      /penanggung\s+jawab[:\s]*([^,]+)/i
    ];
    for (const pattern of picPatterns) {
      const match = userInput.match(pattern);
      if (match && match[1].trim()) {
        extracted.pic = match[1].trim();
        break;
      }
    }

    // Extract topic - improved patterns
    const topicPatterns = [
      /topik[:\s]*([^,]+)/i, 
      /tema[:\s]*([^,]+)/i,
      /topiknya\s+([^,]+)/i,
      /tema\s+rapat[:\s]*([^,]+)/i
    ];
    for (const pattern of topicPatterns) {
      const match = userInput.match(pattern);
      if (match && match[1].trim()) {
        extracted.topic = match[1].trim();
        break;
      }
    }

    // Extract meeting type - improved patterns
    console.log('🔍 RBA - Checking meeting type in input:', lowerInput);
    if (lowerInput.includes('internal') || lowerInput.includes('dalam')) {
      extracted.meetingType = 'internal';
      console.log('🔍 RBA - Extracted meeting type: internal');
    } else if (lowerInput.includes('external') || lowerInput.includes('eksternal') || lowerInput.includes('luar')) {
      extracted.meetingType = 'external';
      console.log('🔍 RBA - Extracted meeting type: external');
    } else {
      console.log('🔍 RBA - No meeting type found in input');
    }

    // Extract date - use browser time directly (already in WIB)
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    console.log('🔍 RBA - Current date info:', {
      now: now.toISOString(),
      todayStr: todayStr,
      currentDate: now.getDate(),
      currentMonth: now.getMonth() + 1,
      currentYear: now.getFullYear()
    });
    
    if (lowerInput.includes('hari ini')) {
      extracted.date = todayStr;
      console.log('🔍 RBA - Extracted date "hari ini":', extracted.date);
    } else if (lowerInput.includes('besok') || lowerInput.includes('tomorrow')) {
      // Fix: Use proper date arithmetic with Indonesia timezone
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
      extracted.date = tomorrowStr;
      console.log('🔍 RBA - Extracted date "besok":', extracted.date);
      console.log('🔍 RBA - Tomorrow calculation:', {
        todayDate: now.getDate(),
        todayMonth: now.getMonth() + 1,
        todayYear: now.getFullYear(),
        tomorrowDate: tomorrow.getDate(),
        tomorrowMonth: tomorrow.getMonth() + 1,
        tomorrowYear: tomorrow.getFullYear(),
        tomorrowFormatted: tomorrowStr
      });
    } else if (lowerInput.includes('lusa')) {
      const dayAfterTomorrow = new Date(now);
      dayAfterTomorrow.setDate(now.getDate() + 2);
      const dayAfterTomorrowStr = `${dayAfterTomorrow.getFullYear()}-${String(dayAfterTomorrow.getMonth() + 1).padStart(2, '0')}-${String(dayAfterTomorrow.getDate()).padStart(2, '0')}`;
      extracted.date = dayAfterTomorrowStr;
      console.log('🔍 RBA - Extracted date "lusa":', extracted.date);
    }

    // Extract time - improved patterns
    const timePatterns = [
      /(?:jam|pukul)\s*(\d{1,2})(?::(\d{2}))?/,
      /(\d{1,2}):(\d{2})/,
      /(\d{1,2})\.(\d{2})/
    ];
    
    for (const pattern of timePatterns) {
      const timeMatch = lowerInput.match(pattern);
      if (timeMatch) {
        const hour = parseInt(timeMatch[1]);
        const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        extracted.time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        break;
      }
    }

    // Update context with extracted data
    this.updateBookingContext(extracted);

    // Calculate confidence and missing fields - improved logic (PIC auto-filled from user)
    const fields = ['roomName', 'topic', 'participants', 'date', 'time', 'meetingType'];
    const extractedFields = fields.filter(field => {
      const value = extracted[field as keyof Booking];
      return value !== null && value !== undefined && value !== '' && value !== 0;
    });
    const confidence = extractedFields.length / fields.length;
    const missingFields = fields.filter(field => {
      const value = extracted[field as keyof Booking];
      return value === null || value === undefined || value === '' || value === 0;
    });
    
    // Debug logging for extracted data
    console.log('🔍 RBA - Extracted data summary:', {
      roomName: extracted.roomName,
      topic: extracted.topic,
      participants: extracted.participants,
      date: extracted.date,
      time: extracted.time,
      meetingType: extracted.meetingType,
      confidence: confidence,
      missingFields: missingFields
    });
    
    // Boost confidence if we have most critical fields (PIC is auto-filled)
    const criticalFields = ['roomName', 'topic', 'date', 'time', 'participants', 'meetingType'];
    const criticalExtracted = criticalFields.filter(field => {
      const value = extracted[field as keyof Booking];
      return value !== null && value !== undefined && value !== '' && value !== 0;
    });
    
    // Calculate completeness percentage
    const completenessPercentage = (criticalExtracted.length / criticalFields.length) * 100;
    console.log('🔍 Data completeness:', {
      extracted: criticalExtracted.length,
      total: criticalFields.length,
      percentage: completenessPercentage
    });
    
    if (criticalExtracted.length >= 5) {
      // If we have 5+ critical fields, consider it high confidence
      const adjustedConfidence = Math.max(confidence, 0.9);
      console.log('🔍 Boosted confidence due to critical fields:', adjustedConfidence);
    } else if (criticalExtracted.length >= 4) {
      // If we have 4+ critical fields, consider it medium-high confidence
      const adjustedConfidence = Math.max(confidence, 0.8);
      console.log('🔍 Boosted confidence due to critical fields:', adjustedConfidence);
    }

    console.log('🔍 analyzeBookingInput - extracted data:', extracted);
    console.log('🔍 analyzeBookingInput - confidence:', confidence);
    console.log('🔍 analyzeBookingInput - missing fields:', missingFields);

    // Use adjusted confidence if available
    const finalConfidence = criticalExtracted.length >= 5 ? Math.max(confidence, 0.9) : 
                           criticalExtracted.length >= 4 ? Math.max(confidence, 0.8) : 
                           Math.max(confidence, 0.7);
    
    // Check if we have enough data when combined with existing context
    const mergedData = { ...this.context.currentBooking, ...extracted };
    const mergedCompletedFields = criticalFields.filter(field => {
      const value = mergedData[field as keyof Booking];
      return value !== null && value !== undefined && value !== '' && value !== 0;
    });
    
    const mergedCompleteness = (mergedCompletedFields.length / criticalFields.length) * 100;
    console.log('🔍 RBA - Merged completeness check:', {
      existing: this.context.currentBooking,
      new: extracted,
      merged: mergedData,
      completed: mergedCompletedFields.length,
      percentage: mergedCompleteness
    });
    
    return {
      hasBookingIntent: true,
      extractedData: extracted,
      confidence: finalConfidence,
      missingFields: missingFields,
      mergedData: mergedData,
      mergedCompleteness: mergedCompleteness
    };
  }

  // Generate AI response using Gemini API
  private async generateAIResponse(userInput: string, analysis: any): Promise<RBAResponse> {
    try {
      const prompt = this.buildAIPrompt(userInput, analysis);
      console.log('📋 Generated Prompt Length:', prompt.length);
      
      const aiResponse = await this.callGeminiAPI(prompt);
      console.log('✅ AI Response received, processing...');
      
      return this.processGeminiResponse(aiResponse, userInput, analysis);
    } catch (error) {
      console.error('❌ AI Response generation failed:', error);
      
      // Check if it's a 429 error (quota exceeded)
      if (error instanceof Error && error.message.includes('429')) {
        console.warn('⚠️ Gemini API quota exceeded, using fallback mode');
        return this.generateQuotaExceededResponse(analysis);
      }
      
      return this.generateFallbackResponse(analysis);
    }
  }

  // Build AI prompt
  private buildAIPrompt(userInput: string, analysis: any): string {
    const { extractedData, missingFields, confidence } = analysis;
    
    // Get accumulated data from context
    const accumulatedData = this.context.currentBooking;
    
    // Merge new extracted data with accumulated data
    const mergedData = { ...accumulatedData, ...extractedData };
    
    // Calculate completeness based on merged data
    const criticalFields = ['roomName', 'topic', 'date', 'time', 'participants', 'meetingType'];
    const completedFields = criticalFields.filter(field => {
      const value = mergedData[field as keyof Booking];
      return value !== null && value !== undefined && value !== '' && value !== 0;
    });
    
    const completenessPercentage = (completedFields.length / criticalFields.length) * 100;
    
    console.log('🔍 RBA - Merged data analysis:', {
      accumulated: accumulatedData,
      extracted: extractedData,
      merged: mergedData,
      completed: completedFields.length,
      total: criticalFields.length,
      percentage: completenessPercentage
    });
    
    return `Anda adalah Spacio AI Assistant - Sistem AI Pemesanan Ruangan Cerdas.

KONTEKS SISTEM SPACIO:
- Aplikasi: Spacio (Smart Room Booking & Assistant AI)
- Database: Ruangan dengan kapasitas, lokasi, fasilitas standar, status ketersediaan
- Fitur: Booking, rekomendasi cerdas, Q&A, konflik detection, notifikasi

DATABASE RUANGAN (Aktual):
- Samudrantha Meeting Room: Lantai 3, Kapasitas 10, Fasilitas: Proyektor, Whiteboard, AC, Wi-Fi
- Cedaya Meeting Room: Lantai 4, Kapasitas 8, Fasilitas: Papan Tulis, AC, Sound System
- Celebes Meeting Room: Lantai 5, Kapasitas 6, Fasilitas: Video Conference, AC
- Kalamanthana Meeting Room: Lantai 2, Kapasitas 4, Fasilitas: AC
- Nusanipa Meeting Room: Lantai 6, Kapasitas 12, Fasilitas: Proyektor, Papan Tulis, AC
- Balidwipa Meeting Room: Lantai 7, Kapasitas 15, Fasilitas: Proyektor, Sound System, AC
- Swarnadwipa Meeting Room: Lantai 8, Kapasitas 20, Fasilitas: Proyektor, Papan Tulis, Sound System, AC
- Jawadwipa Meeting Room: Lantai 9, Kapasitas 25, Fasilitas: Proyektor, Papan Tulis, Sound System, Video Conference, AC

DATA YANG SUDAH TERAKUMULASI (DARI PERCAKAPAN SEBELUMNYA):
${JSON.stringify(accumulatedData, null, 2)}

DATA BARU YANG DIEKSTRAK DARI INPUT INI:
${JSON.stringify(extractedData, null, 2)}

DATA GABUNGAN (AKUMULASI + BARU):
${JSON.stringify(mergedData, null, 2)}

ANALISIS INPUT USER:
Input: "${userInput}"
Confidence: ${(confidence * 100).toFixed(0)}%
Field yang masih kurang: ${missingFields.join(', ')}

PENTING: Gunakan data yang sudah diekstrak di atas dengan benar:
- Jika extractedData.date ada, gunakan tanggal tersebut (JANGAN ubah)
- Jika extractedData.time ada, gunakan waktu tersebut (JANGAN ubah)
- Jika extractedData.meetingType ada, gunakan jenis tersebut (JANGAN ubah)
- Jika extractedData.roomName ada, gunakan ruangan tersebut (JANGAN ubah)

PERINGATAN KHUSUS:
- Jika extractedData.date = "2025-09-23" (besok), JANGAN ubah menjadi "2025-09-22" (hari ini)
- Jika extractedData.date = "2025-09-24" (lusa), JANGAN ubah menjadi tanggal lain
- Gunakan TEPAT tanggal yang sudah diekstrak dari input user

STATUS KONFIRMASI:
- isConfirmation: ${extractedData.isConfirmation || false}
- isRejection: ${extractedData.isRejection || false}
- Data lengkap (input baru): ${confidence > 0.8 ? 'YA' : 'TIDAK'}
- Data lengkap (gabungan): ${completenessPercentage >= 80 ? 'YA' : 'TIDAK'}

DETEKSI KELENGKAPAN DATA (BERDASARKAN DATA GABUNGAN):
- roomName: ${mergedData.roomName ? '✅ ADA' : '❌ KOSONG'} (${mergedData.roomName || 'belum ada'})
- topic: ${mergedData.topic ? '✅ ADA' : '❌ KOSONG'} (${mergedData.topic || 'belum ada'})
- date: ${mergedData.date ? '✅ ADA' : '❌ KOSONG'} (${mergedData.date || 'belum ada'})
- time: ${mergedData.time ? '✅ ADA' : '❌ KOSONG'} (${mergedData.time || 'belum ada'})
- participants: ${mergedData.participants ? '✅ ADA' : '❌ KOSONG'} (${mergedData.participants || 'belum ada'})
- meetingType: ${mergedData.meetingType ? '✅ ADA' : '❌ KOSONG'} (${mergedData.meetingType || 'belum ada'})

HITUNG KELENGKAPAN:
- Field yang ada: ${completedFields.length}
- Field yang dibutuhkan: 6 (roomName, topic, date, time, participants, meetingType)
- Persentase kelengkapan: ${completenessPercentage.toFixed(0)}%

TUGAS ANDA:
1. Berikan respons yang cerdas berdasarkan DATA GABUNGAN (akumulasi + baru)
2. Jika data lengkap (>80%), berikan konfirmasi dan lanjut ke proses booking
3. Jika data kurang lengkap, tanyakan HANYA field yang masih kurang dengan cara yang natural
4. JANGAN menanyakan field yang sudah ada di data gabungan
5. Berikan saran fasilitas berdasarkan topik meeting
6. Jika ada konflik potensial, berikan peringatan dan alternatif

ATURAN PENTING:
- Gunakan DATA GABUNGAN untuk menentukan kelengkapan, bukan hanya data baru
- Jika ${completenessPercentage.toFixed(0)}% >= 80%, langsung ke konfirmasi
- Jika ${completenessPercentage.toFixed(0)}% < 80%, tanyakan field yang masih kosong
- JANGAN tanya ulang field yang sudah ada di data gabungan

LOGIKA KONFIRMASI:
- Jika user mengkonfirmasi dengan "ya", "benar", "ok", "setuju" → LANGSUNG ke proses booking
- Jika user mengkonfirmasi dengan "tidak", "salah", "ubah" → Tanyakan koreksi
- Jika data sudah lengkap dan user konfirmasi → action: "complete"
- Jika data belum lengkap → action: "continue"

PRIORITAS RESPONS:
1. Jika isConfirmation = true DAN data lengkap (>80%) → LANGSUNG complete booking
2. Jika isConfirmation = true TAPI data belum lengkap → Tanyakan field yang kurang
3. Jika isRejection = true → Tanyakan koreksi
4. Jika data sudah lengkap (>80%) DAN tidak ada konfirmasi → Berikan konfirmasi final
5. Jika data belum lengkap → Tanyakan field yang kurang dengan spesifik

ATURAN PENTING:
- JANGAN menanyakan ulang data yang sudah jelas diberikan
- PIC sudah otomatis diisi dari username akun yang sedang login, JANGAN tanyakan PIC
- Jika user sudah memberikan: ruangan, topik, peserta, tanggal, waktu, jenis → LANGSUNG konfirmasi
- Jika data sudah >80% lengkap → Berikan konfirmasi final, bukan tanya lagi
- Untuk meeting type: Tanyakan "Internal" atau "Eksternal" jika belum jelas
- Jika user tidak menyebutkan jenis meeting, berikan opsi Internal/Eksternal dengan quick actions
- JANGAN mengubah data tanggal yang sudah diekstrak dari input user
- JANGAN mengubah data waktu yang sudah diekstrak dari input user
- Gunakan data yang sudah diekstrak dengan benar, jangan override dengan data baru

DETEKSI DATA LENGKAP:
- Data dianggap LENGKAP jika memiliki: roomName, topic, date, time, participants, meetingType
- PIC otomatis diisi, tidak perlu ditanyakan
- Jika 5 dari 6 field sudah ada → LANGSUNG ke konfirmasi
- JANGAN tanya lagi field yang sudah jelas dari extractedData

RESPONS HARUS:
- Natural dan conversational dalam Bahasa Indonesia
- Cerdas dan informatif
- Mengarahkan ke proses booking yang sistematis
- Memberikan insight yang berguna

Format respons dalam JSON:
{
  "message": "pesan untuk user",
  "action": "continue|complete|clarify",
  "bookingData": {
    "roomName": "nama ruangan",
    "topic": "topik rapat",
    "pic": "nama PIC",
    "participants": "jumlah peserta",
    "date": "tanggal",
    "time": "waktu",
    "meetingType": "internal|external"
  },
  "quickActions": [
    {"label": "Internal", "action": "set_internal", "type": "primary"},
    {"label": "Eksternal", "action": "set_external", "type": "primary"}
  ]
}

CONTOH RESPONS KONFIRMASI:
- Jika user konfirmasi "ya" dan data lengkap:
  {
    "message": "Baik! Saya akan memproses pemesanan ruangan Nusanipa Meeting Room untuk rapat internal besok pukul 11:00 dengan 10 peserta. PIC akan menggunakan akun Anda. Apakah Anda ingin melanjutkan?",
    "action": "complete",
    "bookingData": { ... data lengkap ... },
    "quickActions": [
      {"label": "Ya, Lanjutkan Pemesanan", "action": "confirm_booking", "type": "primary"},
      {"label": "Ubah Detail", "action": "modify_booking", "type": "secondary"}
    ]
  }

CONTOH RESPONS DATA LENGKAP (tanpa konfirmasi):
- Jika data sudah lengkap (>80%) tapi belum ada konfirmasi:
  {
    "message": "Sempurna! Saya sudah mendapat semua informasi yang diperlukan: Ruangan Nusanipa Meeting Room, topik rapat aplikasi, 10 peserta, besok pukul 14:00, jenis internal. PIC akan otomatis menggunakan akun Anda. Apakah informasi ini sudah benar?",
    "action": "complete",
    "bookingData": { ... data lengkap ... },
    "quickActions": [
      {"label": "Ya, Benar", "action": "confirm_booking", "type": "primary"},
      {"label": "Ubah Detail", "action": "modify_booking", "type": "secondary"}
    ]
  }

CONTOH RESPONS DATA LENGKAP DENGAN KONFIRMASI:
- Jika data gabungan sudah lengkap (${completenessPercentage.toFixed(0)}% >= 80%):
  {
    "message": "Sempurna! Saya sudah mendapat semua informasi yang diperlukan: Ruangan ${mergedData.roomName || 'belum ditentukan'}, topik ${mergedData.topic || 'belum ditentukan'}, ${mergedData.participants || 'belum ditentukan'} peserta, tanggal ${mergedData.date || 'belum ditentukan'}, waktu ${mergedData.time || 'belum ditentukan'}, jenis ${mergedData.meetingType || 'belum ditentukan'}. PIC akan otomatis menggunakan akun Anda. Apakah informasi ini sudah benar?",
    "action": "complete",
    "bookingData": mergedData,
    "quickActions": [
      {"label": "Ya, Benar", "action": "confirm_booking", "type": "primary"},
      {"label": "Ubah Detail", "action": "modify_booking", "type": "secondary"}
    ]
  }

CONTOH RESPONS DATA BELUM LENGKAP:
- Jika data gabungan belum lengkap (${completenessPercentage.toFixed(0)}% < 80%):
  {
    "message": "Baik, saya catat informasi yang Anda berikan. Untuk melengkapi pemesanan, saya masih perlu: ${criticalFields.filter(field => !mergedData[field as keyof Booking] || mergedData[field as keyof Booking] === '').join(', ')}.",
    "action": "continue",
    "bookingData": mergedData,
    "quickActions": []
  }

Jawab sekarang:`;
  }

  // Call Gemini API with retry logic
  private async callGeminiAPI(prompt: string, retryCount: number = 0): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not available');
    }

    // Check if API key is placeholder
    if (this.apiKey.includes('your-gemini-api-key-here') || this.apiKey.includes('your_production_api_key')) {
      throw new Error('Gemini API key is not properly configured. Please set a valid API key.');
    }

    const apiUrl = `${geminiConfig.getFullApiUrl()}?key=${this.apiKey}`;
    
    console.log('🔑 Gemini API Request:', {
      url: apiUrl.replace(this.apiKey, '***HIDDEN***'),
      keyLength: this.apiKey.length,
      keyPrefix: this.apiKey.substring(0, 10) + '...'
    });
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });

        // Handle 429 (rate limit) with retry
        if (response.status === 429 && retryCount < 2) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
          console.warn(`⚠️ Rate limit hit, retrying in ${delay}ms (attempt ${retryCount + 1}/3)`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.callGeminiAPI(prompt, retryCount + 1);
        }
        
        // Handle 400 (Bad Request) - usually API key or request format issue
        if (response.status === 400) {
          throw new Error(`Gemini API Bad Request (400): ${errorText}. Check API key and request format.`);
        }
        
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Gemini API Response received successfully');
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      // Handle network errors with retry
      if (retryCount < 2 && error instanceof Error && !error.message.includes('429') && !error.message.includes('400')) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.warn(`⚠️ Network error, retrying in ${delay}ms (attempt ${retryCount + 1}/3)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.callGeminiAPI(prompt, retryCount + 1);
      }
      
      throw error;
    }
  }

  // Process Gemini response
  private processGeminiResponse(geminiResponse: string, userInput: string, analysis: any): RBAResponse {
    try {
      // Extract JSON from response
      const jsonMatch = geminiResponse.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : geminiResponse;
      
      const parsed = JSON.parse(jsonStr);
      
      // Clean and validate booking data
      const cleanedBookingData = this.cleanBookingData(parsed.bookingData || {});
      
      // Update context with cleaned data (merge with existing data)
      if (cleanedBookingData && Object.keys(cleanedBookingData).length > 0) {
        this.context.currentBooking = { ...this.context.currentBooking, ...cleanedBookingData };
        console.log('🔍 RBA - Updated context with new data:', {
          previous: this.context.currentBooking,
          new: cleanedBookingData,
          merged: this.context.currentBooking
        });
      }

      return {
        message: parsed.message || "Maaf, saya tidak dapat memproses permintaan Anda.",
        action: parsed.action || 'continue',
        bookingData: cleanedBookingData,
        quickActions: parsed.quickActions || [],
        suggestions: parsed.suggestions || [],
        recommendations: parsed.recommendations,
        notifications: parsed.notifications || []
      };
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      return {
        message: "Maaf, terjadi kesalahan dalam memproses respons. Silakan coba lagi dengan kata-kata yang lebih jelas.",
        action: 'error',
        suggestions: ['Mulai pemesanan baru', 'Lihat ruangan tersedia', 'Bantuan']
      };
    }
  }

  // Clean booking data
  private cleanBookingData(data: Partial<Booking>): Partial<Booking> {
    const cleaned: Partial<Booking> = {};
    
    console.log('🔍 RBA - Cleaning booking data:', data);
    
    // Clean each field
    cleaned.roomName = this.cleanStringField(data.roomName, '');
    cleaned.topic = this.cleanStringField(data.topic, '');
    
    // Always ensure PIC is set from current user (don't clean it)
    const userDataStr = localStorage.getItem('user_data');
    const userData = userDataStr ? JSON.parse(userDataStr) : null;
    const currentUsername = userData?.username || userData?.full_name || 'User';
    cleaned.pic = currentUsername;
    
    cleaned.participants = this.cleanStringField(data.participants, '') as any;
    cleaned.date = this.cleanStringField(data.date, '');
    cleaned.time = this.cleanStringField(data.time, '');
    cleaned.endTime = this.cleanStringField(data.endTime, '');
    cleaned.meetingType = this.cleanStringField(data.meetingType, '') as 'internal' | 'external';
    
    console.log('🔍 RBA - Cleaned date:', cleaned.date);
    console.log('🔍 RBA - Cleaned time:', cleaned.time);
    console.log('🔍 RBA - Cleaned endTime:', cleaned.endTime);
    console.log('🔍 RBA - Cleaned meetingType:', cleaned.meetingType);
    
    cleaned.roomId = data.roomId || 1;
    cleaned.facilities = data.facilities || [];
    
    // Only calculate end time if not provided by user
    // Don't override user's end time input
    if (!cleaned.endTime && cleaned.time) {
      // Only set default if user hasn't specified end time
      console.log('🔍 RBA - No end time provided by user, using default calculation');
      const [hours, minutes] = cleaned.time.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        const endHours = hours + 1; // Default 1 hour duration
        cleaned.endTime = endHours >= 24 ? '23:59' : `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    } else if (cleaned.endTime) {
      console.log('🔍 RBA - Using user-provided end time:', cleaned.endTime);
    }
    
    return cleaned;
  }

  // Clean string field
  private cleanStringField(value: any, fallback: string): string {
    if (value === null || value === undefined || value === '') {
      return fallback;
    }
    
    if (value === 'NaN' || value === 'undefined') {
      return fallback;
    }
    
    return String(value).trim();
  }

  // Update booking context
  private updateBookingContext(newData: Partial<Booking>): void {
    const filteredData: Partial<Booking> = {};
    
    Object.keys(newData).forEach(key => {
      const value = newData[key as keyof Booking];
      if (value !== null && value !== undefined && value !== '') {
        (filteredData as any)[key] = value;
      }
    });
    
    // Always ensure PIC is set from current user
    const userDataStr = localStorage.getItem('user_data');
    const userData = userDataStr ? JSON.parse(userDataStr) : null;
    const currentUsername = userData?.username || userData?.full_name || 'User';
    filteredData.pic = currentUsername;
    
    this.context.currentBooking = { ...this.context.currentBooking, ...filteredData };
  }

  // Generate quota exceeded response
  private generateQuotaExceededResponse(analysis: any): RBAResponse {
    const { extractedData, missingFields } = analysis;
    
    let message = "⚠️ Maaf, kuota Gemini API telah habis. Namun saya tetap bisa membantu Anda booking ruang meeting! ";
    
    if (extractedData.roomName) {
      message += `Ruangan: ${extractedData.roomName}. `;
    }
    if (extractedData.date) {
      message += `Tanggal: ${extractedData.date}. `;
    }
    if (extractedData.time) {
      message += `Waktu: ${extractedData.time}. `;
    }
    
    if (missingFields.length > 0) {
      message += `Masih perlu informasi: ${missingFields.join(', ')}.`;
    } else {
      message += "Data sudah lengkap! Apakah Anda ingin melanjutkan booking?";
    }

    return {
      message,
      action: 'continue',
      bookingData: extractedData,
      quickActions: [
        { label: 'Ya, Lanjutkan', action: 'confirm_booking', type: 'primary' },
        { label: 'Ubah Data', action: 'modify_data', type: 'secondary' }
      ],
      isQuotaExceeded: true
    };
  }

  // Generate fallback response
  private generateFallbackResponse(analysis: any): RBAResponse {
    const { extractedData, missingFields } = analysis;
    
    let message = "Baik! Saya akan membantu Anda booking ruang meeting. ";
    
    if (extractedData.roomName) {
      message += `Ruangan: ${extractedData.roomName}. `;
    }
    if (extractedData.date) {
      message += `Tanggal: ${extractedData.date}. `;
    }
    if (extractedData.time) {
      message += `Waktu: ${extractedData.time}. `;
    }
    
    if (missingFields.length > 0) {
      message += `Masih perlu informasi: ${missingFields.join(', ')}.`;
    } else {
      message += "Data sudah lengkap! Apakah Anda ingin melanjutkan booking?";
    }

    return {
      message,
      action: 'continue',
      bookingData: extractedData,
      quickActions: [
        { label: 'Ya, Lanjutkan', action: 'confirm_booking', type: 'primary' },
        { label: 'Ubah Data', action: 'modify_data', type: 'secondary' }
      ]
    };
  }

  // Handle quick actions from UI buttons
  public async handleQuickAction(action: string): Promise<RBAResponse> {
    console.log('🎯 RBA handleQuickAction called with:', action);
    
    // Handle meeting type selection
    if (action === 'Internal' || action === 'Eksternal') {
      const meetingType = action === 'Internal' ? 'internal' : 'external';
      
      // Update current booking context with meeting type
      this.updateBookingContext({ meetingType });
      
      console.log('🔍 RBA - Updated meeting type to:', meetingType);
      console.log('🔍 RBA - Current booking context:', this.context.currentBooking);
      
      // Check if we have all required data now
      const currentBooking = this.context.currentBooking;
      const hasAllData = currentBooking.roomName && 
                        currentBooking.topic && 
                        currentBooking.date && 
                        currentBooking.time && 
                        currentBooking.meetingType;
      
      if (hasAllData) {
        // All data is complete, proceed to confirmation
        const message = `Sempurna! Saya sudah mendapat semua informasi yang diperlukan:\n\n` +
          `🏢 **Ruangan**: ${currentBooking.roomName}\n` +
          `📝 **Topik**: ${currentBooking.topic}\n` +
          `👥 **Peserta**: ${currentBooking.participants || 'Belum ditentukan'}\n` +
          `📅 **Tanggal**: ${currentBooking.date}\n` +
          `⏰ **Waktu**: ${currentBooking.time}\n` +
          `🏛️ **Jenis**: ${currentBooking.meetingType === 'internal' ? 'Internal' : 'Eksternal'}\n\n` +
          `PIC akan otomatis menggunakan akun Anda. Apakah informasi ini sudah benar?`;
        
        return {
          message,
          action: 'complete',
          bookingData: currentBooking,
          quickActions: [
            { label: 'Ya, Benar', action: 'confirm_booking', type: 'primary' },
            { label: 'Ubah Detail', action: 'modify_booking', type: 'secondary' }
          ]
        };
      } else {
        // Still missing some data, ask for the missing fields
        const missingFields = [];
        if (!currentBooking.roomName) missingFields.push('ruangan');
        if (!currentBooking.topic) missingFields.push('topik rapat');
        if (!currentBooking.participants) missingFields.push('jumlah peserta');
        if (!currentBooking.date) missingFields.push('tanggal');
        if (!currentBooking.time) missingFields.push('waktu');
        
        const message = `Baik, jenis rapat sudah ditetapkan sebagai ${action}. ` +
          `Sekarang saya masih perlu informasi berikut: ${missingFields.join(', ')}.`;
        
        return {
          message,
          action: 'continue',
          bookingData: currentBooking,
          quickActions: []
        };
      }
    }
    
    // Handle other quick actions
    if (action === 'Ya, Benar' || action === 'Ya, Lanjutkan Pemesanan') {
      return {
        message: 'Baik! Saya akan memproses pemesanan Anda sekarang.',
        action: 'complete',
        bookingData: this.context.currentBooking,
        quickActions: [
          { label: 'Konfirmasi Booking', action: 'final_confirm', type: 'primary' }
        ]
      };
    }
    
    if (action === 'Ubah Detail' || action === 'Ubah Data') {
      return {
        message: 'Baik, silakan beri tahu saya informasi yang ingin diubah.',
        action: 'clarify',
        bookingData: this.context.currentBooking,
        quickActions: []
      };
    }
    
    // Default: treat as regular input
    return await this.processInput(action);
  }

  // Generate general response
  private generateGeneralResponse(userInput: string): RBAResponse {
    const responses = [
      "Halo! Saya Asisten AI Spacio. Saya siap membantu Anda memesan ruang meeting. Silakan beri tahu saya kebutuhan Anda!",
      "Selamat datang di Spacio! Saya bisa membantu Anda booking ruang rapat. Apa yang bisa saya bantu?",
      "Hi! Saya AI Assistant untuk pemesanan ruang meeting. Bagaimana saya bisa membantu Anda hari ini?"
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    return {
      message: randomResponse,
      action: 'greeting',
      quickActions: [
        { label: 'Pesan Ruang', action: 'start_booking', type: 'primary' },
        { label: 'Lihat Ruangan', action: 'view_rooms', type: 'secondary' }
      ]
    };
  }

  // Handle error
  private handleError(error: any): RBAResponse {
    console.error('❌ Error in RBA:', error);
    
    return {
      message: "Maaf, terjadi kesalahan teknis. Silakan coba lagi atau hubungi administrator.",
      action: 'error',
      quickActions: [
        { label: 'Coba Lagi', action: 'retry', type: 'primary' },
        { label: 'Bantuan', action: 'help', type: 'secondary' }
      ]
    };
  }

  // Helper methods
  private isGreeting(input: string): boolean {
    const greetings = ['halo', 'hai', 'hi', 'hello', 'selamat pagi', 'selamat siang', 'selamat sore'];
    return greetings.some(greeting => input.toLowerCase().includes(greeting));
  }

  private hasBookingKeywords(input: string): boolean {
    const keywords = ['pesan', 'booking', 'reservasi', 'ruang', 'meeting', 'rapat'];
    return keywords.some(keyword => input.toLowerCase().includes(keyword));
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private addToHistory(role: 'user' | 'assistant', content: string): void {
    this.context.conversationHistory.push({
      role,
      content: content.trim(),
      timestamp: new Date()
    });

    // Keep only last 10 messages
    if (this.context.conversationHistory.length > 10) {
      this.context.conversationHistory = this.context.conversationHistory.slice(-10);
    }
  }

  // Save booking to database
  public async saveBookingToDatabase(bookingData: Partial<Booking>): Promise<any> {
    try {
      console.log('💾 Saving booking to database:', bookingData);
      
      // Get current user data from localStorage
      const userDataStr = localStorage.getItem('user_data');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      const userId = userData?.id || 1; // Fallback to user ID 1
      
      console.log('🔍 User data for booking:', { userData, userId });
      
      // Validate required fields
      if (!bookingData.roomName || !bookingData.topic || !bookingData.date || !bookingData.time) {
        throw new Error('Missing required booking data: roomName, topic, date, or time');
      }

      // Get correct room_id from room_name
      const roomId = this.getRoomIdFromName(bookingData.roomName);
      
      const payload = {
        action: 'create_ai_success',
        booking_data: {
          user_id: userId,
          session_id: this.context.sessionId,
          room_id: roomId,
          room_name: bookingData.roomName || '',
          topic: bookingData.topic || '',
          meeting_date: bookingData.date || '',
          meeting_time: bookingData.time || '09:00',
          end_time: bookingData.endTime || null,
          duration: this.calculateDuration(bookingData.time, bookingData.endTime),
          participants: bookingData.participants || 0,
          pic: bookingData.pic || '-',
          meeting_type: bookingData.meetingType || 'internal',
          booking_state: 'BOOKED'
        }
      };
      
      console.log('🔍 Payload being sent:', payload);
      
      const response = await fetch('/api/bookings.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response headers:', response.headers);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('🔍 Response result:', result);
      
      if (result.success) {
        console.log('✅ Booking saved successfully:', result);
        return result;
      } else {
        console.error('❌ Failed to save booking:', result);
        throw new Error(result.message || 'Failed to save booking');
      }
    } catch (error) {
      console.error('❌ Error saving booking to database:', error);
      throw error;
    }
  }

  // Calculate duration between start and end time
  private calculateDuration(startTime: string, endTime: string): number {
    if (!startTime || !endTime) return 2; // Default 2 hours
    
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    
    return diffHours > 0 ? diffHours : 2;
  }

  // Get room_id from room_name
  private getRoomIdFromName(roomName: string): number {
    const roomMapping: { [key: string]: number } = {
      'Samudrantha Meeting Room': 1,
      'Nusantara Conference Room': 2,
      'Garuda Discussion Room': 3,
      'Komodo Meeting Room': 4,
      'Borobudur Conference': 5,
      'Cedaya Meeting Room': 11,
      'Celebes Meeting Room': 12,
      'Kalamanthana Meeting Room': 13,
      'Nusanipa Meeting Room': 14,
      'Balidwipa Meeting Room': 15,
      'Swarnadwipa Meeting Room': 16,
      'Auditorium Jawadwipa 1': 17,
      'Ruang Rapat': 18,
      'Ruang Merdeka': 21,
      'Ruang Negara': 22,
      'Ruang Nasionalis': 23
    };
    
    const roomId = roomMapping[roomName] || 1; // Default to Samudrantha if not found
    console.log('🔍 RBA - Room mapping:', { roomName, roomId });
    return roomId;
  }

  // Public methods
  public getCurrentBooking(): Partial<Booking> {
    return this.context.currentBooking;
  }

  public resetContext(): void {
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

// Default export
export default RoomBookingAssistant;
