// Test script untuk Google Gemini API integration
// Jalankan dengan: node test-gemini-integration.js

const https = require('https');
const { URL } = require('url');

// Test configuration
const API_KEY = 'AIzaSyBpv2hzlyOKPEpRU68IGCF9SAzf7WywKlU';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Test function
async function testGeminiAPI() {
  console.log('🧪 Testing Google Gemini API Integration...\n');

  const testPrompt = `Anda adalah asisten AI Spacio yang membantu pengguna memesan ruang rapat.

KONTEKS SAAT INI:
- State: IDLE
- Data yang sudah dikumpulkan: Belum ada data
- Pesan user: "Halo, saya ingin pesan ruangan untuk rapat tim besok jam 14:00"

RUANGAN YANG TERSEDIA:
- Samudrantha Meeting Room (kapasitas: 10 orang)
- Cedaya Meeting Room (kapasitas: 8 orang) 
- Celebes Meeting Room (kapasitas: 6 orang)
- Kalamanthana Meeting Room (kapasitas: 4 orang)
- Nusanipa Meeting Room (kapasitas: 12 orang)
- Balidwipa Meeting Room (kapasitas: 15 orang)
- Swarnadwipa Meeting Room (kapasitas: 20 orang)
- Jawadwipa Meeting Room (kapasitas: 25 orang)

TUGAS ANDA:
1. Analisis pesan user dan tentukan respons yang sesuai
2. Update data booking jika ada informasi baru
3. Tentukan state berikutnya
4. Berikan quick actions yang relevan
5. Gunakan bahasa Indonesia yang ramah dan profesional
6. Gunakan emoji yang sesuai

FORMAT RESPONS (JSON):
{
  "responseText": "Pesan respons untuk user",
  "newState": "IDLE|ASKING_ROOM|ASKING_TOPIC|ASKING_PIC|ASKING_PARTICIPANTS|ASKING_DATE|ASKING_TIME|ASKING_MEETING_TYPE|ASKING_FOOD_TYPE|CONFIRMING",
  "updatedBookingData": {
    "roomName": "nama ruangan jika dipilih",
    "topic": "topik rapat jika disebutkan",
    "pic": "nama PIC jika disebutkan",
    "participants": "jumlah peserta jika disebutkan",
    "date": "tanggal jika disebutkan",
    "time": "waktu jika disebutkan",
    "meetingType": "internal|external",
    "foodOrder": "tidak|ringan|berat"
  },
  "finalBooking": null atau object booking lengkap jika siap dikonfirmasi,
  "quickActions": [
    {"label": "Opsi 1", "actionValue": "nilai1"},
    {"label": "Opsi 2", "actionValue": "nilai2"}
  ]
}

RESPONS HANYA BERUPA JSON, TANPA TEKS TAMBAHAN.`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: testPrompt
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024
    },
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      }
    ]
  };

  try {
    console.log('📤 Sending request to Google Gemini API...');
    
    const response = await makeRequest(`${BASE_URL}?key=${API_KEY}`, requestBody);
    
    console.log('✅ API Response received!');
    console.log('📋 Raw Response:');
    console.log(JSON.stringify(response, null, 2));
    
    if (response.candidates && response.candidates.length > 0) {
      const text = response.candidates[0].content.parts[0].text;
      console.log('\n🤖 Generated Text:');
      console.log(text);
      
      // Try to parse as JSON
      try {
        const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleanText);
        console.log('\n✅ Parsed JSON Response:');
        console.log(JSON.stringify(parsed, null, 2));
      } catch (parseError) {
        console.log('\n❌ Failed to parse as JSON:');
        console.log(parseError.message);
      }
    } else {
      console.log('❌ No candidates in response');
    }
    
  } catch (error) {
    console.error('❌ Error testing Gemini API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Helper function to make HTTP request
function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
          }
        } catch (parseError) {
          reject(new Error(`Failed to parse response: ${parseError.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(JSON.stringify(data));
    req.end();
  });
}

// Run test
testGeminiAPI().then(() => {
  console.log('\n🎉 Test completed!');
}).catch((error) => {
  console.error('\n💥 Test failed:', error.message);
  process.exit(1);
});
