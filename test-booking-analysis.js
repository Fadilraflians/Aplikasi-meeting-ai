// Test booking analysis dengan input user
const userInput = "Booking ruang meeting besok jam 10:00 untuk presentasi client untuk 10 orang PIC Fadil";

console.log('🔍 Testing booking analysis...');
console.log('📝 User Input:', userInput);

// Simulate the analysis logic
const lower = userInput.toLowerCase();
const extracted = {};

// Extract PIC
const picPatterns = [
  /pic[:\s-]*([a-zA-Z\s]+)/i,
  /penanggung jawab[:\s-]*([a-zA-Z\s]+)/i,
  /atas nama[:\s-]*([a-zA-Z\s]+)/i,
  /pic-nya\s+([a-zA-Z\s]+)/i,
  /picnya\s+([a-zA-Z\s]+)/i,
  /pic\s+([a-zA-Z\s]+)/i
];

for (const pattern of picPatterns) {
  const match = userInput.match(pattern);
  if (match && match[1]) {
    const pic = match[1].trim();
    if (pic.length > 1) {
      extracted.pic = pic;
      break;
    }
  }
}

// Extract topic
const topicPatterns = [
  /untuk\s+([^,]+?)(?:\s+pic|\s+\d+\s+orang|\s+tanggal|\s+jam|\s+internal|\s+eksternal|$)/i,
  /topik[:\s-]*([^,]+?)(?:\s+pic|\s+\d+\s+orang|\s+tanggal|\s+jam|\s+internal|\s+eksternal|$)/i,
  /rapat[:\s-]*([^,]+?)(?:\s+pic|\s+\d+\s+orang|\s+tanggal|\s+jam|\s+internal|\s+eksternal|$)/i,
  /topiknya\s+([^,]+?)(?:\s+pic|\s+\d+\s+orang|\s+tanggal|\s+jam|\s+internal|\s+eksternal|$)/i
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

// Extract participants
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

// Extract date
if (lower.includes('besok')) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  extracted.date = tomorrow.toISOString().split('T')[0];
}

// Extract time
const timePatterns = [
  /(\d{1,2}):(\d{2})\s*(?:pagi|siang|sore|malam)?/i,
  /(\d{1,2})\s*(?:pagi|siang|sore|malam)/i,
  /jam\s+(\d{1,2})(?::(\d{2}))?\s*(?:pagi|siang|sore|malam)?/i
];

for (const pattern of timePatterns) {
  const match = userInput.match(pattern);
  if (match) {
    let hour = parseInt(match[1]);
    const minute = match[2] ? parseInt(match[2]) : 0;
    extracted.time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    break;
  }
}

// Extract meeting type
if (lower.includes('internal')) {
  extracted.meetingType = 'internal';
} else if (lower.includes('eksternal')) {
  extracted.meetingType = 'external';
}

// Check required fields
const requiredFields = ['roomName', 'topic', 'pic', 'participants', 'date', 'time', 'meetingType'];
const extractedFields = requiredFields.filter(field => extracted[field]);
const confidence = extractedFields.length / requiredFields.length;

console.log('\n📊 Analysis Results:');
console.log('✅ Extracted Data:', extracted);
console.log('📈 Confidence:', confidence);
console.log('📋 Extracted Fields:', extractedFields);
console.log('❌ Missing Fields:', requiredFields.filter(field => !extracted[field]));

if (confidence >= 0.8) {
  console.log('\n🎯 RESULT: Should directly confirm booking!');
} else {
  console.log('\n❌ RESULT: Should ask for missing information');
}



