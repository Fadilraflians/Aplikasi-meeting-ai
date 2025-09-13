// Test API connection from the application perspective
const API_KEY = 'AIzaSyAGDviJKXNABrGPct5yuTmjTbNwLCA8lUo';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

async function testAppAPIConnection() {
    console.log('🔍 Testing API connection from application perspective...');
    console.log('📡 API Key:', API_KEY.substring(0, 20) + '...');
    
    try {
        const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: 'Saya ingin memesan ruangan untuk rapat tim internal dengan 5 peserta pada tanggal 15 Januari 2025 jam 09:00. PIC adalah Budi. Topik rapat adalah review proyek.'
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
                console.log('🤖 AI Response:');
                console.log(aiResponse);
                console.log('\n🎯 API Key Status: VALID AND WORKING');
                console.log('✅ Your AI assistant should work correctly!');
            }
        } else {
            const errorData = await response.text();
            console.log('❌ ERROR: API connection failed!');
            console.log('📝 Error Response:', errorData);
        }
    } catch (error) {
        console.log('❌ NETWORK ERROR:', error.message);
    }
}

// Test booking scenario
async function testBookingScenario() {
    console.log('\n🔄 Testing booking scenario...');
    
    try {
        const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: 'Anda adalah Spacio AI Assistant - Sistem AI Pemesanan Ruangan Cerdas. User berkata: "Saya mau pesan ruangan untuk rapat tim". Bagaimana Anda merespons?'
                    }]
                }]
            })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const aiResponse = data.candidates[0].content.parts[0].text;
                console.log('🤖 AI Booking Response:');
                console.log(aiResponse);
            }
        }
    } catch (error) {
        console.log('❌ Booking test error:', error.message);
    }
}

// Run tests
testAppAPIConnection().then(() => {
    testBookingScenario();
});



