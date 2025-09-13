/**
 * Simple AI Connection Test
 * Test koneksi AI ke Gemini API tanpa dotenv
 */

console.log('🔍 Testing AI Connection to Gemini API...');

// Test dengan API key hardcoded untuk testing
const API_KEY = 'AIzaSyBvOkBwqRitB6FvD2h5QpXrL8nM9sT1uV2w'; // Replace with your actual API key

console.log('📋 API Key Status:', API_KEY ? '✅ Found' : '❌ Not Found');
console.log('🔑 API Key Preview:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'None');

if (!API_KEY || API_KEY === 'your-gemini-api-key-here') {
    console.error('❌ Error: Please replace the API key with your actual Gemini API key!');
    console.log('💡 Get your API key from: https://makersuite.google.com/app/apikey');
    process.exit(1);
}

// Test API call
async function testGeminiConnection() {
    try {
        console.log('\n🚀 Testing Gemini API call...');
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: "Hello, this is a test message. Please respond with 'AI connection successful!'"
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
        console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:', response.status, response.statusText);
            console.error('❌ Error Details:', errorText);
            return false;
        }

        const data = await response.json();
        console.log('✅ API Response received!');
        console.log('📝 Response Data:', JSON.stringify(data, null, 2));

        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const aiResponse = data.candidates[0].content.parts[0].text;
            console.log('🤖 AI Response:', aiResponse);
            console.log('✅ AI Connection Test: SUCCESS!');
            return true;
        } else {
            console.error('❌ Invalid response format');
            return false;
        }

    } catch (error) {
        console.error('❌ Connection Error:', error.message);
        return false;
    }
}

// Run test
testGeminiConnection().then(success => {
    if (success) {
        console.log('\n🎉 AI Connection Test PASSED!');
        console.log('✅ Your Gemini API key is working correctly');
        console.log('✅ AI assistant should work properly in the application');
    } else {
        console.log('\n💥 AI Connection Test FAILED!');
        console.log('❌ Please check your API key and network connection');
        console.log('💡 Make sure you have a valid Gemini API key');
    }
    process.exit(success ? 0 : 1);
});


