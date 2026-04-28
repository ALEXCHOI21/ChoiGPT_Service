const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();
const IG_USER_ID = (process.env.IG_USER_ID || '').trim();
const IG_ACCESS_TOKEN = (process.env.IG_ACCESS_TOKEN || '').trim();
const FB_PAGE_ID = (process.env.FB_PAGE_ID || '').trim();
const FB_ACCESS_TOKEN = (process.env.FB_ACCESS_TOKEN || '').trim();

const themes = [
  'ChoiGPT의 AI 기반 HW/SW 고속 개발 서비스 홍보',
  '실전 아두이노 및 릴리패드 창의 교육 프로그램 홍보',
  '생산성을 10배 높이는 생성형 AI 실무 워크숍 홍보',
  '전국 청소년 AI 창의 경진대회 및 공모전 전략 지원 서비스 홍보',
  '혁신적인 하드웨어 아키텍처와 임베디드 시스템 설계 전문성 강조',
  '24시간 자율형 AI 마케팅 에이전트 서비스 도입 안내'
];

async function generateContent(theme) {
  const prompt = `스타트업 ChoiGPT 홍보를 위해 다음 주제에 대한 콘텐츠를 플랫폼별로 최적화하여 생성해줘. 주제: ${theme}
응답은 반드시 아래 JSON 형식으로만 출력해 (마크다운 없이 순수 JSON만):
{
  "ig_caption": "인스타그램용 문구 (감성적, 이모지 활용, 특수기호 절대 금지)",
  "fb_caption": "페이스북용 문구 (전문적, 이모지 활용, 특수기호 절대 금지)",
  "imagePrompt": "A high-quality professional macro photography of ${theme.includes('아두이노') ? 'an Arduino board with glowing LEDs and electronic circuits' : theme.includes('워크숍') ? 'a modern laptop with a sleek digital AI overlay' : 'futuristic high-tech hardware components'}. Professional lighting, sharp focus, 8k, realistic, no people, no faces, clean composition."
}`;
  
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await res.json();
      if (res.status === 429) { await new Promise(r => setTimeout(r, 5000)); continue; }
      
      const rawText = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
      let parsed = JSON.parse(rawText);
      
      // 강력한 화이트리스트 기반 필터 (한글, 영문, 숫자, 기본 문장부호, 특정 이모지만 허용)
      const clean = (txt) => txt
        .replace(/[^가-힣a-zA-Z0-9\s.,!?:()🚀✅📍💬🔗#\n-]/g, '')
        .replace(/\*\*|\*/g, '')
        .trim();
        
      parsed.ig_caption = clean(parsed.ig_caption);
      parsed.fb_caption = clean(parsed.fb_caption);
      
      console.log('Cleaned FB Caption:', parsed.fb_caption);
      return parsed;
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

async function run() {
  const theme = themes[Math.floor(Math.random() * themes.length)];
  console.log('Target Theme:', theme);
  
  const { ig_caption, fb_caption, imagePrompt } = await generateContent(theme);
  const seed = Math.floor(Math.random() * 1000000);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1080&height=1080&nologo=true&seed=${seed}`;
  
  const footer = '\n\n🔗 포털: https://alexchoi21.github.io/ChoiGPT_Service/\n💬 문의: https://open.kakao.com/o/syhiQlsi';

  const post = async (url) => {
    const res = await fetch(url, { method: 'POST' });
    const data = await res.json();
    if (data.error) throw new Error(JSON.stringify(data.error));
    return data;
  };

  // 샌니타이징 함수: 제어 문자, 유령 문자(Lone Surrogate) 제거 및 유니코드 정규화
  const sanitize = (txt) => {
    return txt
      .normalize('NFC')
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // 제어 문자 제거
      // 짝이 맞지 않는 유령 문자(Lone Surrogate) 제거
      .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '')
      .replace(/[^\u0020-\u007E\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF\uD800-\uDBFF\uDC00-\uDFFF🚀✅📍💬🔗#\n]/g, '')
      .trim();
  };

  const finalIgCaption = sanitize(ig_caption + footer);
  const finalFbCaption = sanitize(fb_caption + footer);

  console.log('Posting to Instagram...');
  const igParams = new URLSearchParams({
    image_url: imageUrl,
    caption: finalIgCaption,
    access_token: IG_ACCESS_TOKEN
  });
  const igMedia = await post(`https://graph.facebook.com/v20.0/${IG_USER_ID}/media?${igParams.toString()}`);
  await new Promise(r => setTimeout(r, 30000));
  await post(`https://graph.facebook.com/v20.0/${IG_USER_ID}/media_publish?creation_id=${igMedia.id}&access_token=${IG_ACCESS_TOKEN}`);

  console.log('Posting to Facebook...');
  const fbParams = new URLSearchParams({
    url: imageUrl,
    caption: finalFbCaption,
    access_token: FB_ACCESS_TOKEN
  });
  await post(`https://graph.facebook.com/v20.0/${FB_PAGE_ID}/photos?${fbParams.toString()}`);
  
  console.log('SUCCESS: All channels posted perfectly.');
}

run().catch(e => { console.error(e); process.exit(1); });
