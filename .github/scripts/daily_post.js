const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();
const IG_USER_ID = (process.env.IG_USER_ID || '').trim();
const IG_ACCESS_TOKEN = (process.env.IG_ACCESS_TOKEN || '').trim();
const FB_PAGE_ID = (process.env.FB_PAGE_ID || '').trim();
const FB_ACCESS_TOKEN = (process.env.FB_ACCESS_TOKEN || '').trim();

const themes = [
  {
    topic: '최지피티(ChoiGPT) 24/7 마케팅 마스터',
    usp: 'AI 엔진 기반 24시간 자율 마케팅 시스템. [Starter: 99만원/월], [Growth: 89만원/월], [Enterprise: 79만원/월]. 입에 착착 감기는 압도적 효율성. 문의: cdrhy219@gmail.com',
    weight: 10, // 홍보 비중 극대화
    isFixedImage: true,
    fixedImagePath: 'service_info/infographic.png'
  },
  {
    topic: '최지피티 B2B 마켓 인텔리전스 (전략분석 리포트)',
    usp: 'STP, SWOT, 4P 등 전문가급 AI 전략 분석 리포트 제공. 월 69만원(12개월 기준)부터 시작하는 B2B 특화 솔루션. 데이터 기반의 완벽한 의사결정 지원.',
    weight: 8,
    isFixedImage: true,
    fixedImagePath: 'service_info/infographic.png'
  },
  {
    topic: '24시간 자율형 AI 마케팅 에이전트',
    usp: '성공사례: Antigravity Math Engine 마케팅 자동화 달성, 실시간 데이터 분석 기반 키워드 타격, 기존 대비 도달률 300% 향상',
    weight: 5
  },
  {
    topic: 'AI Agent 맞춤형 개발 및 비즈니스 솔루션',
    usp: '비즈니스 반복 업무 90% 자동화, Antigravity Math Engine 같은 고성능 업무 툴 제작 전문. 비즈니스 확장에 최적화된 유연한 설계.',
    weight: 4
  },
  {
    topic: '생산성 10배 향상 AI Agent 실무 교육',
    usp: '현업 즉시 적용 가능한 LLM 프롬프트 엔지니어링, 업무 자동화 에이전트 마스터링 컨설팅. 기업 맞춤형 출강 지원.',
    weight: 3
  }
];

