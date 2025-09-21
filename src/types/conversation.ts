// Types for AI conversation storage in MongoDB
export interface ConversationMessage {
  id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    bookingData?: any;
    confidence?: number;
    extractedFields?: string[];
    missingFields?: string[];
  };
}

export interface Conversation {
  _id?: string;
  sessionId: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  messages: ConversationMessage[];
  status: 'active' | 'completed' | 'cancelled';
  bookingStatus?: 'none' | 'in_progress' | 'completed' | 'cancelled';
  extractedBookingData?: {
    roomName?: string;
    topic?: string;
    pic?: string;
    participants?: number;
    date?: string;
    time?: string;
    meetingType?: string;
    confidence?: number;
    completeness?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingExtractionResult {
  conversationId: string;
  extractedData: any;
  confidence: number;
  completeness: number;
  missingFields: string[];
  recommendations?: string[];
}





