const API_KEY = 'AIzaSyAGDviJKXNABrGPct5yuTmjTbNwLCA8lUo';

fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        contents: [{
            parts: [{
                text: 'Test koneksi API Gemini'
            }]
        }]
    })
})
.then(response => response.json())
.then(data => {
    console.log('✅ SUCCESS!');
    console.log('🤖 AI Response:', data.candidates[0].content.parts[0].text);
    console.log('🎯 API Key Status: VALID AND WORKING');
    console.log('✅ Your Spacio AI Assistant is ready!');
})
.catch(error => {
    console.log('❌ ERROR:', error.message);
});



