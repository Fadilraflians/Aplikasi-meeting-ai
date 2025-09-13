// Final API connection test
const API_KEY = 'AIzaSyAGDviJKXNABrGPct5yuTmjTbNwLCA8lUo';

async function finalAPITest() {
    console.log('🔍 FINAL API CONNECTION TEST');
    console.log('📡 API Key:', API_KEY.substring(0, 20) + '...');
    console.log('🌐 Endpoint: Gemini 1.5 Flash');
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: 'Test koneksi API Gemini untuk aplikasi pemesanan ruangan Spacio'
                    }]
                }]
            })
        });

        console.log('📊 Status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            const aiResponse = data.candidates[0].content.parts[0].text;
            
            console.log('✅ SUCCESS!');
            console.log('🤖 AI Response:', aiResponse);
            console.log('🎯 API Key Status: VALID AND WORKING');
            console.log('✅ Your Spacio AI Assistant is ready to use!');
            
            return true;
        } else {
            const errorData = await response.text();
            console.log('❌ ERROR:', errorData);
            return false;
        }
    } catch (error) {
        console.log('❌ NETWORK ERROR:', error.message);
        return false;
    }
}

// Run test
finalAPITest().then(success => {
    if (success) {
        console.log('\n🎉 KONFIRMASI: API Gemini Anda berfungsi dengan sempurna!');
        console.log('🚀 Aplikasi Spacio AI Assistant siap digunakan!');
    } else {
        console.log('\n❌ MASALAH: Ada masalah dengan koneksi API');
    }
});



