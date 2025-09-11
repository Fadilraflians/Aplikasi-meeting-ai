// Test script to verify Gemini API connection
const API_KEY = 'AIzaSyBpv2hzlyOKPEpRU68IGCF9SAzf7WywKlU';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

async function testGeminiConnection() {
  console.log('🧪 Testing Gemini API Connection...');
  console.log('API Key:', API_KEY.substring(0, 10) + '...');
  console.log('Base URL:', BASE_URL);
  
  const requestBody = {
    contents: [{
      parts: [{
        text: "Halo! Apakah Anda bisa mendengar saya? Ini adalah test koneksi."
      }]
    }],
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
    console.log('\n📡 Sending request to Gemini API...');
    
    const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      return false;
    }

    const data = await response.json();
    console.log('\n✅ API Response received!');
    console.log('Response structure:', Object.keys(data));
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const content = data.candidates[0].content.parts[0].text;
      console.log('\n🤖 Gemini Response:');
      console.log(content);
      console.log('\n🎉 SUCCESS: Gemini API is working correctly!');
      return true;
    } else {
      console.error('❌ Unexpected response structure:', data);
      return false;
    }

  } catch (error) {
    console.error('❌ Network Error:', error.message);
    return false;
  }
}

// Run the test
testGeminiConnection()
  .then(success => {
    if (success) {
      console.log('\n✅ Test completed successfully!');
      console.log('Your AI assistant should now be connected to Gemini API.');
    } else {
      console.log('\n❌ Test failed!');
      console.log('Please check your API key and network connection.');
    }
  })
  .catch(error => {
    console.error('❌ Test error:', error);
  });
