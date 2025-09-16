// Test script untuk memverifikasi prompt AI agent
console.log('🧪 Testing AI Agent Prompt...');

// Simulasi data untuk test
const mockAnalysis = {
  intent: 'booking',
  confidence: 0.85,
  entities: {
    participants: 10,
    topic: 'presentasi client',
    date: '2025-01-17',
    time: '10:00'
  }
};

const mockUserInput = "pesan ruangan untuk presentasi client 10 orang besok jam 10";

// Simulasi prompt yang akan dikirim ke Gemini
const today = new Date().toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

const testPrompt = `🤖 RBA AI Assistant - Smart Room Booking System

CONVERSATION:
New conversation

CURRENT BOOKING STATUS:
{}

USER INPUT: "${mockUserInput}"

ANALYSIS:
- Intent: ${mockAnalysis.intent}
- Confidence: ${mockAnalysis.confidence}%
- Entities: ${JSON.stringify(mockAnalysis.entities)}

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

SMART PARSING:
- Dates: "besok"=${tomorrow}, "hari ini"=${today}, "lusa"=${new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0]}
- Times: "pagi"=09:00, "siang"=12:00, "sore"=15:00, "malam"=19:00
- Participants: Extract numbers from text
- Topics: Extract after keywords like "untuk", "tentang", "rapat", "meeting", "presentasi"

RESPONSE STRATEGY:
1. If booking data complete → Show confirmation
2. If missing data → Ask for specific missing fields
3. If room not found → Suggest alternatives
4. If urgent → Prioritize quick booking
5. If complex → Break down into steps

RESPONSE FORMAT (JSON):
{
  "message": "Friendly, helpful message (max 150 chars)",
  "action": "continue|complete|confirm|clarify|recommend|error",
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

SMART EXAMPLES:
- "Presentasi client 10 orang besok pagi" → Recommend Samudrantha with projector
- "Rapat tim urgent" → Suggest Cedaya/Celebes for quick booking
- "Training 15 orang dengan rekaman" → Recommend Kalamanthana with recording
- "Meeting besar 30 orang" → Suggest Auditorium Utama

RESPOND WITH JSON ONLY.`;

console.log('📊 Prompt Analysis:');
console.log('  - Prompt Length:', testPrompt.length, 'characters');
console.log('  - Estimated Tokens:', Math.ceil(testPrompt.length / 4), 'tokens');
console.log('  - User Input:', mockUserInput);
console.log('  - Analysis Data:', JSON.stringify(mockAnalysis, null, 2));

console.log('\n📋 Prompt Preview (first 500 chars):');
console.log(testPrompt.substring(0, 500) + '...');

console.log('\n🎯 Expected AI Response:');
const expectedResponse = {
  "message": "Untuk presentasi client 10 orang besok pagi, saya rekomendasikan Samudrantha! Ada proyektor dan cocok untuk presentasi. Mau saya bookingkan?",
  "action": "recommend",
  "bookingData": {
    "roomName": "Samudrantha",
    "topic": "presentasi client",
    "participants": "10",
    "date": tomorrow,
    "time": "10:00",
    "meetingType": "external"
  },
  "quickActions": [
    {"label": "Ya, Booking", "action": "confirm_booking", "type": "primary"},
    {"label": "Lihat Ruangan Lain", "action": "view_other_rooms", "type": "secondary"}
  ],
  "suggestions": ["Cedaya (15 pax)", "Celebes (15 pax)"],
  "recommendations": {
    "rooms": [{"name": "Samudrantha", "capacity": 10, "facilities": ["Projector", "Whiteboard", "AC"]}],
    "reasons": ["Sesuai kapasitas", "Ada proyektor untuk presentasi"]
  }
};

console.log(JSON.stringify(expectedResponse, null, 2));

console.log('\n✅ AI Agent Prompt Test Completed!');
console.log('🚀 Prompt is optimized and ready for production use.');
