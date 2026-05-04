const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();
const IG_USER_ID = (process.env.IG_USER_ID || '').trim();
const IG_ACCESS_TOKEN = (process.env.IG_ACCESS_TOKEN || '').trim();
const FB_PAGE_ID = (process.env.FB_PAGE_ID || '').trim();
const FB_ACCESS_TOKEN = (process.env.FB_ACCESS_TOKEN || '').trim();

const themes = [
  {
    topic: '최지피티(ChoiGPT) 24/7 마케팅 마스터',
    usp: 'AI 실시간 상권 분석 및 24시간 자동 포스팅 시스템. [출시 기념 50% OFF] 1개월(Basic) 9.9만원, 2개월(Starter) 18만원. 전문가급 STP/AIDA/SWOT/4P 리포트 자동 생성. 문의: cdrhy219@gmail.com / 카톡 오픈채팅',
    weight: 100, // 최우선 홍보 가중치
    isFixedImage: true,
    fixedImagePath: 'service_info/infographic.png'
  },
  {
    topic: '최지피티 B2B 마켓 인텔리전스 (AI 전략 분석 리포트)',
    usp: 'STP, AIDA, SWOT, 4P 프레임워크를 기반으로 AI가 즉시 수립하는 최강의 마케팅 전략. 데이터 기반 지역 상권 정밀 분석 및 타겟팅.',
    weight: 6,
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
    usp: 'Antigravity Math Engine 같은 고성능 업무 툴 제작, 반복 업무 90% 자동화, 비즈니스 성장에 따른 유연한 확장성',
    weight: 4
  },
  {
    topic: '생산성 10배 향상 AI Agent 실무 교육',
    usp: '현업 즉시 적용 가능한 LLM 프롬프트 엔지니어링, 업무 자동화 에이전트 마스터링, 기업별 맞춤형 컨설팅',
    weight: 3
  },
  {
    topic: '실전 아두이노 및 릴리패드 창의 교육',
    usp: '단 하루 만에 완성하는 실전 IoT 시제품 제작, 특허 기술 기반 릴리패드 키트 활용, 비전공자도 가능한 커리큘럼',
    weight: 2
  },
  {
    topic: 'AI 기반 HW/SW 고속 개발 서비스',
    usp: '업계 평균 대비 3배 빠른 프로토타이핑, AI 자동 PCB 라우팅으로 개발 기간 70% 단축, HW/SW 통합 솔루션',
    weight: 1
  }
];

async function generateContent(selected, retries = 5) {
  const prompt = `스타트업 ChoiGPT 홍보를 위해 다음 주제에 대한 강력한 마케팅 콘텐츠를 생성해줘.
  주제: ${selected.topic}
  핵심 강점(USP): ${selected.usp}
  관련 링크: https://choigpt.tistory.com/253 (Antigravity Math Engine 성공 사례 참고)
  
  작성 규칙 (절대 준수):
  1. 제공된 USP 정보 외에 절대 특정 대학 이름, 팀 구성, 이력을 지어내지 말 것.
  2. 반드시 [Hook] -> [3가지 핵심 특징] -> [혜택/가치] -> [CTA] 구조를 따를 것.
  3. 절대로 본문에 [Hook], [특징], [CTA] 같은 라벨을 직접 쓰지 말 것. 내용만 자연스럽게 작성할 것.
  4. "70% 단축", "3배 빠른" 같은 구체적인 수치를 적극 활용할 것.
  5. 문장마다 반드시 줄바꿈을 넣어 가독성을 높일 것.
  
  응답은 반드시 아래 JSON 형식으로만 출력해 (마크다운 없이 순수 JSON만):
  {
    "ig_caption": "인스타그램용 문구 (감성적 임팩트, 해시태그 포함)",
    "fb_caption": "페이스북용 문구 (비즈니스 임팩트, 신뢰감)"
  }`;

  for (let i = 0; i < retries; i++) {
    const delay = Math.pow(2, i) * 10000;
    try {
      // 사용자 API 키 권한에 맞는 최신 gemini-2.0-flash 모델 사용
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(url, {
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
      if (!data.candidates || !data.candidates[0]) throw new Error('No candidates returned from Gemini');
      
      const text = data.candidates[0].content.parts[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error(`No JSON found in response: ${text}`);
      
      let parsed = JSON.parse(jsonMatch[0]);
      
      const clean = (txt) => txt
        .normalize('NFC')
        .replace(/\[Hook\]|\[3가지 핵심 특징\]|\[핵심 특징\]|\[혜택\/가치\]|\[CTA\]|\[특징\]/gi, '')
        .replace(/[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
        .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '')
        .replace(/\*\*|\*/g, '')
        .replace(/([.!?])\s*/g, '$1\n\n')
        .replace(/\n\n\n+/g, '\n\n')
        .trim();
        
      parsed.ig_caption = clean(parsed.ig_caption);
      parsed.fb_caption = clean(parsed.fb_caption);
      
      return parsed;
    } catch (e) {
      if (i === retries - 1) throw e;
      console.log(`Retry ${i+1}/${retries} after error: ${e.message}`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Gemini API failed after all retries.');
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
  
  console.log('Selected Theme:', selected.topic);
  
  const { ig_caption, fb_caption } = await generateContent(selected);
  
  let imageUrl;
  if (selected.isFixedImage) {
    imageUrl = `https://alexchoi21.github.io/ChoiGPT_Assets/images/${selected.fixedImagePath}`;
  } else {
    const categoryMap = {
      '24시간 자율형 AI 마케팅 에이전트': 'ai_marketing',
      'AI Agent 맞춤형 개발 및 비즈니스 솔루션': 'web_dev',
      '생산성 10배 향상 AI Agent 실무 교육': 'web_dev',
      '실전 아두이노 및 릴리패드 창의 교육': 'education',
      'AI 기반 HW/SW 고속 개발 서비스': 'hw_dev'
    };

    const category = categoryMap[selected.topic] || 'web_dev';
    const assetCounts = { 'ai_marketing': 2, 'web_dev': 25, 'hw_dev': 40, 'education': 2, 'mobile_app': 25 };
    const maxNum = assetCounts[category] || 2;
    const imgNum = Math.floor(Math.random() * maxNum) + 1;
    imageUrl = `https://alexchoi21.github.io/ChoiGPT_Assets/images/${category}/${imgNum}.png`;
  }
  
  console.log(`Using Asset: ${imageUrl}`);

  const post = async (url, params) => {
    const p = new URLSearchParams(params);
    const res = await fetch(url + '?' + p.toString(), { method: 'POST' });
    const data = await res.json();
    if (data.error) throw new Error(JSON.stringify(data.error));
    return data;
  };

  const footer = '\n\n\u25B6 \uD3EC\uD138: https://alexchoi21.github.io/ChoiGPT_Service/\n\u25CF \uBB38\uC758: https://open.kakao.com/o/syhiQlsi';
  const finalIgCaption = ig_caption + '\n\n' + footer;
  const finalFbCaption = fb_caption + '\n\n' + footer;

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
