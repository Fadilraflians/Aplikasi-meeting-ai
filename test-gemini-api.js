// Test Google Gemini API Connection
const API_KEY = 'AIzaSyChO21CKm9-Ekie02b6d6FVyMrLEV9Vlwg';

async function testGeminiAPI() {
    try {
        console.log('🔍 Testing Gemini API connection...');
        console.log('API Key:', API_KEY.substring(0, 10) + '...');
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: 'Halo! Apakah kamu bisa mendengar saya? Tolong jawab dengan singkat.'
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

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const aiResponse = data.candidates[0].content.parts[0].text;
            console.log('✅ Gemini API Connection SUCCESS!');
            console.log('🤖 AI Response:', aiResponse);
            console.log('📊 Response Data:', JSON.stringify(data, null, 2));
        } else {
            console.log('❌ Unexpected response format:', data);
        }
        
    } catch (error) {
        console.error('❌ Gemini API Connection FAILED!');
        console.error('Error:', error.message);
        
        if (error.message.includes('API_KEY_INVALID')) {
            console.error('🔑 API Key is invalid or expired');
        } else if (error.message.includes('QUOTA_EXCEEDED')) {
            console.error('📊 API quota exceeded');
        } else if (error.message.includes('PERMISSION_DENIED')) {
            console.error('🚫 Permission denied - check API key permissions');
        }
    }
}

// Run the test
testGeminiAPI();
