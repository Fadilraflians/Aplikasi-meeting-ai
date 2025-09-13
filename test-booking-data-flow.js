// Test booking data flow dari AI ke halaman konfirmasi
console.log('🔍 Testing booking data flow...');

// Simulate the data yang seharusnya dari AI
const simulatedAIData = {
  roomName: 'Ruang Meeting (Belum Dipilih)',
  topic: 'presentasi client untuk',
  pic: 'Fadil',
  participants: 10,
  date: '2025-09-12',
  time: '10:00',
  meetingType: 'external',
  roomNotFound: true
};

console.log('📊 Data dari AI Context:', simulatedAIData);

// Simulate finalBookingData yang dibuat di handleBookingConfirmationYes
const finalBookingData = {
  id: 'AI-123',
  roomName: simulatedAIData.roomName || 'Belum dipilih',
  roomId: 1,
  topic: simulatedAIData.topic || 'Belum ditentukan',
  date: simulatedAIData.date || 'Belum ditentukan',
  time: simulatedAIData.time || 'Belum ditentukan',
  endTime: '',
  participants: simulatedAIData.participants || 1,
  pic: simulatedAIData.pic || 'Belum ditentukan',
  meetingType: simulatedAIData.meetingType || 'internal',
  facilities: [],
  foodOrder: 'tidak',
  imageUrl: '',
  urgency: 'normal',
  duration: 60,
  notes: ''
};

console.log('\n📊 Final Booking Data:', finalBookingData);

// Check what should be displayed
console.log('\n📋 Data yang akan ditampilkan di halaman konfirmasi:');
console.log('✅ Ruang Rapat:', finalBookingData.roomName);
console.log('✅ Topik Rapat:', finalBookingData.topic);
console.log('✅ PIC:', finalBookingData.pic);
console.log('✅ Tanggal:', finalBookingData.date);
console.log('✅ Waktu:', finalBookingData.time);
console.log('✅ Jumlah Peserta:', finalBookingData.participants);
console.log('✅ Jenis Rapat:', finalBookingData.meetingType);

// Check if data is correct
const isDataCorrect = 
  finalBookingData.roomName !== 'Belum dipilih' &&
  finalBookingData.topic !== 'Belum ditentukan' &&
  finalBookingData.pic !== 'Belum ditentukan' &&
  finalBookingData.date !== 'Belum ditentukan' &&
  finalBookingData.time !== 'Belum ditentukan';

console.log('\n🎯 Status Data:');
if (isDataCorrect) {
  console.log('✅ Data sudah benar - akan ditampilkan dengan benar di halaman konfirmasi');
} else {
  console.log('❌ Data masih menggunakan nilai default - perlu diperbaiki');
}



