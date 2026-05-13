-- Threads Automation Database Schema
-- ChoiGPT Corp. Strategic Asset

-- 1. 콘텐츠 저장소 (생성된 포스트 보관)
CREATE TABLE IF NOT EXISTS public.thread_contents (
    id BIGSERIAL PRIMARY KEY,
    topic TEXT NOT NULL,
    content TEXT NOT NULL,
    affiliate_link TEXT, -- 추가: 수익화 링크
    status TEXT DEFAULT 'generated', -- 'generated', 'posted', 'failed'
    scheduled_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 수익화 링크 관리 (Coupang Partners 등)
CREATE TABLE IF NOT EXISTS public.affiliate_links (
    id SERIAL PRIMARY KEY,
    link_url TEXT NOT NULL,
    description TEXT,
    category TEXT, -- ai, general, tech 등
    is_active BOOLEAN DEFAULT TRUE,
    click_count INTEGER DEFAULT 0
);

-- 3. 주제 로테이션 (매일 생성할 주제 목록)
CREATE TABLE IF NOT EXISTS public.topic_rotation (
    id SERIAL PRIMARY KEY,
    topic_name TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0
);

-- 4. 포스팅 히스토리 (n8n 실행 로그)
CREATE TABLE IF NOT EXISTS public.posting_history (
    id BIGSERIAL PRIMARY KEY,
    content_id BIGINT REFERENCES public.thread_contents(id),
    status TEXT NOT NULL,
    error_message TEXT,
    posted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 주제 데이터 삽입
INSERT INTO public.topic_rotation (topic_name, priority)
VALUES 
    ('AI News & Trends', 1),
    ('Semiconductor Industry', 2),
    ('Digital Marketing Strategy', 3),
    ('ChoiGPT Corp. Service Info', 4)
ON CONFLICT (topic_name) DO NOTHING;
