// Test dengan Node.js built-in modules
const https = require('https');

console.log('🔍 Testing Gemini API Connection...');
console.log('=====================================');

// Ganti dengan API key Anda yang sebenarnya
const API_KEY = 'AIzaSyBvOkBwqRitB6FvD2h5QpXrL8nM9sT1uV2w'; // GANTI DENGAN API KEY ANDA

console.log('📋 API Key Status:', API_KEY ? '✅ Found' : '❌ Not Found');
console.log('🔑 API Key Preview:', API_KEY ? `${API_KEY.substring(0, 15)}...` : 'None');

if (!API_KEY || API_KEY === 'AIzaSyBvOkBwqRitB6FvD2h5QpXrL8nM9sT1uV2w') {
    console.log('\n❌ PERHATIAN:');
    console.log('1. Buka file test-node-fetch.js');
    console.log('2. Ganti API_KEY dengan API key Gemini Anda yang sebenarnya');
    console.log('3. Dapatkan API key di: https://makersuite.google.com/app/apikey');
    console.log('4. Jalankan ulang: node test-node-fetch.js');
    process.exit(1);
}

function testGeminiAPI() {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
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
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            port: 443,
            path: `/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        console.log('\n🚀 Mengirim request ke Gemini API...');
        console.log('📡 URL:', `https://${options.hostname}${options.path}`);

        const req = https.request(options, (res) => {
            console.log('📡 Response Status:', res.statusCode);
            console.log('📡 Response Headers:', res.headers);

            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        const response = JSON.parse(data);
                        console.log('✅ Response berhasil diterima!');
                        
                        if (response.candidates && response.candidates[0] && response.candidates[0].content) {
                            const aiResponse = response.candidates[0].content.parts[0].text;
                            console.log('🤖 AI Response:', aiResponse);
                            console.log('✅ Koneksi AI: BERHASIL!');
                            resolve(true);
                        } else {
                            console.error('❌ Format response tidak valid');
                            console.log('📝 Raw response:', JSON.stringify(response, null, 2));
                            resolve(false);
                        }
                    } else {
                        console.error('❌ API Error:', res.statusCode, res.statusMessage);
                        console.error('❌ Error Details:', data);
                        
                        if (res.statusCode === 400) {
                            console.log('\n💡 Kemungkinan penyebab:');
                            console.log('- API key tidak valid');
                            console.log('- API key belum diaktifkan');
                            console.log('- Format request salah');
                        } else if (res.statusCode === 403) {
                            console.log('\n💡 Kemungkinan penyebab:');
                            console.log('- API key tidak memiliki permission');
                            console.log('- Quota API key habis');
                            console.log('- API key expired');
                        }
                        
                        resolve(false);
                    }
                } catch (error) {
                    console.error('❌ Parse Error:', error.message);
                    console.log('📝 Raw data:', data);
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Connection Error:', error.message);
            console.log('\n💡 Kemungkinan penyebab:');
            console.log('- Tidak ada koneksi internet');
            console.log('- Firewall memblokir request');
            console.log('- DNS tidak bisa resolve');
            resolve(false);
        });

        req.write(postData);
        req.end();
    });
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


