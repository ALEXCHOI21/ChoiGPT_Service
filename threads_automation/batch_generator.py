import os
import json
import datetime
import random
import time
from supabase import create_client, Client
from google import genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# ChoiGPT Cost-Control Protocol Settings
# Using gemini-2.0-flash for maximum cost-efficiency (Free Tier)
GEMINI_MODEL = "gemini-2.0-flash" 
MAX_POSTS_PER_BATCH = 5 # Reduced for more focused quality

# Initialize Clients
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase credentials missing in environment variables.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
client = genai.Client(api_key=GOOGLE_API_KEY)

SYSTEM_PROMPT = """
# [ChoiGPT Viral Strategy Layer]
- **Role**: You are a viral content creator on Threads. 
- **Voice**: Friendly, empathetic, and conversational. Use '반말' (casual) or soft '구어체' (spoken style) like a savvy tech friend.
- **Tone**: Human-like, slightly witty, avoiding corporate buzzwords.
- **Goal**: Engage users and naturally integrate affiliate products.

# [ChoiGPT Marketing Protocol]
- **Context**: You are promoting products from 'Naver Brand Connect Affiliate'. 
- **Guideline**: Do not just hard-sell. Provide a 'hook' (problem or trend) first, then suggest the product as a solution.
- **Language**: Korean (한국어). Use technical terms in English where appropriate for tech-savviness.

# [Technical Constraint]
- **Model**: gemini-2.0-flash
- **Length**: Each post MUST be under 400 characters.
- **Format**: Return ONLY a JSON list of objects: [{"topic": "...", "content": "..."}]
"""

def generate_daily_report(posts):
    """
    매일 작업 종료 시 고객에게 전달 가능한 수준의 '일일 개발 진척 보고서(Markdown)'를 자동 생성합니다.
    [user_global] 규칙 준수.
    """
    report_path = os.path.join(os.path.dirname(__file__), "DAILY_REPORT.md")
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    report_content = f"""# 💎 ChoiGPT Corp. 일일 마케팅 진척 보고서

> **생성 일시**: {now_str}
> **자동화 시스템**: Threads Marketing Engine V1.0 (gemini-2.0-flash)

## 📊 금일 콘텐츠 생성 요약
- **총 생성 포스트**: {len(posts)}개
- **적용 모델**: `{GEMINI_MODEL}` (Cost: 0원)
- **주요 주제**: {', '.join(set([p['topic'] for p in posts]))}

## 📝 생성된 콘텐츠 리스트 (예정)
| 번호 | 주제 | 콘텐츠 요약 | 예약 시간 |
| :--- | :--- | :--- | :--- |
"""
    for i, p in enumerate(posts):
        summary = p['content'][:30] + "..."
        report_content += f"| {i+1} | {p['topic']} | {summary} | {p['scheduled_at']} |\n"

    report_content += """
---
> **ChoiGPT 수석 전략가**: "금일 생성된 콘텐츠는 제휴 링크의 자연스러운 삽입과 바이럴 요소를 극대화하도록 설계되었습니다. n8n 스케줄러에 의해 지정된 시간에 순차적으로 게시됩니다."
"""
    
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report_content)
    print(f"Daily report generated at: {report_path}")

def generate_batch_content():
    print(f"[{datetime.datetime.now()}] Starting automated content generation...")
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            # 1. Get active topics and affiliate links from Supabase
            topics_res = supabase.table("topic_rotation").select("topic_name").eq("is_active", True).execute()
            links_res = supabase.table("affiliate_links").select("link_url, description").eq("is_active", True).execute()
            
            topics = [item['topic_name'] for item in topics_res.data] or ["AI News & Tech Trends"]
            links_info = links_res.data or []
            
            links_context = "\n".join([f"- Link: {l['link_url']} (Product: {l['description']})" for l in links_info])

            # 2. Call Gemini API
            prompt = f"""
            Generate {MAX_POSTS_PER_BATCH} viral Threads posts.
            Topics to cover: {', '.join(topics)}
            Available Affiliate Products:
            {links_context}
            
            Ensure each post naturally leads to one of the affiliate links if relevant.
            Return ONLY a JSON list.
            """
            
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config={
                    "system_instruction": SYSTEM_PROMPT,
                    "response_mime_type": "application/json"
                }
            )
            
            posts_data = json.loads(response.text)
            print(f"Successfully generated {len(posts_data)} posts.")

            # 3. Insert into Supabase
            now = datetime.datetime.now(datetime.timezone.utc)
            to_insert = []
            
            for i, post in enumerate(posts_data):
                # Schedule posts with intervals (e.g., every 3 hours starting from now)
                scheduled_time = now + datetime.timedelta(hours=i*3)
                
                # Extract link if AI included it in content, or pick one
                content = post.get("content", "")
                assigned_link = None
                for l in links_info:
                    if l['link_url'] in content:
                        assigned_link = l['link_url']
                        break
                
                if not assigned_link and links_info:
                    assigned_link = random.choice(links_info)['link_url']

                to_insert.append({
                    "topic": post.get("topic", "Tech Insight"),
                    "content": content,
                    "affiliate_link": assigned_link,
                    "status": "generated",
                    "scheduled_at": scheduled_time.isoformat()
                })
                
            if to_insert:
                supabase.table("thread_contents").insert(to_insert).execute()
                print(f"Successfully inserted {len(to_insert)} posts into Supabase.")
                # Generate Report
                generate_daily_report(to_insert)
            
            return # Success, break the retry loop
            
        except Exception as e:
            if "429" in str(e) and attempt < max_retries - 1:
                wait_time = (2 ** attempt) + random.random() + 30 # Base 30s for free tier
                print(f"Rate limit hit (429). Retrying in {wait_time:.2f}s... (Attempt {attempt + 1}/{max_retries})")
                time.sleep(wait_time)
                continue
            
            print(f"CRITICAL ERROR: {e}")
            raise

if __name__ == "__main__":
    generate_batch_content()
