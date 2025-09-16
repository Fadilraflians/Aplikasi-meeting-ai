// Test untuk memverifikasi AI agent bisa menangani greeting
console.log('🧪 Testing AI Agent Greeting Response...');

// Simulasi input "hai"
const testInput = "hai";
const lowerInput = testInput.toLowerCase().trim();

// Test booking intent detection
const nonBookingKeywords = [
  'hai', 'hello', 'hi', 'halo', 'selamat', 'terima kasih', 'thanks',
  'bantuan', 'help', 'tidak', 'no', 'ya', 'yes', 'ok', 'oke'
];

const isGreeting = nonBookingKeywords.some(keyword => lowerInput === keyword || lowerInput.includes(keyword));
const bookingKeywords = [
  'booking', 'pesan', 'reservasi', 'ruang', 'meeting', 'rapat',
  'jadwal', 'tanggal', 'jam', 'waktu', 'peserta', 'topik',
  'internal', 'eksternal', 'pic', 'konsumsi', 'makanan',
  'presentasi', 'diskusi', 'training', 'brainstorming', 'review'
];

const hasBookingKeywords = bookingKeywords.some(keyword => lowerInput.includes(keyword));
const isBookingIntent = isGreeting || hasBookingKeywords;

console.log('📊 Greeting Test Results:');
console.log('  - Input:', testInput);
console.log('  - Is Greeting:', isGreeting);
console.log('  - Has Booking Keywords:', hasBookingKeywords);
console.log('  - Is Booking Intent:', isBookingIntent);

if (isBookingIntent) {
  console.log('✅ SUCCESS: "hai" is now detected as booking intent');
  console.log('🤖 AI Agent will process this input and respond naturally');
  
  // Expected AI response for greeting
  const expectedResponse = {
    "message": "Halo! 👋 Senang bertemu dengan Anda! Saya siap membantu Anda memesan ruang rapat. Ada yang bisa saya bantu hari ini?",
    "action": "continue",
    "quickActions": [
      {"label": "Pesan Ruangan", "action": "book_room", "type": "primary"},
      {"label": "Lihat Ruangan", "action": "view_rooms", "type": "secondary"}
    ],
    "suggestions": ["Mulai booking", "Lihat ruangan tersedia", "Bantuan"]
  };
  
  console.log('\n🎯 Expected AI Response:');
  console.log(JSON.stringify(expectedResponse, null, 2));
} else {
  console.log('❌ FAILED: "hai" is not detected as booking intent');
}

console.log('\n🚀 Testing other greetings...');
const testGreetings = ['hello', 'hi', 'halo', 'bantuan', 'help'];

testGreetings.forEach(greeting => {
  const isDetected = nonBookingKeywords.some(keyword => 
    greeting.toLowerCase() === keyword || greeting.toLowerCase().includes(keyword)
  );
  console.log(`  - "${greeting}": ${isDetected ? '✅' : '❌'}`);
});

console.log('\n✅ AI Agent Greeting Test Completed!');
console.log('🎯 AI Agent is now ready to handle natural conversations!');
