# [Manual] AI 자율형 마케팅 에이전트 셋팅 가이드

## 1. 서비스 정의
본 서비스는 Meta Graph API와 Google Gemini AI를 결합하여, 사용자의 개입 없이 24시간 자율적으로 컨텐츠를 생성하고 멀티 채널(Instagram, Facebook, Threads)에 홍보를 수행하는 솔루션입니다.

## 2. 셋팅 단계 (Setup Procedure)
1.  **Meta Developer 설정**: App 생성 및 비즈니스 권한(Content Publish) 확보.
2.  **계정 연결**: 인스타그램 비즈니스 계정 - 페이스북 페이지 - 쓰레드 계정 상호 연동.
3.  **토큰 발급**: 60일 장기 액세스 토큰 발급 및 보안 저장.
4.  **에이전트 설계**: Gemini API를 이용한 브랜드 맞춤형 페르소나 주입.
5.  **자동화 배포**: GitHub Actions를 이용한 스케줄링(Cron) 설정.

## 3. 수익 모델 (Pricing Model)
- **Standard (100만원)**: 인스타그램 단일 채널, 일 1회 포스팅, 고정 템플릿.
- **Premium (250만원)**: IG/FB/Threads 3개 채널, 일 12회(2시간 주기), Gemini AI 실시간 생성.
- **Enterprise (별도 협의)**: 다중 계정 관리, 이미지 생성 API 연동, 댓글 자동 응대 포함.

## 4. 노출 최적화 노하우 (Growth Hacks)
- **Time-Zone 전략**: 타겟 고객이 가장 활발한 시간대에 가중치를 두어 포스팅 주기 조절.
- **AI 필터링**: 생성된 문구 중 선정적이거나 브랜드 이미지를 해치는 단어를 필전링하는 'Safety Layer' 포함.
- **Engagement Loop**: 게시물 본문에 상담 링크(카카오톡) 및 웹사이트 링크를 전략적으로 배치하여 전환 유도.
