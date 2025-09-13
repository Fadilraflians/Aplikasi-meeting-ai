const API_KEY = 'AIzaSyAGDviJKXNABrGPct5yuTmjTbNwLCA8lUo';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

async function testGeminiDetailed() {
    console.log('🔍 Testing Gemini API connection with detailed analysis...');
    console.log('📡 API Key:', API_KEY);
    console.log('🌐 Base URL:', BASE_URL);
    
    try {
        const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: 'Hello, test connection'
                    }]
                }]
            })
        });

        console.log('📊 Response Status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ SUCCESS: API connection working!');
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const aiResponse = data.candidates[0].content.parts[0].text;
                console.log('🤖 AI Response:', aiResponse);
                console.log('🎯 API Key Status: VALID AND WORKING');
            }
        } else {
            const errorData = await response.text();
            console.log('❌ ERROR: API connection failed!');
            console.log('📝 Error Response:', errorData);
            
            if (response.status === 400) {
                console.log('🔍 Status 400 - Bad Request:');
                console.log('   - API key format might be invalid');
                console.log('   - Request format incorrect');
            } else if (response.status === 403) {
                console.log('🔍 Status 403 - Forbidden:');
                console.log('   - API key not authorized');
                console.log('   - Service not enabled in Google Cloud Console');
                console.log('   - Quota exceeded');
            } else if (response.status === 429) {
                console.log('🔍 Status 429 - Too Many Requests:');
                console.log('   - Rate limit exceeded');
                console.log('   - Quota exhausted');
            }
        }
    } catch (error) {
        console.log('❌ NETWORK ERROR:', error.message);
    }
}

// Test with different API key format
async function testAlternativeAPI() {
    console.log('\n🔄 Testing alternative API endpoint...');
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: 'Test connection'
                    }]
                }]
            })
        });

        console.log('📊 Alternative Response Status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Alternative API working!');
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const aiResponse = data.candidates[0].content.parts[0].text;
                console.log('🤖 AI Response:', aiResponse);
            }
        } else {
            const errorData = await response.text();
            console.log('❌ Alternative API failed:', errorData);
        }
    } catch (error) {
        console.log('❌ Alternative API error:', error.message);
    }
}

// Run tests
testGeminiDetailed().then(() => {
    testAlternativeAPI();
});



