// ChoiGPT B2B Platform - Dashboard Controller v2.0
// Standardized for Obsidian Sentinel Design System

const SUPABASE_URL = 'https://bxtrfsjcxknmbopctvaw.supabase.co';
let SUPABASE_KEY = localStorage.getItem('CHOIGPT_SUPABASE_KEY');
if (!SUPABASE_KEY) {
    SUPABASE_KEY = prompt('Supabase API Key가 설정되지 않았습니다. 키를 입력해 주세요:');
    if (SUPABASE_KEY) {
        localStorage.setItem('CHOIGPT_SUPABASE_KEY', SUPABASE_KEY.trim());
    }
}
SUPABASE_KEY = SUPABASE_KEY ? SUPABASE_KEY.trim() : '';

// Initialize Supabase client correctly
const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Security: Temporary Base64 encoding for passwords (Server-side vaulting recommended)
const secureEncode = (text) => btoa(unescape(encodeURIComponent(text)));

document.addEventListener('DOMContentLoaded', () => {
    console.log("Mission Control Initialized...");
    loadClients();

    const clientForm = document.getElementById('client-form');
    if (clientForm) {
        clientForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleClientRegistration();
        });
    }
});

/**
 * Handle Client Registration
 * Atomically creates client and triggers market analysis
 */
async function handleClientRegistration() {
    const clientForm = document.getElementById('client-form');
    const submitBtn = clientForm.querySelector('button[type="submit"]');
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="pulse">데이터 동기화 중...</span>';

    const business_name = document.getElementById('business_name').value;
    const business_info = document.getElementById('business_info').value;
    const ig_username = document.getElementById('ig_username').value;
    const ig_password = document.getElementById('ig_password').value;
    const marketing_methodology = document.getElementById('marketing_methodology').value;
    const service_type = document.getElementById('service_type').value;
    const contract_period = service_type === 'automation_full' ? document.getElementById('contract_period').value : 'N/A (분석 전용)';

    const newClient = {
        business_name,
        business_info,
        ig_username: ig_username || null,
        ig_password: ig_password ? secureEncode(ig_password) : null,
        marketing_methodology,
        contract_period,
        analysis_report: { 
            status: 'pending', 
            service_type,
            message: 'AI가 상권 인텔리전스를 수집하고 있습니다.',
            timestamp: new Date().toISOString()
        }
    };

    try {
        const { data, error } = await _supabase
            .from('marketing_clients')
            .insert([newClient])
            .select();

        if (error) throw error;

        showNotification('시스템 등록 완료', `${business_name} 데이터베이스가 활성화되었습니다.`);
        clientForm.reset();
        toggleContractPeriod(); // Reset UI state
        await loadClients();
        
        // Trigger Market Intelligence Engine
        triggerMarketAnalysis(data[0].id);

    } catch (error) {
        console.error('Registration Error:', error);
        showNotification('시스템 오류', error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '데이터베이스 등록 및 상권 분석 개시';
    }
}

/**
 * UI State Controller
 */
function toggleContractPeriod() {
    const serviceType = document.getElementById('service_type').value;
    const periodGroup = document.getElementById('contract_period_group');
    if (serviceType === 'automation_full') {
        periodGroup.style.display = 'block';
        periodGroup.classList.add('animate-up');
    } else {
        periodGroup.style.display = 'none';
    }
}

/**
 * Load Client List (Organism Factory)
 */
async function loadClients() {
    const clientList = document.getElementById('client-list');
    
    const { data: clients, error } = await _supabase
        .from('marketing_clients')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        clientList.innerHTML = `<div class="glass-card" style="border-color: var(--system-purple);">시스템 링크 오류: ${error.message}</div>`;
        return;
    }

    if (!clients || clients.length === 0) {
        clientList.innerHTML = '<div class="glass-card" style="text-align: center; color: var(--text-muted);">연결된 클라이언트가 없습니다.</div>';
        return;
    }

    clientList.innerHTML = clients.map(client => `
        <article class="client-card animate-up">
            <span class="status-badge ${client.analysis_report.status === 'pending' ? 'status-analyzing' : 'status-active'}">
                ${client.analysis_report.status === 'pending' ? 'ANALYZING' : 'ACTIVE'}
            </span>
            <header>
                <h3 class="h3" style="margin-bottom: 8px;">${client.business_name}</h3>
                <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 24px;">
                    ${client.ig_username || 'SNS 미연동'} | ${client.marketing_methodology} | <span style="color: var(--neon-cyan)">${client.contract_period || '상권 분석'}</span>
                </p>
            </header>
            <div class="card-body">
                <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.5; margin-bottom: 32px;">
                    ${client.business_info ? client.business_info.substring(0, 80) + '...' : '정보가 등록되지 않았습니다.'}
                </p>
            </div>
            <footer>
                <button onclick="viewReport('${client.id}')" class="btn-secondary">인텔리전스 리포트</button>
            </footer>
        </article>
    `).join('');
}

