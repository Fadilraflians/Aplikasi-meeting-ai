// Simple test untuk Google Gemini API
const https = require('https');

const API_KEY = 'AIzaSyBpv2hzlyOKPEpRU68IGCF9SAzf7WywKlU';
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

const data = JSON.stringify({
  contents: [{
    parts: [{
      text: "Halo, tolong jawab dalam bahasa Indonesia: Apa kabar?"
    }]
  }],
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 100
  }
});

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('🧪 Testing Google Gemini API...');
console.log('📤 Sending request...');

const req = https.request(url, options, (res) => {
  console.log(`📊 Status: ${res.statusCode}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsed = JSON.parse(responseData);
      console.log('✅ Response received!');
      console.log('📋 Full response:', JSON.stringify(parsed, null, 2));
      
      if (parsed.candidates && parsed.candidates[0] && parsed.candidates[0].content) {
        const text = parsed.candidates[0].content.parts[0].text;
        console.log('\n🤖 AI Response:');
        console.log(text);
      }
    } catch (error) {
      console.error('❌ Error parsing response:', error.message);
      console.log('Raw response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
});

req.write(data);
req.end();
