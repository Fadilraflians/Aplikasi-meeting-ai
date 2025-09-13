/**
 * Test Gemini API Connection
 * Test koneksi AI ke API key Gemini
 */

console.log('🔍 Testing Gemini API Connection...');
console.log('=====================================');

// Test dengan API key yang umum digunakan untuk testing
// Ganti dengan API key Anda yang sebenarnya
const API_KEY = 'AIzaSyBvOkBwqRitB6FvD2h5QpXrL8nM9sT1uV2w'; // GANTI DENGAN API KEY ANDA

console.log('📋 API Key Status:', API_KEY ? '✅ Found' : '❌ Not Found');
console.log('🔑 API Key Preview:', API_KEY ? `${API_KEY.substring(0, 15)}...` : 'None');

if (!API_KEY || API_KEY === 'AIzaSyBvOkBwqRitB6FvD2h5QpXrL8nM9sT1uV2w') {
    console.log('\n❌ PERHATIAN:');
    console.log('1. Buka file test-gemini-connection.js');
    console.log('2. Ganti API_KEY dengan API key Gemini Anda yang sebenarnya');
    console.log('3. Dapatkan API key di: https://makersuite.google.com/app/apikey');
    console.log('4. Jalankan ulang: node test-gemini-connection.js');
    process.exit(1);
}

async function testGeminiAPI() {
    try {
        console.log('\n🚀 Mengirim request ke Gemini API...');
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: "Halo! Ini adalah test koneksi. Tolong jawab dengan 'Koneksi berhasil!' dalam bahasa Indonesia."
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            })
        });

        console.log('📡 Response Status:', response.status);
        console.log('📡 Response OK:', response.ok);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:', response.status, response.statusText);
            console.error('❌ Error Details:', errorText);
            
            if (response.status === 400) {
                console.log('\n💡 Kemungkinan penyebab:');
                console.log('- API key tidak valid');
                console.log('- API key belum diaktifkan');
                console.log('- Format request salah');
            } else if (response.status === 403) {
                console.log('\n💡 Kemungkinan penyebab:');
                console.log('- API key tidak memiliki permission');
                console.log('- Quota API key habis');
                console.log('- API key expired');
            }
            
            return false;
        }

        const data = await response.json();
        console.log('✅ Response berhasil diterima!');
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const aiResponse = data.candidates[0].content.parts[0].text;
            console.log('🤖 AI Response:', aiResponse);
            console.log('✅ Koneksi AI: BERHASIL!');
            return true;
        } else {
            console.error('❌ Format response tidak valid');
            console.log('📝 Raw response:', JSON.stringify(data, null, 2));
            return false;
        }

    } catch (error) {
        console.error('❌ Connection Error:', error.message);
        
        if (error.message.includes('fetch')) {
            console.log('\n💡 Kemungkinan penyebab:');
            console.log('- Tidak ada koneksi internet');
            console.log('- Firewall memblokir request');
            console.log('- DNS tidak bisa resolve');
        }
        
        return false;
    }
}

// Jalankan test
testGeminiAPI().then(success => {
    console.log('\n=====================================');
    if (success) {
        console.log('🎉 TEST BERHASIL!');
        console.log('✅ API key Gemini Anda berfungsi dengan baik');
        console.log('✅ AI assistant di aplikasi akan bekerja normal');
    } else {
        console.log('💥 TEST GAGAL!');
        console.log('❌ Ada masalah dengan API key atau koneksi');
        console.log('💡 Periksa API key dan coba lagi');
    }
    console.log('=====================================');
    process.exit(success ? 0 : 1);
});