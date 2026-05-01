const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();
const IG_USER_ID = (process.env.IG_USER_ID || '').trim();
const IG_ACCESS_TOKEN = (process.env.IG_ACCESS_TOKEN || '').trim();
const FB_PAGE_ID = (process.env.FB_PAGE_ID || '').trim();
const FB_ACCESS_TOKEN = (process.env.FB_ACCESS_TOKEN || '').trim();

async function generateContent(prompt, retries = 5) {
    for (let i = 0; i < retries; i++) {
        const delay = Math.pow(2, i) * 10000;
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            const data = await res.json();
            
            if (res.status === 429) {
                console.log(`Rate limited (429). Waiting ${delay/1000}s before retry ${i+1}/${retries}...`);
                await new Promise(r => setTimeout(r, delay));
                continue;
            }
            
            if (!res.ok) throw new Error(`Gemini Error: ${JSON.stringify(data)}`);
            if (!data.candidates || data.candidates.length === 0) throw new Error('No candidates returned from Gemini');
            
            const text = data.candidates[0].content.parts[0].text;
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error(`No JSON found in response: ${text}`);
            return jsonMatch[0];
        } catch (e) {
            if (i === retries - 1) throw e;
            console.log(`Retry ${i+1}/${retries} after error: ${e.message}`);
            await new Promise(r => setTimeout(r, delay));
        }
    }
    throw new Error('Gemini API failed after all retries due to rate limiting.');
}

async function run() {
            const imageUrl = `https://raw.githubusercontent.com/ALEXCHOI21/ChoiGPT_Assets/main/images/service_info/infographic.png`;
            const prompt = `Create powerful SNS marketing content for ChoiGPT. 
              Services: 
                1. Antigravity Math Engine (LaTeX to PPT)
                  2. 24h Autonomous AI Marketing Agent
                    3. AI HW/SW Fast Development. 
                      Output JSON only: {"ig_caption": "...", "fb_caption": "..."}. Respond in Korean.`;

  const rawText = await generateContent(prompt);
            const content = JSON.parse(rawText);
            const footer = '\n\n* Portal: https://alexchoi21.github.io/ChoiGPT_Service/\n* Contact: https://open.kakao.com/o/syhiQlsi';

  const post = async (url, params) => {
                const p = new URLSearchParams(params);
                const res = await fetch(url + '?' + p.toString(), { method: 'POST' });
                const data = await res.json();
                if (data.error) throw new Error(JSON.stringify(data.error));
                return data;
  };

  console.log('Posting to Instagram...');
            const igMedia = await post(`https://graph.facebook.com/v20.0/${IG_USER_ID}/media`, {
                          image_url: imageUrl,
                          caption: content.ig_caption + footer,
                          access_token: IG_ACCESS_TOKEN
            });
            await new Promise(r => setTimeout(r, 30000));
            await post(`https://graph.facebook.com/v20.0/${IG_USER_ID}/media_publish`, {
                          creation_id: igMedia.id,
                          access_token: IG_ACCESS_TOKEN
            });

  console.log('Posting to Facebook...');
            await post(`https://graph.facebook.com/v20.0/${FB_PAGE_ID}/photos`, {
                          url: imageUrl,
                          caption: content.fb_caption + footer,
                          access_token: FB_ACCESS_TOKEN
            });

  console.log('SUCCESS: All channels posted!');
}

run().catch(e => { console.error(e); process.exit(1); });
