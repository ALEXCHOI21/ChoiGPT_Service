const GEMINI_API_KEY = 'AIzaSyDePuv7Q1YPrXwomsbZtfOOvlSMCN8b6wU';

async function testGemini() {
  console.log('Testing Gemini API with new key and v1beta header-based auth...');
  const prompt = '최지피티(ChoiGPT) 브랜드 홍보를 위한 짧은 인스타그램 문구 하나 생성해줘. JSON 형식 {"test": "문구"}로 응답해.';
  
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY 
      },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const data = await res.json();
    if (!res.ok) {
      console.error('API Error:', JSON.stringify(data));
      return;
    }
    
    console.log('API Success! Response content:');
    console.log(data.candidates[0].content.parts[0].text);
  } catch (e) {
    console.error('Fetch Error:', e.message);
  }
}

testGemini();
