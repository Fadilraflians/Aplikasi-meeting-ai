/**
 * Test AI Connection to Gemini API
 * Test script untuk mengecek koneksi AI ke API key
 */

// Load environment variables
const dotenv = require('dotenv');
dotenv.config();

const API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

console.log('🔍 Testing AI Connection to Gemini API...');
console.log('📋 API Key Status:', API_KEY ? '✅ Found' : '❌ Not Found');
console.log('🔑 API Key Preview:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'None');

if (!API_KEY) {
    console.error('❌ Error: No API key found!');
    console.log('💡 Please check your .env file and ensure VITE_GEMINI_API_KEY is set');
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
        console.log('💡 Make sure your .env file has the correct VITE_GEMINI_API_KEY');
    }
    process.exit(success ? 0 : 1);
});
