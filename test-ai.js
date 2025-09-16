// Test script untuk memeriksa koneksi AI
console.log('🚀 Starting AI Connection Test...');

// Test environment variables
console.log('🔍 Environment Variables Test:');
console.log('  - VITE_GEMINI_API_KEY:', process.env.VITE_GEMINI_API_KEY ? '✅ Found' : '❌ Not found');
console.log('  - GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Found' : '❌ Not found');

// Test API key format
const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || 'AIzaSyA_Rde7sVAyaQ3aE_V1ycbMD45PTQnxQko';
console.log('🔑 API Key Status:', apiKey ? '✅ Available' : '❌ Empty');
console.log('🔗 API Key Length:', apiKey?.length || 0, 'characters');
console.log('📋 API Key Format:', apiKey?.startsWith('AIza') ? '✅ Valid' : '⚠️ Invalid');

// Test Gemini API URL
const baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const fullUrl = `${baseUrl}?key=${apiKey}`;
console.log('🌐 Full API URL:', fullUrl);

// Test simple API call
async function testGeminiAPI() {
    try {
        console.log('🤖 Testing Gemini API call...');
        
        const response = await fetch(fullUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ 
                    parts: [{ 
                        text: "Halo! Apakah Anda bisa mendengar saya? Jawab dengan singkat dalam bahasa Indonesia." 
                    }] 
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 100,
                }
            }),
        });

        console.log('📊 Response Status:', response.status);
        console.log('📋 Response Headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ API Error:', errorData);
            return;
        }

        const data = await response.json();
        console.log('✅ API Response received!');
        console.log('📄 Response Data:', JSON.stringify(data, null, 2));

        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const aiResponse = data.candidates[0].content.parts[0].text;
            console.log('🤖 AI Response:', aiResponse);
            console.log('🎯 AI Connection Test: SUCCESS!');
        } else {
            console.log('❌ Invalid response structure');
        }

    } catch (error) {
        console.error('❌ API Test Failed:', error.message);
        console.error('🔍 Error details:', error);
    }
}

// Run the test
testGeminiAPI();
