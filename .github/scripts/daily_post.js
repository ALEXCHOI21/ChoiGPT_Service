const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();
const IG_USER_ID = (process.env.IG_USER_ID || '').trim();
const IG_ACCESS_TOKEN = (process.env.IG_ACCESS_TOKEN || '').trim();
const FB_PAGE_ID = (process.env.FB_PAGE_ID || '').trim();
const FB_ACCESS_TOKEN = (process.env.FB_ACCESS_TOKEN || '').trim();

const themes = [
  {
    topic: 'AI 기반 HW/SW 고속 개발 서비스',
    usp: '업계 평균 대비 3배 빠른 프로토타이핑, AI 자동 PCB 라우팅으로 개발 기간 70% 단축, HW/SW 통합 솔루션 원스톱 제공'
  },
  {
    topic: '실전 아두이노 및 릴리패드 창의 교육',
    usp: '단 하루 만에 완성하는 실전 IoT 시제품 제작, 특허 기술 기반 릴리패드 키트 활용, 비전공자도 가능한 논리적 코딩 커리큘럼'
  },
  {
    topic: '생산성 10배 향상 AI 실무 워크숍',
    usp: '현업 즉시 적용 가능한 LLM 프롬프트 엔지니어링, 워크플로우 자동화 도구 마스터링, 기업별 맞춤형 AI 도입 컨설팅'
  },
  {
    topic: '전국 청소년 AI 창의 경진대회 전략 지원',
    usp: '서울대 출신 멘토진의 1:1 밀착 코칭, 프로젝트 기획부터 기술 구현까지 전 과정 가이드, 수상 가능성을 높이는 데이터 기반 전략'
  },
  {
    topic: '24시간 자율형 AI 마케팅 에이전트',
    usp: '사람보다 정교한 24/7 자동 포스팅 및 고객 응대, 실시간 상권 데이터 분석 기반 키워드 타격, 광고비 대비 도달률 300% 향상'
  }
];

async function generateContent(selected) {
  const prompt = `스타트업 ChoiGPT 홍보를 위해 다음 주제에 대한 강력한 마케팅 콘텐츠를 생성해줘.
  주제: ${selected.topic}
  핵심 강점(USP): ${selected.usp}
  
  작성 규칙:
  1. 반드시 [Hook(강렬한 첫 문장)] -> [3가지 핵심 특징(숫자 활용)] -> [혜택/가치] -> [CTA] 구조를 따를 것.
  2. "혁신적", "최고" 같은 추상적 단어보다 "70% 단축", "3배 빠른" 같은 구체적인 수치를 사용할 것.
  3. 문장마다 줄바꿈 2번(Enter 2번)을 넣어 시각적 여백을 극대화할 것.
  4. 불렛포인트는 ✅ 이모지만 사용할 것.
  
  응답은 반드시 아래 JSON 형식으로만 출력해 (마크다운 없이 순수 JSON만):
  {
    "ig_caption": "인스타그램용 문구 (감성적 임팩트, 해시태그 포함)",
    "fb_caption": "페이스북용 문구 (비즈니스 임팩트, 신뢰감)",
    "imagePrompt": "A high-quality professional macro photography of ${selected.topic.includes('아두이노') ? 'an Arduino board with glowing LEDs and electronic circuits' : 'modern high-tech hardware components with sleek lighting'}. 8k, realistic, sharp focus, premium composition, no people."
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
      
      const clean = (txt) => txt
        .normalize('NFC')
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
        .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '')
        .replace(/[^\u000A\u0020-\u007E\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF\uD800-\uDBFF\uDC00-\uDFFF]/g, '')
        .replace(/\*\*|\*/g, '')
        .replace(/\n/g, '\n\n')
        .replace(/\n\n\n+/g, '\n\n')
        .trim();
        
      parsed.ig_caption = clean(parsed.ig_caption);
      parsed.fb_caption = clean(parsed.fb_caption);
      
      return parsed;
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

async function run() {
  const selected = themes[Math.floor(Math.random() * themes.length)];
  console.log('Selected Theme:', selected.topic);
  
  const { ig_caption, fb_caption, imagePrompt } = await generateContent(selected);
  const seed = Math.floor(Math.random() * 1000000);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1080&height=1080&nologo=true&seed=${seed}`;
  
  // 모든 이모지를 유니코드로 하드코딩 (깨짐 원천 차단)
  const footer = '\n\n\uD83D\uDD17 \uD3EC\uD138: https://alexchoi21.github.io/ChoiGPT_Service/\n\uD83D\uDCAC \uBB38\uC758: https://open.kakao.com/o/syhiQlsi';

  const post = async (url) => {
    const res = await fetch(url, { method: 'POST' });
    const data = await res.json();
    if (data.error) throw new Error(JSON.stringify(data.error));
    return data;
  };

  const sanitize = (txt) => {
    return txt
      .normalize('NFC')
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '')
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
