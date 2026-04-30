const SUPABASE_URL = 'https://bxtrfsjcxknmbopctvaw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4dHJmc2pjeGtubWJvcGN0dmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjAzNTAsImV4cCI6MjA4Njc5NjM1MH0.T95GvNYbpVU7um3WW2eyqikgWDn-dwsQ3zPxTM4rfhM';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 간단한 인코딩 (보안을 위해 실제 운영시에는 서버 사이드 암호화 권장)
const secureEncode = (text) => btoa(text); // 임시 Base64 처리

document.addEventListener('DOMContentLoaded', () => {
    loadClients();

    const clientForm = document.getElementById('client-form');
    if (clientForm) {
        clientForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = clientForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = '등록 및 분석 대기 중...';

            const newClient = {
                business_name: document.getElementById('business_name').value,
                business_info: document.getElementById('business_info').value,
                ig_username: document.getElementById('ig_username').value,
                ig_password: secureEncode(document.getElementById('ig_password').value),
                marketing_methodology: document.getElementById('marketing_methodology').value,
                analysis_report: { status: 'pending', message: '상권 분석이 예약되었습니다.' }
            };

            const { data, error } = await supabase
                .from('marketing_clients')
                .insert([newClient]);

            if (error) {
                alert('등록 실패: ' + error.message);
            } else {
                alert('고객 등록 완료! 상권 분석 및 자동화가 시작됩니다.');
                clientForm.reset();
                loadClients();
            }
            submitBtn.disabled = false;
            submitBtn.textContent = '고객 등록 및 상권 분석 시작';
        });
    }
});

async function loadClients() {
    const clientList = document.getElementById('client-list');
    const { data: clients, error } = await supabase
        .from('marketing_clients')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        clientList.innerHTML = `<p class="error">데이터 로드 실패: ${error.message}</p>`;
        return;
    }

    if (clients.length === 0) {
        clientList.innerHTML = '<p class="text-dim">등록된 고객이 없습니다.</p>';
        return;
    }

    clientList.innerHTML = clients.map(client => `
        <div class="client-card animate-up">
            <span class="status-badge ${client.analysis_report.status === 'pending' ? 'status-analyzing' : 'status-active'}">
                ${client.analysis_report.status === 'pending' ? '분석 중' : '활동 중'}
            </span>
            <h3>${client.business_name}</h3>
            <p class="text-dim" style="font-size: 0.9rem; margin-bottom: 1.5rem;">${client.business_info || '정보 없음'}</p>
            <div class="card-footer">
                <button onclick="viewReport('${client.id}')" class="btn-secondary" style="font-size: 0.8rem; padding: 0.5rem 1rem;">분석 리포트 보기</button>
            </div>
        </div>
    `).join('');
}

async function viewReport(clientId) {
    const { data: client, error } = await supabase
        .from('marketing_clients')
        .select('*')
        .eq('id', clientId)
        .single();

    if (error || !client) return;

    const modal = document.getElementById('report-modal');
    const content = document.getElementById('report-content');
    const title = document.getElementById('modal-title');

    title.textContent = `${client.business_name} 상권 분석 리포트`;
    
    if (client.analysis_report.status === 'pending') {
        content.innerHTML = `
            <div class="analyzing-state">
                <p>현재 AI가 온라인상의 홍보 현황과 주변 상권을 분석하고 있습니다.</p>
                <p>약 5~10분 후 리포트가 생성됩니다.</p>
            </div>
        `;
    } else {
        // 실제 분석 결과가 있을 경우 (마크다운 파싱 등 추가 가능)
        content.innerHTML = `
            <div class="report-section">
                <h4>1. 온라인 홍보 현황</h4>
                <p>${client.analysis_report.online_presence || '분석 진행 중...'}</p>
            </div>
            <div class="report-section">
                <h4>2. 주변 입지 및 경쟁사 분석</h4>
                <p>${client.analysis_report.location_analysis || '분석 진행 중...'}</p>
            </div>
            <div class="report-section">
                <h4>3. 마케팅 제언 (${client.marketing_methodology})</h4>
                <p>${client.analysis_report.suggestions || '분석 진행 중...'}</p>
            </div>
        `;
    }

    modal.style.display = 'block';

    const closeBtn = document.querySelector('.close-modal');
    closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target == modal) modal.style.display = 'none';
    }
}
