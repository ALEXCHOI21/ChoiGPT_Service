$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " ChoiGPT Corp. 홍보 시스템 자동 정상화 시작 " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. 작업 디렉토리 설정
$workDir = Join-Path $PSScriptRoot "temp_migration"
if (Test-Path $workDir) { Remove-Item -Recurse -Force $workDir }
New-Item -ItemType Directory -Path $workDir | Out-Null

Set-Location $workDir

try {
    # 2. 저장소 클론
    Write-Host "1. 저장소 데이터를 불러오는 중..." -ForegroundColor Yellow
    git clone https://github.com/ALEXCHOI21/ChoiGPT_Marketing_Engine.git engine
    git clone https://github.com/ALEXCHOI21/ChoiGPT_Assets.git assets

    # 3. 이미지 자산 이동 (Private -> Public)
    Write-Host "2. 이미지 자산을 공개 저장소로 이동 중..." -ForegroundColor Yellow
    $srcImages = Join-Path $workDir "engine/.github/assets/images"
    $destImages = Join-Path $workDir "assets/images"

    if (Test-Path $srcImages) {
        if (-not (Test-Path $destImages)) { New-Item -ItemType Directory -Path $destImages | Out-Null }
        Copy-Item -Path "$srcImages\*" -Destination $destImages -Recurse -Force
        
        # 이동 후 기존 이미지 삭제 (보안 및 중복 방지)
        # Remove-Item -Recurse -Force $srcImages  # 일단 안전을 위해 주석 처리
    }

    # 4. 홍보 스크립트 업데이트
    Write-Host "3. 최신 홍보 로직(Math Engine 가중치 50%) 반영 중..." -ForegroundColor Yellow
    $scriptPath = Join-Path $workDir "engine/.github/scripts/daily_post.js"
    $updatedCode = @'
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();
const IG_USER_ID = (process.env.IG_USER_ID || '').trim();
const IG_ACCESS_TOKEN = (process.env.IG_ACCESS_TOKEN || '').trim();
const FB_PAGE_ID = (process.env.FB_PAGE_ID || '').trim();
const FB_ACCESS_TOKEN = (process.env.FB_ACCESS_TOKEN || '').trim();

const themes = [
  {
    topic: 'Antigravity Math Engine (LaTeX to PPT)',
    usp: 'PPT 최적화 고해상도 수식 제작 플랫폼, LaTeX 수식 실시간 투명 PNG 변환, 수능 및 수학 교육용 수식 라이브러리 탑재',
    weight: 50
  },
  {
    topic: '24시간 자율형 AI 마케팅 에이전트',
    usp: '사람보다 정교한 24/7 자동 포스팅 및 고객 응대, 실시간 상권 데이터 분석 기반 키워드 타격, 광고비 대비 도달률 300% 향상',
    weight: 20
  },
  {
    topic: 'AI 기반 HW/SW 고속 개발 서비스',
    usp: '업계 평균 대비 3배 빠른 프로토타이핑, AI 자동 PCB 라우팅으로 개발 기간 70% 단축, HW/SW 통합 솔루션 원스톱 제공',
    weight: 15
  },
  {
    topic: '생산성 10배 향상 AI 실무 워크숍',
    usp: '현업 즉시 적용 가능한 LLM 프롬프트 엔지니어링, 워크플로우 자동화 도구 마스터링, 기업별 맞춤형 AI 도입 컨설팅',
    weight: 3
  },
  {
    topic: '웹사이트 및 모바일 앱 개발 (Next.js/Flutter)',
    usp: 'Next.js 기반 초고속 반응형 웹 및 Flutter 하이브리드 앱 구축, SEO 자동 최적화, 매출 전환 중심의 UI/UX 설계',
    weight: 3
  }
];

async function validateImageUrl(imageUrl) {
  try {
    const res = await fetch(imageUrl, { method: 'HEAD' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('image')) throw new Error(`Invalid content type: ${contentType}`);
    return true;
  } catch (e) {
    console.error(`Image validation failed for ${imageUrl}:`, e.message);
    return false;
  }
}

function getWeightedRandomTheme() {
  const totalWeight = themes.reduce((sum, theme) => sum + theme.weight, 0);
  let random = Math.random() * totalWeight;
  for (const theme of themes) {
    if (random < theme.weight) return theme;
    random -= theme.weight;
  }
  return themes[0];
}

async function generateContent(selected) {
  const prompt = `스타트업 ChoiGPT 홍보를 위해 다음 주제에 대한 강력한 마케팅 콘텐츠를 생성해줘.
  주제: ${selected.topic}
  핵심 강점(USP): ${selected.usp}
  응답은 반드시 아래 JSON 형식으로만 출력해: { "ig_caption": "...", "fb_caption": "...", "imagePrompt": "..." }`;
  
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  const data = await res.json();
  const rawText = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
  return JSON.parse(rawText);
}

async function run() {
  const selected = getWeightedRandomTheme();
  const { ig_caption, fb_caption } = await generateContent(selected);
  
  const categoryMap = {
    'Antigravity Math Engine (LaTeX to PPT)': 'math_engine',
    '24시간 자율형 AI 마케팅 에이전트': 'ai_marketing',
    'AI 기반 HW/SW 고속 개발 서비스': 'hw_dev'
  };

  const category = categoryMap[selected.topic] || 'web_dev';
  const imgNum = Math.floor(Math.random() * 2) + 1; 
  const imageUrl = `https://raw.githubusercontent.com/ALEXCHOI21/ChoiGPT_Assets/main/images/${category}/${imgNum}.png`;
  
  const isValid = await validateImageUrl(imageUrl);
  if (!isValid) throw new Error(`Image URL inaccessible: ${imageUrl}`);

  const post = async (url, params) => {
    const formData = new FormData();
    for (const key in params) formData.append(key, params[key]);
    const res = await fetch(url, { method: 'POST', body: formData });
    const data = await res.json();
    if (data.error) throw new Error(JSON.stringify(data.error));
    return data;
  };

  const footer = '\n\n▶ 포털: https://alexchoi21.github.io/ChoiGPT_Service/\n● 문의: https://open.kakao.com/o/syhiQlsi';

  await post(`https://graph.facebook.com/v20.0/${IG_USER_ID}/media`, {
    image_url: imageUrl,
    caption: ig_caption + footer,
    access_token: IG_ACCESS_TOKEN
  });
  
  await post(`https://graph.facebook.com/v20.0/${FB_PAGE_ID}/photos`, {
    url: imageUrl,
    caption: fb_caption + footer,
    access_token: FB_ACCESS_TOKEN
  });
  
  console.log('SUCCESS: Posted to all channels.');
}

run().catch(e => { console.error(e); process.exit(1); });
'@
    $updatedCode | Out-File -FilePath $scriptPath -Encoding utf8

    # 5. 변경 사항 푸시
    Write-Host "4. 변경 사항을 깃허브에 저장 중..." -ForegroundColor Yellow
    
    Set-Location (Join-Path $workDir "assets")
    git add .
    git commit -m "Migrate image assets to public repository"
    git push

    Set-Location (Join-Path $workDir "engine")
    git add .
    git commit -m "Update daily_post script with Math Engine priority"
    git push

    Write-Host "`n[성공] 모든 작업이 완료되었습니다!" -ForegroundColor Green

} catch {
    Write-Host "`n[에러] 작업 중 오류가 발생했습니다: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    Set-Location $PSScriptRoot
    Write-Host "`n작업 폴더: $workDir" -ForegroundColor Gray
}

Write-Host "`n아무 키나 누르면 종료됩니다..." -ForegroundColor Gray
$null = [Console]::ReadKey()
