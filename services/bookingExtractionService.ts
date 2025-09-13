import { ConversationService } from './conversationService';
import { BookingExtractionResult } from '../src/types/conversation';

export class BookingExtractionService {
  private conversationService: ConversationService;

  constructor() {
    this.conversationService = new ConversationService();
  }

  // Ambil data booking dari percakapan yang sudah disimpan
  async extractBookingFromConversation(sessionId: string): Promise<BookingExtractionResult> {
    try {
      console.log('🔍 Extracting booking data from conversation:', sessionId);
      
      const result = await this.conversationService.extractBookingDataFromConversation(sessionId);
      
      console.log('✅ Booking data extracted:', result);
      return result;
    } catch (error) {
      console.error('❌ Error extracting booking data:', error);
      throw error;
    }
  }

  // Ambil semua percakapan dengan data booking lengkap
  async getAllCompletedBookings(): Promise<any[]> {
    try {
      console.log('🔍 Getting all completed booking conversations');
      
      const conversations = await this.conversationService.getCompletedBookingConversations();
      
      console.log('✅ Found completed booking conversations:', conversations.length);
      return conversations;
    } catch (error) {
      console.error('❌ Error getting completed bookings:', error);
      throw error;
    }
  }

  // Ambil statistik percakapan
  async getConversationStats(): Promise<any> {
    try {
      console.log('🔍 Getting conversation statistics');
      
      const stats = await this.conversationService.getConversationStats();
      
      console.log('✅ Conversation stats:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error getting conversation stats:', error);
      throw error;
    }
  }

  // Analisis percakapan untuk mendapatkan insight
  async analyzeConversationPatterns(): Promise<any> {
    try {
      console.log('🔍 Analyzing conversation patterns');
      
      const conversations = await this.conversationService.getConversationsByBookingStatus('completed');
      
      const analysis = {
        totalConversations: conversations.length,
        averageMessagesPerConversation: 0,
        mostCommonTopics: [],
        mostCommonRooms: [],
        averageBookingTime: 0,
        successRate: 0
      };

      if (conversations.length > 0) {
        // Hitung rata-rata pesan per percakapan
        const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
        analysis.averageMessagesPerConversation = totalMessages / conversations.length;

        // Analisis topik yang paling umum
        const topics = conversations
          .map(conv => conv.extractedBookingData?.topic)
          .filter(topic => topic)
          .reduce((acc: any, topic) => {
            acc[topic] = (acc[topic] || 0) + 1;
            return acc;
          }, {});

        analysis.mostCommonTopics = Object.entries(topics)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 5)
          .map(([topic, count]) => ({ topic, count }));

        // Analisis ruangan yang paling umum
        const rooms = conversations
          .map(conv => conv.extractedBookingData?.roomName)
          .filter(room => room)
          .reduce((acc: any, room) => {
            acc[room] = (acc[room] || 0) + 1;
            return acc;
          }, {});

        analysis.mostCommonRooms = Object.entries(rooms)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 5)
          .map(([room, count]) => ({ room, count }));

        // Hitung rata-rata waktu booking (dari start ke end)
        const bookingTimes = conversations
          .map(conv => {
            if (conv.startTime && conv.endTime) {
              return conv.endTime.getTime() - conv.startTime.getTime();
            }
            return 0;
          })
          .filter(time => time > 0);

        if (bookingTimes.length > 0) {
          analysis.averageBookingTime = bookingTimes.reduce((sum, time) => sum + time, 0) / bookingTimes.length;
        }

        // Hitung success rate
        const successfulBookings = conversations.filter(conv => conv.bookingStatus === 'completed').length;
        analysis.successRate = (successfulBookings / conversations.length) * 100;
      }

      console.log('✅ Conversation analysis completed:', analysis);
      return analysis;
    } catch (error) {
      console.error('❌ Error analyzing conversation patterns:', error);
      throw error;
    }
  }

  // Generate laporan booking dari percakapan
  async generateBookingReport(sessionId?: string): Promise<any> {
    try {
      console.log('🔍 Generating booking report for session:', sessionId || 'all');

      let conversations;
      if (sessionId) {
        const conversation = await this.conversationService.getConversation(sessionId);
        conversations = conversation ? [conversation] : [];
      } else {
        conversations = await this.conversationService.getCompletedBookingConversations();
      }

      const report = {
        totalConversations: conversations.length,
        completedBookings: conversations.filter(conv => conv.bookingStatus === 'completed').length,
        inProgressBookings: conversations.filter(conv => conv.bookingStatus === 'in_progress').length,
        cancelledBookings: conversations.filter(conv => conv.bookingStatus === 'cancelled').length,
        conversations: conversations.map(conv => ({
          sessionId: conv.sessionId,
          userId: conv.userId,
          startTime: conv.startTime,
          endTime: conv.endTime,
          messageCount: conv.messages.length,
          bookingStatus: conv.bookingStatus,
          extractedData: conv.extractedBookingData,
          duration: conv.endTime ? conv.endTime.getTime() - conv.startTime.getTime() : null
        }))
      };

      console.log('✅ Booking report generated:', report);
      return report;
    } catch (error) {
      console.error('❌ Error generating booking report:', error);
      throw error;
    }
  }

  // Cari percakapan berdasarkan kriteria tertentu
  async searchConversations(criteria: {
    userId?: string;
    bookingStatus?: string;
    dateFrom?: Date;
    dateTo?: Date;
    topic?: string;
    roomName?: string;
  }): Promise<any[]> {
    try {
      console.log('🔍 Searching conversations with criteria:', criteria);

      // Get all conversations first
      const allConversations = await this.conversationService.getConversationsByBookingStatus(
        criteria.bookingStatus || 'completed'
      );

      // Filter based on criteria
      let filteredConversations = allConversations;

      if (criteria.userId) {
        filteredConversations = filteredConversations.filter(conv => conv.userId === criteria.userId);
      }

      if (criteria.dateFrom) {
        filteredConversations = filteredConversations.filter(conv => 
          conv.startTime >= criteria.dateFrom!
        );
      }

      if (criteria.dateTo) {
        filteredConversations = filteredConversations.filter(conv => 
          conv.startTime <= criteria.dateTo!
        );
      }

      if (criteria.topic) {
        filteredConversations = filteredConversations.filter(conv => 
          conv.extractedBookingData?.topic?.toLowerCase().includes(criteria.topic!.toLowerCase())
        );
      }

      if (criteria.roomName) {
        filteredConversations = filteredConversations.filter(conv => 
          conv.extractedBookingData?.roomName?.toLowerCase().includes(criteria.roomName!.toLowerCase())
        );
      }

      console.log('✅ Found conversations:', filteredConversations.length);
      return filteredConversations;
    } catch (error) {
      console.error('❌ Error searching conversations:', error);
      throw error;
    }
  }
}


