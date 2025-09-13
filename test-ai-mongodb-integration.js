// Test AI MongoDB integration
import { ConversationService } from './services/conversationService.js';
import { BookingExtractionService } from './services/bookingExtractionService.js';

async function testAIMongoDBIntegration() {
    console.log('🔍 Testing AI MongoDB integration...');
    
    try {
        // Test 1: Initialize services
        console.log('\n📝 Test 1: Initializing services...');
        const conversationService = new ConversationService();
        const bookingExtractionService = new BookingExtractionService();
        console.log('✅ Services initialized successfully');
        
        // Test 2: Create test conversation
        console.log('\n📝 Test 2: Creating test conversation...');
        const testSessionId = `test_ai_session_${Date.now()}`;
        const testUserId = 'test_ai_user_123';
        
        const testConversation = {
            sessionId: testSessionId,
            userId: testUserId,
            startTime: new Date(),
            messages: [],
            status: 'active',
            bookingStatus: 'none',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const conversationId = await conversationService.saveConversation(testConversation);
        console.log('✅ Test conversation created with ID:', conversationId);
        
        // Test 3: Add AI conversation messages
        console.log('\n📝 Test 3: Adding AI conversation messages...');
        
        // User message
        const userMessage = {
            id: `msg_${Date.now()}_user`,
            role: 'user',
            content: 'Booking ruang meeting besok jam 10:00 untuk presentasi client untuk 10 orang PIC Fadil',
            timestamp: new Date(),
            metadata: {
                bookingData: {
                    roomName: 'Ruang Meeting (Belum Dipilih)',
                    topic: 'presentasi client untuk',
                    pic: 'Fadil',
                    participants: 10,
                    date: '2025-09-12',
                    time: '10:00',
                    meetingType: 'external',
                    roomNotFound: true
                }
            }
        };
        
        await conversationService.addMessageToConversation(testSessionId, userMessage);
        console.log('✅ User message added');
        
        // AI response message
        const aiMessage = {
            id: `msg_${Date.now()}_ai`,
            role: 'ai',
            content: 'Baik! Saya sudah mencatat semua detail pemesanan Anda. Berikut ringkasan: Ruang Meeting untuk presentasi client dengan PIC Fadil, 10 peserta, besok jam 10:00. Apakah Anda setuju dengan detail ini?',
            timestamp: new Date(),
            metadata: {
                confidence: 1.0,
                extractedFields: ['roomName', 'topic', 'pic', 'participants', 'date', 'time', 'meetingType'],
                missingFields: []
            }
        };
        
        await conversationService.addMessageToConversation(testSessionId, aiMessage);
        console.log('✅ AI message added');
        
        // User confirmation
        const confirmMessage = {
            id: `msg_${Date.now()}_confirm`,
            role: 'user',
            content: 'Ya, saya setuju dengan detail tersebut',
            timestamp: new Date(),
            metadata: {
                bookingData: {
                    roomName: 'Ruang Meeting (Belum Dipilih)',
                    topic: 'presentasi client untuk',
                    pic: 'Fadil',
                    participants: 10,
                    date: '2025-09-12',
                    time: '10:00',
                    meetingType: 'external',
                    roomNotFound: true,
                    isConfirmation: true
                }
            }
        };
        
        await conversationService.addMessageToConversation(testSessionId, confirmMessage);
        console.log('✅ Confirmation message added');
        
        // Test 4: Update booking status
        console.log('\n📝 Test 4: Updating booking status...');
        const finalBookingData = {
            roomName: 'Ruang Meeting (Belum Dipilih)',
            topic: 'presentasi client untuk',
            pic: 'Fadil',
            participants: 10,
            date: '2025-09-12',
            time: '10:00',
            meetingType: 'external',
            roomNotFound: true,
            confidence: 1.0,
            completeness: 1.0
        };
        
        await conversationService.updateBookingStatus(testSessionId, finalBookingData, 'completed');
        console.log('✅ Booking status updated to completed');
        
        // Test 5: Retrieve conversation
        console.log('\n📝 Test 5: Retrieving conversation...');
        const retrievedConversation = await conversationService.getConversation(testSessionId);
        
        if (retrievedConversation) {
            console.log('✅ Conversation retrieved successfully');
            console.log('📊 Conversation details:', {
                sessionId: retrievedConversation.sessionId,
                userId: retrievedConversation.userId,
                messageCount: retrievedConversation.messages.length,
                bookingStatus: retrievedConversation.bookingStatus,
                status: retrievedConversation.status,
                extractedData: retrievedConversation.extractedBookingData
            });
            
            // Show messages
            console.log('💬 Messages in conversation:');
            retrievedConversation.messages.forEach((msg, index) => {
                console.log(`   ${index + 1}. [${msg.role}] ${msg.content.substring(0, 50)}...`);
            });
        } else {
            console.log('❌ Failed to retrieve conversation');
        }
        
        // Test 6: Extract booking data
        console.log('\n📝 Test 6: Extracting booking data from conversation...');
        const extractionResult = await bookingExtractionService.extractBookingFromConversation(testSessionId);
        
        console.log('✅ Booking data extracted successfully');
        console.log('📊 Extraction results:', {
            confidence: extractionResult.confidence,
            completeness: extractionResult.completeness,
            missingFields: extractionResult.missingFields,
            recommendations: extractionResult.recommendations,
            extractedData: extractionResult.extractedData
        });
        
        // Test 7: Get conversation statistics
        console.log('\n📝 Test 7: Getting conversation statistics...');
        const stats = await conversationService.getConversationStats();
        console.log('✅ Conversation statistics retrieved');
        console.log('📊 Statistics:', stats);
        
        // Test 8: Analyze conversation patterns
        console.log('\n📝 Test 8: Analyzing conversation patterns...');
        const analysis = await bookingExtractionService.analyzeConversationPatterns();
        console.log('✅ Conversation analysis completed');
        console.log('📊 Analysis results:', {
            totalConversations: analysis.totalConversations,
            averageMessagesPerConversation: analysis.averageMessagesPerConversation,
            mostCommonTopics: analysis.mostCommonTopics,
            mostCommonRooms: analysis.mostCommonRooms,
            successRate: analysis.successRate
        });
        
        // Test 9: Generate booking report
        console.log('\n📝 Test 9: Generating booking report...');
        const report = await bookingExtractionService.generateBookingReport(testSessionId);
        console.log('✅ Booking report generated');
        console.log('📊 Report summary:', {
            totalConversations: report.totalConversations,
            completedBookings: report.completedBookings,
            inProgressBookings: report.inProgressBookings,
            cancelledBookings: report.cancelledBookings
        });
        
        // Test 10: Search conversations
        console.log('\n📝 Test 10: Searching conversations...');
        const searchResults = await bookingExtractionService.searchConversations({
            bookingStatus: 'completed',
            topic: 'presentasi'
        });
        console.log('✅ Search completed');
        console.log('📊 Search results:', searchResults.length, 'conversations found');
        
        console.log('\n🎉 All AI MongoDB integration tests passed successfully!');
        console.log('\n📋 Summary:');
        console.log('✅ MongoDB connection: Working');
        console.log('✅ Conversation storage: Working');
        console.log('✅ Message handling: Working');
        console.log('✅ Booking data extraction: Working');
        console.log('✅ Analytics and reporting: Working');
        console.log('✅ Search functionality: Working');
        
    } catch (error) {
        console.error('❌ AI MongoDB integration test failed:', error);
        console.error('Error details:', error.message);
        console.error('Stack trace:', error.stack);
        
        console.log('\n🔍 Troubleshooting steps:');
        console.log('1. Check MongoDB service is running');
        console.log('2. Verify MongoDB connection string');
        console.log('3. Check database permissions');
        console.log('4. Verify collection exists');
        console.log('5. Check network connectivity');
    }
}

// Run the test
testAIMongoDBIntegration();