/**
 * Enhanced View Report with Auto-Trigger
 */
async function viewReport(clientId) {
    const { data: client, error } = await _supabase
        .from('marketing_clients')
        .select('*')
        .eq('id', clientId)
        .single();

    if (error || !client) return;

    const modal = document.getElementById('report-modal');
    const content = document.getElementById('report-content');
    const title = document.getElementById('modal-title');

    title.textContent = `${client.business_name} | 마켓 인텔리전스`;
    modal.style.display = 'block';

    if (client.analysis_report.status === 'pending') {
        content.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div class="pulse" style="font-size: 1.2rem; color: var(--neon-cyan); margin-bottom: 16px;">AI 통합 마케팅 엔진 가동 중...</div>
                <p style="color: var(--text-muted); margin-bottom: 24px;">실시간으로 상권 데이터와 트렌드를 분석하여 4대 프레임워크를 수립하고 있습니다.</p>
                <div class="framework-status" style="display: flex; justify-content: center; gap: 10px;">
                    <span class="status-badge" style="background: rgba(0,255,240,0.1);">STP</span>
                    <span class="status-badge" style="background: rgba(0,255,240,0.1);">AIDA</span>
                    <span class="status-badge" style="background: rgba(255,200,0,0.1);">SWOT</span>
                    <span class="status-badge" style="background: rgba(0,200,255,0.1);">4P MIX</span>
                </div>
            </div>
        `;

        // 분석 완료 후 즉시 모달 갱신
        triggerMarketAnalysis(clientId).then(() => {
            viewReport(clientId);
        });

    } else {
        const report = client.analysis_report;
        content.innerHTML = `
            <div class="report-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                <section class="glass-card" style="padding: 1.5rem; border-color: rgba(0,255,240,0.2);">
                    <h4 style="color: var(--neon-cyan); font-size: 0.75rem; letter-spacing: 0.1em; margin-bottom: 12px;">01. STP 전략</h4>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">
                        ${report.stp || '분석 데이터를 구성 중입니다.'}
                    </div>
                </section>
                <section class="glass-card" style="padding: 1.5rem; border-color: rgba(255,100,255,0.2);">
                    <h4 style="color: #ff64ff; font-size: 0.75rem; letter-spacing: 0.1em; margin-bottom: 12px;">02. AIDA 모델</h4>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">
                        ${report.aida || '콘텐츠 유입 시나리오 분석 중...'}
                    </div>
                </section>
                <section class="glass-card" style="padding: 1.5rem; border-color: rgba(255,200,0,0.2);">
                    <h4 style="color: #ffc800; font-size: 0.75rem; letter-spacing: 0.1em; margin-bottom: 12px;">03. SWOT 분석</h4>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">
                        ${report.swot || '강점 및 위협 요인 도출 중...'}
                    </div>
                </section>
                <section class="glass-card" style="padding: 1.5rem; border-color: rgba(0,200,255,0.2);">
                    <h4 style="color: #00c8ff; font-size: 0.75rem; letter-spacing: 0.1em; margin-bottom: 12px;">04. 4P 마케팅 믹스</h4>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">
                        ${report.four_p || '채널 및 가격 전략 수립 중...'}
                    </div>
                </section>
            </div>
            <div style="margin-top: 24px; padding: 16px; background: rgba(255,255,255,0.02); border-radius: 4px;">
                <h4 style="color: var(--neon-cyan); font-size: 0.8rem; margin-bottom: 8px;">마켓 인텔리전스 결론</h4>
                <p style="font-size: 0.9rem; color: var(--text-primary);">${report.conclusion || '통합 분석 리포트를 확인해 주십시오.'}</p>
            </div>
        `;
    }

    const closeBtn = document.querySelector('.close-modal');
    closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target == modal) modal.style.display = 'none';
    }
}

/**
 * Market Analysis Trigger
 * Edge Function 우회 → Gemini API 직접 호출 방식으로 변경
 */
async function triggerMarketAnalysis(clientId) {
    console.log(`[마켓 인텔리전스] 분석 시작: ${clientId}`);

    try {
        // 1. 클라이언트 정보 조회
        const { data: client, error: fetchError } = await _supabase
            .from('marketing_clients')
            .select('*')
            .eq('id', clientId)
            .single();

        if (fetchError || !client) throw new Error('클라이언트 정보를 불러오지 못했습니다.');

        console.log(`[마켓 인텔리전스] ${client.business_name} 분석 중...`);

        // [보안] 하드코딩된 키 제거: 로컬 스토리지에서 로드
        let GEMINI_KEY = localStorage.getItem('CHOIGPT_GEMINI_KEY');
        if (!GEMINI_KEY) {
            GEMINI_KEY = prompt('Gemini API Key가 설정되지 않았습니다.\n새로 발급받으신 키를 입력해 주세요:');
            if (GEMINI_KEY) {
                localStorage.setItem('CHOIGPT_GEMINI_KEY', GEMINI_KEY.trim());
            } else {
                throw new Error('API 키 입력 없이는 분석을 진행할 수 없습니다.');
            }
        }
        GEMINI_KEY = GEMINI_KEY.trim();
        const geminiPrompt = `당신은 대한민국 최고의 마케팅 전략가입니다. 아래 업체에 대해 실제 시장 분석을 수행하고, 구체적이고 실행 가능한 전략을 수립해 주세요.

[업체 정보]
- 상호명: ${client.business_name}
- 기본 정보: ${client.business_info || '정보 없음'}
- 적용 방법론: ${client.marketing_methodology || 'STP, AIDA, SWOT, 4P 통합 분석'}

[분석 요구사항]
- 해당 업체의 실제 특성을 반영하여 구체적으로 작성해주세요.
- 한국어로 작성하며, HTML 태그(<b>, <br>)를 활용하여 가독성 있게 구성하세요.

아래 JSON 형식으로만 응답해주세요 (마크다운 코드 블록 없이 순수 JSON만):
{
  "stp": "<b>[Segmentation]</b> (구체적인 고객 세분화)<br><b>[Targeting]</b> (핵심 타겟 고객층 설명)<br><b>[Positioning]</b> (차별화 포지셔닝 전략)",
  "aida": "<b>[Attention]</b> (주목을 끄는 훅 전략)<br><b>[Interest]</b> (관심 유발 방법)<br><b>[Desire]</b> (구매 욕구 촉진 방법)<br><b>[Action]</b> (구체적인 CTA 전략)",
  "swot": "<b>[Strength]</b> (내부 강점 2-3가지)<br><b>[Weakness]</b> (내부 약점 1-2가지)<br><b>[Opportunity]</b> (외부 기회 요인)<br><b>[Threat]</b> (외부 위협 요인)",
  "four_p": "<b>[Product]</b> (차별화된 서비스/상품 전략)<br><b>[Price]</b> (가격 전략)<br><b>[Place]</b> (입지/유통 전략)<br><b>[Promotion]</b> (구체적인 홍보 채널 및 방법)",
  "conclusion": "해당 업체의 핵심 성공 전략을 한 문장으로 요약"
}`;

        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: geminiPrompt }] }],
                    generationConfig: { temperature: 0.7 }
                })
            }
        );

        if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            if (geminiRes.status === 400 || geminiRes.status === 401) {
                localStorage.removeItem('CHOIGPT_GEMINI_KEY');
                console.warn('[Security] Invalid Gemini Key removed from localStorage');
            }
            throw new Error(`Gemini API 오류 (${geminiRes.status}): ${errText}`);
        }

        const geminiData = await geminiRes.json();

        if (!geminiData.candidates || !geminiData.candidates[0]) {
            throw new Error(`Gemini 응답 없음: ${JSON.stringify(geminiData)}`);
        }

        const rawText = geminiData.candidates[0].content.parts[0].text
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

        let parsedReport;
        try {
            parsedReport = JSON.parse(rawText);
        } catch (e) {
            throw new Error(`JSON 파싱 실패. 원문: ${rawText.substring(0, 300)}`);
        }

        // 3. Supabase에 분석 결과 저장
        const analysis = {
            status: 'completed',
            stp: parsedReport.stp,
            aida: parsedReport.aida,
            swot: parsedReport.swot,
            four_p: parsedReport.four_p,
            conclusion: parsedReport.conclusion,
            timestamp: new Date().toISOString()
        };

        const { error: updateError } = await _supabase
            .from('marketing_clients')
            .update({ analysis_report: analysis })
            .eq('id', clientId);

        if (updateError) throw new Error('DB 저장 실패: ' + updateError.message);

        console.log(`[마켓 인텔리전스] ${client.business_name} 분석 완료!`);
        await loadClients();
        return analysis;

    } catch (error) {
        console.error('[마켓 인텔리전스] 오류:', error.message);
        showNotification('분석 오류', error.message, 'error');
    }
}

/**
 * UI Utilities
 */
function showNotification(title, message, type = 'success') {
    alert(`${title}\n${message}`);
}

/**
 * Reset API Keys
 */
function resetKeys() {
    if (confirm('모든 API 키를 초기화하시겠습니까?\n다음 접속 시 키를 다시 입력해야 합니다.')) {
        localStorage.removeItem('CHOIGPT_SUPABASE_KEY');
        localStorage.removeItem('CHOIGPT_GEMINI_KEY');
        alert('키가 초기화되었습니다. 페이지를 새로고침합니다.');
        location.reload();
    }
}

