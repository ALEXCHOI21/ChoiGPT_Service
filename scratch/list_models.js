const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

async function listModels() {
  console.log('Fetching available models for this API key...');
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
    const data = await res.json();
    if (!res.ok) {
      console.error('Error fetching models:', JSON.stringify(data));
      return;
    }
    console.log('Available models:');
    data.models.forEach(m => console.log(`- ${m.name}`));
  } catch (e) {
    console.error('Fetch Error:', e.message);
  }
}

listModels();
