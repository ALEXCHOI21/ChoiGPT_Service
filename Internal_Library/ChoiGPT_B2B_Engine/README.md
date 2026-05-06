# ChoiGPT B2B Marketing Engine - Internal Library

본 라이브러리는 **ChoiGPT Corp.**의 핵심 B2B 마케팅 자동화 자산입니다.
특정 플랫폼에 종속되지 않는 범용 아키텍처를 따르며, 새로운 프로젝트에 즉시 이식 가능합니다.

## 📂 모듈 구성
1. **`analysis_engine.js`**: 
   - Gemini 2.5 Flash 기반의 지능형 상권 분석 엔진.
   - STP, AIDA, SWOT, 4P 분석 리포트 자동 생성.
2. **`client_automation.js`**:
   - 분석 데이터를 바탕으로 한 SNS(Facebook, Instagram) 자동 포스팅 엔진.
   - 타겟 맞춤형 후킹 문구 생성 및 채널별 최적화 게시.
3. **`dashboard.js`**:
   - 클라이언트 관리 및 마케팅 실적 모니터링용 웹 대시보드 로직.

## 🚀 빠른 시작 (Quick Start)
1. 새로운 프로젝트에 `Internal_Library/ChoiGPT_B2B_Engine` 폴더를 복사합니다.
2. Supabase에 `marketing_clients` 테이블을 생성합니다. (표준 SQL 스키마 준수)
3. GitHub Secrets에 API 키(`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)를 설정합니다.
4. `.github/workflows/`에 자동화 스케줄을 등록합니다.

## 🛠 기술 스택
- **Language**: Node.js 18+ / Vanilla JS
- **AI**: Google Gemini 2.5 Flash (v1beta API)
- **DB**: Supabase (PostgreSQL)
- **Interface**: RESTful API (Facebook Graph API)

---
**Created by Antigravity for ChoiGPT Corp.**
