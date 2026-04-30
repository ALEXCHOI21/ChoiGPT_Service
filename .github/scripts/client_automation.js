const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MY_FB_PAGE_ID = process.env.FB_PAGE_ID_2ND; // 사용자의 업체 홍보용 2nd 페이스북 페이지 ID
const MY_FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN_2ND;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runAutomation() {
    console.log('--- 클라이언트 마케팅 자동화 엔진 가동 ---');

    // 활성 고객 리스트 호출 (마지막 포스팅 후 24시간 경과 기준 등 조건 추가 가능)
    const { data: clients, error } = await supabase
        .from('marketing_clients')
        .select('*');

    if (error) {
        console.error('고객 로드 실패:', error);
        return;
    }

    for (const client of clients) {
        // 분석 리포트가 완료된 고객만 진행
        if (client.analysis_report.status !== 'completed') {
            console.log(`[${client.business_name}] 분석 리포트 미완료로 건너뜁니다.`);
            continue;
        }

        console.log(`[${client.business_name}] 콘텐츠 생성 및 포스팅 시작...`);
        
        try {
            // 1. Gemini를 통한 맞춤형 콘텐츠 생성
            const content = await generateClientContent(client);

            // 2. 이미지 선정 (Central Assets 또는 AI 생성)
            const imageUrl = `https://alexchoi21.github.io/ChoiGPT_Assets/images/ai_marketing/1.png`; // 임시

            // 3. 사용자의 2nd 페이스북 채널에 홍보글 업로드
            console.log(`[${client.business_name}] 페이스북 홍보 페이지 업로드 중...`);
            await postToFacebook(MY_FB_PAGE_ID, MY_FB_ACCESS_TOKEN, imageUrl, content.fb_caption);

            // 4. 고객의 인스타그램 계정에 업로드 (토큰이 있는 경우)
            if (client.ig_user_id && client.ig_access_token) {
                console.log(`[${client.business_name}] 고객 인스타그램 업로드 중...`);
                await postToInstagram(client.ig_user_id, client.ig_access_token, imageUrl, content.ig_caption);
            } else {
                console.log(`[${client.business_name}] 고객 인스타그램 토큰 정보가 없어 건너뜁니다.`);
            }

            // 5. 마지막 포스팅 시간 업데이트
            await supabase
                .from('marketing_clients')
                .update({ last_posted_at: new Date().toISOString() })
                .eq('id', client.id);

        } catch (e) {
            console.error(`[${client.business_name}] 마케팅 실행 중 오류:`, e);
        }
    }
}

async function generateClientContent(client) {
    const prompt = `
        다음 업체에 대해 전문적인 마케팅 콘텐츠를 생성해줘.
        업체명: ${client.business_name}
        정보: ${client.business_info}
        상권 분석 요약: ${client.analysis_report.summary}
        방법론: ${client.marketing_methodology}
        
        [작성 규칙]
        1. 페이스북용(신뢰감, 비즈니스)과 인스타그램용(감성, 해시태그) 각각 작성.
        2. ${client.marketing_methodology} 방법론의 핵심 개념을 문구에 자연스럽게 녹여낼 것.
        3. 소비자에게 강력한 가치를 제안하고 클릭(CTA)을 유도할 것.
        
        JSON 형식으로 응답:
        { "fb_caption": "...", "ig_caption": "..." }
    `;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const data = await res.json();
    return JSON.parse(data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim());
}

async function postToFacebook(pageId, token, imageUrl, caption) {
    const res = await fetch(`https://graph.facebook.com/v20.0/${pageId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: imageUrl, caption: caption, access_token: token })
    });
    return await res.json();
}

async function postToInstagram(userId, token, imageUrl, caption) {
    // 1. 컨테이너 생성
    const containerRes = await fetch(`https://graph.facebook.com/v20.0/${userId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrl, caption: caption, access_token: token })
    });
    const containerData = await containerRes.json();
    
    // 2. 게시
    await fetch(`https://graph.facebook.com/v20.0/${userId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: containerData.id, access_token: token })
    });
}

runAutomation();
