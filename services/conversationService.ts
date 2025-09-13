import { Conversation, ConversationMessage, BookingExtractionResult } from '../src/types/conversation';

export class ConversationService {
  private apiUrl: string;

  constructor() {
    // Use Vite proxy for development, fallback to direct URL
    this.apiUrl = '/api/api.php';
  }

  // Simpan percakapan baru
  async saveConversation(conversation: Conversation): Promise<string> {
    try {
      const response = await fetch(`${this.apiUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(conversation),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Conversation saved via API:', result.id);
      return result.id;
    } catch (error) {
      console.error('❌ Error saving conversation:', error);
      throw error;
    }
  }

  // Update percakapan dengan pesan baru
  async addMessageToConversation(sessionId: string, message: ConversationMessage): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}?sessionId=${sessionId}&action=addMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('✅ Message added to conversation via API:', sessionId);
    } catch (error) {
      console.error('❌ Error adding message to conversation:', error);
      throw error;
    }
  }

  // Update status booking dalam percakapan
  async updateBookingStatus(sessionId: string, bookingData: any, status: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}?sessionId=${sessionId}&action=updateBooking`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingData, status }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('✅ Booking status updated via API:', sessionId, status);
    } catch (error) {
      console.error('❌ Error updating booking status:', error);
      throw error;
    }
  }

  // Ambil percakapan berdasarkan session ID
  async getConversation(sessionId: string): Promise<Conversation | null> {
    try {
      const response = await fetch(`${this.apiUrl}?sessionId=${sessionId}`);
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const conversation = await response.json();
      return conversation;
    } catch (error) {
      console.error('❌ Error getting conversation:', error);
      throw error;
    }
  }

  // Ambil semua percakapan dengan status booking tertentu
  async getConversationsByBookingStatus(status: string): Promise<Conversation[]> {
    try {
      const response = await fetch(`${this.apiUrl}?bookingStatus=${status}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const conversations = await response.json();
      return conversations;
    } catch (error) {
      console.error('❌ Error getting conversations by booking status:', error);
      throw error;
    }
  }

  // Ambil percakapan yang memiliki data booking lengkap
  async getCompletedBookingConversations(): Promise<Conversation[]> {
    try {
      const response = await fetch(`${this.apiUrl}?bookingStatus=completed&completeness=0.8`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const conversations = await response.json();
      return conversations;
    } catch (error) {
      console.error('❌ Error getting completed booking conversations:', error);
      throw error;
    }
  }

  // Ekstrak data booking dari percakapan
  async extractBookingDataFromConversation(sessionId: string): Promise<BookingExtractionResult> {
    try {
      const conversation = await this.getConversation(sessionId);
      
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Analisis semua pesan untuk ekstrak data booking
      const extractedData = this.analyzeConversationForBooking(conversation);
      
      // Hitung confidence dan completeness
      const confidence = this.calculateConfidence(extractedData);
      const completeness = this.calculateCompleteness(extractedData);
      const missingFields = this.getMissingFields(extractedData);

      const result: BookingExtractionResult = {
        conversationId: sessionId,
        extractedData,
        confidence,
        completeness,
        missingFields,
        recommendations: this.generateRecommendations(extractedData, missingFields)
      };

      return result;
    } catch (error) {
      console.error('❌ Error extracting booking data:', error);
      throw error;
    }
  }

  // Analisis percakapan untuk ekstrak data booking
  private analyzeConversationForBooking(conversation: Conversation): any {
    const extractedData: any = {};
    
    // Gabungkan semua pesan user
    const userMessages = conversation.messages
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content)
      .join(' ');

    // Ekstrak data menggunakan regex patterns
    const patterns = {
      roomName: /(?:ruang|room|meeting room)\s+([a-zA-Z\s]+)/i,
      topic: /(?:untuk|topik|rapat)\s+([^,]+?)(?:\s+pic|\s+\d+\s+orang|\s+tanggal|\s+jam|$)/i,
      pic: /pic[:\s-]*([a-zA-Z\s]+)/i,
      participants: /(\d+)\s*(?:orang|peserta|people|pax)/i,
      date: /(?:besok|hari ini|lusa|tanggal)/i,
      time: /(\d{1,2}):(\d{2})/i,
      meetingType: /(?:internal|eksternal|client|customer)/i
    };

    // Ekstrak data berdasarkan patterns
    Object.entries(patterns).forEach(([key, pattern]) => {
      const match = userMessages.match(pattern);
      if (match) {
        if (key === 'participants') {
          extractedData[key] = parseInt(match[1]);
        } else if (key === 'date') {
          // Handle date extraction
          if (userMessages.includes('besok')) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            extractedData[key] = tomorrow.toISOString().split('T')[0];
          } else if (userMessages.includes('hari ini')) {
            extractedData[key] = new Date().toISOString().split('T')[0];
          }
        } else if (key === 'time') {
          extractedData[key] = `${match[1].padStart(2, '0')}:${match[2]}`;
        } else if (key === 'meetingType') {
          extractedData[key] = userMessages.includes('client') || userMessages.includes('customer') ? 'external' : 'internal';
        } else {
          extractedData[key] = match[1]?.trim() || match[0];
        }
      }
    });

    return extractedData;
  }

  // Hitung confidence berdasarkan data yang diekstrak
  private calculateConfidence(extractedData: any): number {
    const requiredFields = ['roomName', 'topic', 'pic', 'participants', 'date', 'time', 'meetingType'];
    const extractedFields = requiredFields.filter(field => extractedData[field]);
    return extractedFields.length / requiredFields.length;
  }

  // Hitung completeness berdasarkan data yang diekstrak
  private calculateCompleteness(extractedData: any): number {
    const requiredFields = ['roomName', 'topic', 'pic', 'participants', 'date', 'time', 'meetingType'];
    const extractedFields = requiredFields.filter(field => extractedData[field]);
    return extractedFields.length / requiredFields.length;
  }

  // Dapatkan field yang masih kurang
  private getMissingFields(extractedData: any): string[] {
    const requiredFields = ['roomName', 'topic', 'pic', 'participants', 'date', 'time', 'meetingType'];
    return requiredFields.filter(field => !extractedData[field]);
  }

  // Generate rekomendasi berdasarkan data yang kurang
  private generateRecommendations(extractedData: any, missingFields: string[]): string[] {
    const recommendations: string[] = [];
    
    if (missingFields.includes('roomName')) {
      recommendations.push('Tentukan ruangan yang akan digunakan untuk rapat');
    }
    if (missingFields.includes('topic')) {
      recommendations.push('Berikan topik atau tujuan rapat yang lebih spesifik');
    }
    if (missingFields.includes('pic')) {
      recommendations.push('Tentukan PIC (Penanggung Jawab) untuk rapat ini');
    }
    if (missingFields.includes('participants')) {
      recommendations.push('Tentukan jumlah peserta yang akan hadir');
    }
    if (missingFields.includes('date')) {
      recommendations.push('Tentukan tanggal pelaksanaan rapat');
    }
    if (missingFields.includes('time')) {
      recommendations.push('Tentukan waktu pelaksanaan rapat');
    }
    if (missingFields.includes('meetingType')) {
      recommendations.push('Tentukan jenis rapat (internal/eksternal)');
    }

    return recommendations;
  }

  // Statistik percakapan
  async getConversationStats(): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}?action=stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const stats = await response.json();
      return stats;
    } catch (error) {
      console.error('❌ Error getting conversation stats:', error);
      throw error;
    }
  }
}

