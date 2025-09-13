// Test MongoDB integration dengan AI conversation system
const { ConversationService } = require('./services/conversationService');
const { BookingExtractionService } = require('./services/bookingExtractionService');

async function testMongoDBIntegration() {
    console.log('🔍 Testing MongoDB integration with AI conversation system...');
    
    try {
        // Initialize services
        const conversationService = new ConversationService();
        const bookingExtractionService = new BookingExtractionService();
        
        console.log('✅ Services initialized');
        
        // Test 1: Create a new conversation
        console.log('\n📝 Test 1: Creating new conversation...');
        const testSessionId = `test_session_${Date.now()}`;
        const testUserId = 'test_user_123';
        
        const newConversation = {
            sessionId: testSessionId,
            userId: testUserId,
            startTime: new Date(),
            messages: [],
            status: 'active',
            bookingStatus: 'none',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const conversationId = await conversationService.saveConversation(newConversation);
        console.log('✅ Conversation created with ID:', conversationId);
        
        // Test 2: Add messages to conversation
        console.log('\n📝 Test 2: Adding messages to conversation...');
        
        const userMessage = {
            id: `msg_${Date.now()}_1`,
            role: 'user',
            content: 'Booking ruang meeting besok jam 10:00 untuk presentasi client untuk 10 orang PIC Fadil',
            timestamp: new Date(),
            metadata: {
                intent: 'booking',
                bookingData: {
                    roomName: 'Ruang Meeting (Belum Dipilih)',
                    topic: 'presentasi client untuk',
                    pic: 'Fadil',
                    participants: 10,
                    date: '2025-09-12',
                    time: '10:00',
                    meetingType: 'external'
                }
            }
        };
        
        await conversationService.addMessageToConversation(testSessionId, userMessage);
        console.log('✅ User message added');
        
        const aiMessage = {
            id: `msg_${Date.now()}_2`,
            role: 'ai',
            content: 'Baik! Saya sudah mencatat semua detail pemesanan Anda. Apakah Anda setuju dengan detail ini?',
            timestamp: new Date(),
            metadata: {
                intent: 'confirmation',
                confidence: 1.0,
                extractedFields: ['roomName', 'topic', 'pic', 'participants', 'date', 'time', 'meetingType'],
                missingFields: []
            }
        };
        
        await conversationService.addMessageToConversation(testSessionId, aiMessage);
        console.log('✅ AI message added');
        
        // Test 3: Update booking status
        console.log('\n📝 Test 3: Updating booking status...');
        const bookingData = {
            roomName: 'Ruang Meeting (Belum Dipilih)',
            topic: 'presentasi client untuk',
            pic: 'Fadil',
            participants: 10,
            date: '2025-09-12',
            time: '10:00',
            meetingType: 'external',
            confidence: 1.0,
            completeness: 1.0
        };
        
        await conversationService.updateBookingStatus(testSessionId, bookingData, 'completed');
        console.log('✅ Booking status updated to completed');
        
        // Test 4: Retrieve conversation
        console.log('\n📝 Test 4: Retrieving conversation...');
        const retrievedConversation = await conversationService.getConversation(testSessionId);
        console.log('✅ Conversation retrieved:', {
            sessionId: retrievedConversation.sessionId,
            messageCount: retrievedConversation.messages.length,
            bookingStatus: retrievedConversation.bookingStatus,
            extractedData: retrievedConversation.extractedBookingData
        });
        
        // Test 5: Extract booking data
        console.log('\n📝 Test 5: Extracting booking data...');
        const extractionResult = await bookingExtractionService.extractBookingFromConversation(testSessionId);
        console.log('✅ Booking data extracted:', {
            confidence: extractionResult.confidence,
            completeness: extractionResult.completeness,
            missingFields: extractionResult.missingFields,
            recommendations: extractionResult.recommendations
        });
        
        // Test 6: Get conversation stats
        console.log('\n📝 Test 6: Getting conversation statistics...');
        const stats = await conversationService.getConversationStats();
        console.log('✅ Conversation stats:', stats);
        
        // Test 7: Analyze conversation patterns
        console.log('\n📝 Test 7: Analyzing conversation patterns...');
        const analysis = await bookingExtractionService.analyzeConversationPatterns();
        console.log('✅ Conversation analysis:', analysis);
        
        // Test 8: Generate booking report
        console.log('\n📝 Test 8: Generating booking report...');
        const report = await bookingExtractionService.generateBookingReport(testSessionId);
        console.log('✅ Booking report generated:', {
            totalConversations: report.totalConversations,
            completedBookings: report.completedBookings,
            conversations: report.conversations.length
        });
        
        console.log('\n🎉 All MongoDB integration tests passed successfully!');
        
    } catch (error) {
        console.error('❌ MongoDB integration test failed:', error);
    }
}

// Run the test
testMongoDBIntegration();



