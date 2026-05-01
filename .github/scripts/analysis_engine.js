const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // 관리자 권한 필수
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runAnalysis() {
    console.log('--- 상권 분석 엔진 가동 ---');

    // 분석 대기 중인 고객 호출
    const { data: clients, error } = await supabase
        .from('marketing_clients')
        .select('*')
        .eq('analysis_report->status', 'pending');

    if (error) {
        console.error('고객 로드 실패:', error);
        return;
    }

    if (!clients || clients.length === 0) {
        console.log('분석 대기 중인 고객이 없습니다.');
        return;
    }

    for (const client of clients) {
        console.log(`[${client.business_name}] 분석 시작...`);
        
        try {
            // 1. 온라인 현황 검색 (실제 구현시 Serper, Google Search API 등 활용)
            // 여기서는 검색어 조합 및 검색 결과 수집 로직 시뮬레이션
            const searchQuery = `${client.business_name} ${client.business_info || ''} 리뷰 인스타그램 홍보`;
            console.log(`검색어: ${searchQuery}`);
            
            // 시뮬레이션 데이터 (실제 API 연동 시 fetch 사용)
            const searchResults = `
                - 네이버 블로그 리뷰 약 50개 확인됨
                - 인스타그램 해시태그 게시물 100개 이상
                - 구글 맵 평점 4.5/5.0
                - 주변 경쟁 업체: 카페 A, 디저트샵 B
            `;

            // 2. Gemini를 통한 분석 보고서 생성
            const report = await generateGeminiReport(client, searchResults);

            // 3. Supabase 업데이트
            const { error: updateError } = await supabase
                .from('marketing_clients')
                .update({
                    analysis_report: {
                        status: 'completed',
                        ...report,
                        analyzed_at: new Date().toISOString()
                    }
                })
                .eq('id', client.id);

            if (updateError) throw updateError;
            console.log(`[${client.business_name}] 분석 완료 및 리포트 저장 성공`);

        } catch (e) {
            console.error(`[${client.business_name}] 분석 중 오류:`, e);
        }
    }
}

async function generateGeminiReport(client, searchData) {
    const prompt = `
        당신은 전문 마케팅 전략가입니다. 아래 업체에 대한 온라인 현황 데이터와 정보를 바탕으로 전문적인 상권 분석 리포트를 작성해주세요.
        
        [업체 정보]
        - 상호명: ${client.business_name}
        - 기본 정보: ${client.business_info}
        - 적용 방법론: ${client.marketing_methodology}
        
        [검색 데이터 시뮬레이션]
        ${searchData}
        
        다음 구조로 JSON 형식으로만 응답해주세요:
        {
            "stp": "STP(Segmentation, Targeting, Positioning) 분석 결과",
            "aida": "AIDA(Attention, Interest, Desire, Action) 단계별 전략",
            "swot": "SWOT(Strengths, Weaknesses, Opportunities, Threats) 분석",
            "four_p": "4P(Product, Price, Place, Promotion) 믹스 제안",
            "conclusion": "전체 마케팅 전략 한 줄 요약"
        }
    `;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const data = await res.json();
    if (!data.candidates || !data.candidates[0]) {
        throw new Error(`Gemini Error: ${JSON.stringify(data)}`);
    }
    const text = data.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error(`No JSON found in response: ${text}`);
    }
    return JSON.parse(jsonMatch[0]);
}

runAnalysis();
