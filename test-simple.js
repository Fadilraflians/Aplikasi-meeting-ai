// Test sederhana untuk Gemini API
const API_KEY = 'AIzaSyBvOkBwqRitB6FvD2h5QpXrL8nM9sT1uV2w'; // GANTI DENGAN API KEY ANDA

console.log('🔍 Testing Gemini API...');
console.log('API Key:', API_KEY ? 'Found' : 'Not Found');

if (!API_KEY || API_KEY === 'AIzaSyBvOkBwqRitB6FvD2h5QpXrL8nM9sT1uV2w') {
    console.log('❌ Silakan ganti API_KEY dengan API key Gemini Anda yang sebenarnya');
    console.log('💡 Dapatkan API key di: https://makersuite.google.com/app/apikey');
    process.exit(1);
}

async function test() {
    try {
        console.log('🚀 Mengirim request...');
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Hello, respond with 'Success!'" }] }]
            })
        });

        console.log('Status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Success!');
            console.log('AI Response:', data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response');
        } else {
            const error = await response.text();
            console.log('❌ Error:', error);
        }
    } catch (error) {
        console.log('❌ Connection Error:', error.message);
    }
}

test();