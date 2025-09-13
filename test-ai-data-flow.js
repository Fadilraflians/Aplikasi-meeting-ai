// Test AI data flow dengan input user yang sama
const userInput = "Booking ruang meeting besok jam 10:00 untuk presentasi client untuk 10 orang PIC Fadil";

console.log('🔍 Testing AI data flow dengan input:', userInput);

// Simulate the data yang seharusnya dari analyzeBookingInput
const extractedData = {
  roomName: 'Ruang Meeting (Belum Dipilih)',
  topic: 'presentasi client untuk',
  pic: 'Fadil',
  participants: 10,
  date: '2025-09-12',
  time: '10:00',
  meetingType: 'external',
  roomNotFound: true
};

console.log('📊 Extracted data:', extractedData);

// Simulate currentBooking context (empty initially)
const currentBooking = {};

// Simulate updateBookingContext
const combinedData = { ...currentBooking, ...extractedData };
console.log('📊 Combined data:', combinedData);

// Simulate finalBookingData yang dibuat di handleBookingConfirmationYes
const finalBookingData = {
  id: 'AI-123',
  roomName: combinedData.roomName || 'Belum dipilih',
  roomId: 1,
  topic: combinedData.topic || 'Belum ditentukan',
  date: combinedData.date || 'Belum ditentukan',
  time: combinedData.time || 'Belum ditentukan',
  endTime: combinedData.endTime || '',
  participants: combinedData.participants || 1,
  pic: combinedData.pic || 'Belum ditentukan',
  meetingType: combinedData.meetingType || 'internal',
  facilities: combinedData.facilities || [],
  foodOrder: combinedData.foodOrder || 'tidak',
  imageUrl: combinedData.imageUrl || '',
  urgency: combinedData.urgency || 'normal',
  duration: combinedData.duration || 60,
  notes: combinedData.notes || ''
};

console.log('\n📊 Final booking data:', finalBookingData);

// Check what will be displayed
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



