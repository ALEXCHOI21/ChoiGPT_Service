const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://bxtrfsjcxknmbopctvaw.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4dHJmc2pjeGtubWJvcGN0dmF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTIyMDM1MCwiZXhwIjoyMDg2Nzk2MzUwfQ.qt8B3P0guptrPFaU1QOPcH3HmL2lh7kbeYZAY-jRd2o';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAjMvMcbg-CtVuz3iJN89dga_95pT2711A';
const MY_FB_PAGE_ID = process.env.FB_PAGE_ID_2ND; 
const MY_FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN_2ND;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runAutomation() {
    console.log('--- 클라이언트 마케팅 자동화 엔진 가동 (V2: 필터링 및 지능형 매칭 적용) ---');

    // 1. 홍보가 허용된(is_promoted=true) 활성 고객 리스트 호출
    const { data: clients, error } = await supabase
        .from('marketing_clients')
        .select('*')
        .eq('is_promoted', true);

    if (error) {
        console.error('고객 로드 실패:', error);
        return;
    }

    if (clients.length === 0) {
        console.log('홍보 대상 고객이 없습니다. 작업을 종료합니다.');
        return;
    }

    for (const client of clients) {
        // 분석 리포트가 완료된 고객만 진행
        if (!client.analysis_report || client.analysis_report.status !== 'completed') {
            console.log(`[${client.business_name}] 분석 리포트 미완료로 건너뜁니다.`);
            continue;
        }

        console.log(`[${client.business_name}] 콘텐츠 생성 및 포스팅 시작...`);
        
        try {
            // 2. Gemini를 통한 맞춤형 콘텐츠 생성 (전문 용어 배제 프롬프트 적용)
            const content = await generateClientContent(client);

            // 3. 업종별 지능형 이미지 선정
            const imageUrl = getCategoryImage(client.business_category);
            console.log(`[${client.business_name}] 이미지 매칭 완료: ${imageUrl}`);

            // 4. 사용자의 2nd 페이스북 채널(포트폴리오) 업로드
            console.log(`[${client.business_name}] 페이스북 홍보 페이지 업로드 중...`);
            await postToFacebook(MY_FB_PAGE_ID, MY_FB_ACCESS_TOKEN, imageUrl, content.fb_caption);

            // 5. 고객 본인의 인스타그램 계정에 업로드 (토큰이 있는 경우만)
            if (client.ig_user_id && client.ig_access_token) {
                console.log(`[${client.business_name}] 고객 인스타그램 업로드 중...`);
                await postToInstagram(client.ig_user_id, client.ig_access_token, imageUrl, content.ig_caption);
            }

            // 6. 마지막 포스팅 시간 업데이트
            await supabase
                .from('marketing_clients')
                .update({ last_posted_at: new Date().toISOString() })
                .eq('id', client.id);

        } catch (e) {
            console.error(`[${client.business_name}] 마케팅 실행 중 오류:`, e);
        }
    }
}

function getCategoryImage(category) {
    // 업종별 이미지 매칭 로직 (ChoiGPT_Assets 기반)
    const categoryMap = {
        'hair_salon': 'hair_salon',
        'restaurant': 'restaurant',
        'cafe': 'cafe',
        'education': 'education',
        'it_service': 'ai_marketing'
    };
    
    const mappedFolder = categoryMap[category] || 'ai_marketing';
    // 각 폴더당 최소 1~2개 이상의 이미지가 있다고 가정 (추후 에셋 확장에 따라 숫자 조정 가능)
    const imgNum = Math.floor(Math.random() * 2) + 1; 
    return `https://alexchoi21.github.io/ChoiGPT_Assets/images/${mappedFolder}/${imgNum}.png`;
}

async function generateClientContent(client) {
    const prompt = `
        다음 업체의 소비자 타겟 홍보 문구를 작성해줘.
        업체명: ${client.business_name}
        업종: ${client.business_category || '전문 서비스'}
        정보: ${client.business_info}
        상권 분석 결과: ${JSON.stringify(client.analysis_report.summary)}
        
        [절대 규칙]
        1. 본문에 STP, AIDA, SWOT, 4P와 같은 마케팅 전문 용어를 절대 직접 노출하지 말 것. 
        2. 소비자 입장에서 읽었을 때 '가보고 싶다'는 느낌이 들도록 혜택(Value) 위주로 작성할 것.
        3. 신뢰감 있는 정보(위치, 특징 등)를 포함하여 팩트 체크가 된 것처럼 보이게 할 것.
        4. 이모지를 적절히 섞어 가독성을 높일 것.
        
        JSON 형식으로만 응답:
        { "fb_caption": "페이스북용 문구", "ig_caption": "인스타그램용 문구 + 해시태그" }
    `;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const data = await res.json();
    if (!data.candidates || !data.candidates[0]) {
        throw new Error(`Gemini Error: ${JSON.stringify(data)}`);
    }
    const text = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
    return JSON.parse(text);
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
    const containerRes = await fetch(`https://graph.facebook.com/v20.0/${userId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrl, caption: caption, access_token: token })
    });
    const containerData = await containerRes.json();
    if (containerData.id) {
        await fetch(`https://graph.facebook.com/v20.0/${userId}/media_publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ creation_id: containerData.id, access_token: token })
        });
    }
}

runAutomation();