async function generateContent(selected) {
  const prompt = `스타트업 ChoiGPT 홍보를 위해 다음 주제에 대한 강력한 마케팅 콘텐츠를 생성해줘.
  주제: ${selected.topic}
  핵심 강점(USP): ${selected.usp}
  관련 링크: https://choigpt.tistory.com/253 (Antigravity Math Engine 성공 사례 참고)
  
  작성 규칙 (절대 준수):
  1. 제공된 USP 정보 외에 절대 특정 대학 이름, 팀 구성, 이력을 지어내지 말 것. (허위 사실 기재 금지)
  2. 반드시 [Hook] -> [3가지 핵심 특징] -> [혜택/가치] -> [CTA] 구조를 따를 것.
  3. 절대로 본문에 [Hook], [특징], [CTA] 같은 라벨을 직접 쓰지 말 것. 내용만 자연스럽게 작성할 것.
  4. "70% 단축", "3배 빠른" 같은 구체적인 수치를 적극 활용할 것.
  5. 문장마다 반드시 줄바꿈을 넣어 가독성을 높일 것.
  
  응답은 반드시 아래 JSON 형식으로만 출력해 (마크다운 없이 순수 JSON만):
  {
    "ig_caption": "인스타그램용 문구 (감성적 임팩트, 해시태그 포함)",
    "fb_caption": "페이스북용 문구 (비즈니스 임팩트, 신뢰감)",
    "imagePrompt": "A clean, minimalist professional photography of ${
      selected.topic.includes('아두이노') ? 'an Arduino board on a bright wooden desk with soft natural sunlight' : 
      selected.topic.includes('웹사이트') ? 'a sleek laptop showing a clean minimalist website layout on a white marble table with a cup of coffee' :
      selected.topic.includes('모바일') ? 'a modern smartphone held naturally in a hand showing a minimalist UI design, soft blurred office background' :
      selected.topic.includes('시스템') ? 'a high-end server room with clean white lighting and organized cables, professional perspective' :
      'a bright, modern minimalist workspace with soft natural light and high-end tech gadgets'
    }. Shot on Sony A7R IV, 35mm lens, f/2.8, hyper-realistic, professional lighting, clean composition, no glowing neon, no futuristic effects, realistic textures, 8k."
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
        .replace(/\[Hook\]|\[3가지 핵심 특징\]|\[핵심 특징\]|\[혜택\/가치\]|\[CTA\]|\[특징\]/gi, '') // AI 라벨 제거
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
        .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '')
        .replace(/[^\u000A\u0020-\u007E\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF\uD800-\uDBFF\uDC00-\uDFFF]/g, '')
        .replace(/\*\*|\*/g, '')
        .replace(/([.!?])\s*/g, '$1\n\n')
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
  const totalWeight = themes.reduce((sum, t) => sum + t.weight, 0);
  let random = Math.floor(Math.random() * totalWeight);
  let selected = themes[0];
  
  for (const t of themes) {
    if (random < t.weight) {
      selected = t;
      break;
    }
    random -= t.weight;
  }
  
  console.log('Selected Theme (Weighted):', selected.topic);
  
  const { ig_caption, fb_caption } = await generateContent(selected);
  
  let imageUrl;
  if (selected.isFixedImage) {
    imageUrl = `https://alexchoi21.github.io/ChoiGPT_Assets/images/${selected.fixedImagePath}`;
  } else {
    // 카테고리별 이미지 매핑
    const categoryMap = {
      '24시간 자율형 AI 마케팅 에이전트': 'ai_marketing',
      'AI Agent 맞춤형 개발 및 비즈니스 솔루션': 'web_dev',
      '생산성 10배 향상 AI Agent 실무 교육': 'web_dev',
      '실전 아두이노 및 릴리패드 창의 교육': 'education',
      'AI 기반 HW/SW 고속 개발 서비스': 'hw_dev'
    };

    const category = categoryMap[selected.topic] || 'web_dev';
    
    const assetCounts = {
      'ai_marketing': 2,
      'web_dev': 25,
      'hw_dev': 40,
      'education': 2,
      'mobile_app': 25
    };

    const maxNum = assetCounts[category] || 2;
    const imgNum = Math.floor(Math.random() * maxNum) + 1;
    imageUrl = `https://alexchoi21.github.io/ChoiGPT_Assets/images/${category}/${imgNum}.png`;
  }
  
  console.log(`Using Asset: ${imageUrl}`);

  const post = async (url, params) => {
    const formData = new FormData();
    for (const key in params) {
      formData.append(key, params[key]);
    }
    const res = await fetch(url, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.error) throw new Error(JSON.stringify(data.error));
    return data;
  };

  const sanitize = (txt) => {
    return txt
      .normalize('NFC')
      .replace(/[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '') // \n(0A), \r(0D) 보존
      .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '')
      .trim();
  };

  // 깨짐 없는 표준 기호 사용 (▶, ●, ✉)
  const footer = '\n\n▶ 포털: https://alexchoi21.github.io/ChoiGPT_Service/\n● 카톡: https://open.kakao.com/o/syhiQlsi\n✉ 이메일: cdrhy219@gmail.com';

  const finalIgCaption = sanitize(ig_caption + '\n\n' + footer);
  const finalFbCaption = sanitize(fb_caption + '\n\n' + footer);

  console.log('--- FINAL CAPTION CHECK ---');
  console.log(finalFbCaption);

  console.log('Posting to Instagram...');
  const igMedia = await post(`https://graph.facebook.com/v20.0/${IG_USER_ID}/media`, {
    image_url: imageUrl,
    caption: finalIgCaption,
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
    caption: finalFbCaption,
    access_token: FB_ACCESS_TOKEN
  });
  
  console.log('SUCCESS: All channels posted perfectly.');
}

run().catch(e => { console.error(e); process.exit(1); });
