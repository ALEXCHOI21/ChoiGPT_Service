import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { clientId } = await req.json();
    
    // Initialize Supabase Client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Fetch Client Info
    const { data: client, error: fetchError } = await supabase
      .from("marketing_clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (fetchError || !client) throw new Error("Client not found");

    // 2. Mock AI Logic (Real AI would call Gemini here)
    // For '노블' (Noble Hair), we generate specific content
    const bizName = client.business_name;
    const bizInfo = client.business_info;

    let analysis;
    if (bizName.includes("노블")) {
      analysis = {
        status: "completed",
        stp: "<b>[Segmentation]</b> 대전 도마동 거주 남성, 탈모 초기 증상군, 1:1 맞춤 케어 선호자.<br><b>[Targeting]</b> 프라이버시를 중시하며 전문적인 두피 관리를 원하는 3050 남성 직장인.<br><b>[Positioning]</b> \"도마동 No.1 남성 특화 두피 클리닉 및 맞춤 시술 공간\".",
        aida: "<b>[Attention]</b> \"뒷모습이 달라집니다\" - 실제 비포/애프터 사진 활용 SNS 홍보.<br><b>[Interest]</b> 대표원장 1:1 직접 시술 및 프라이빗 룸 강조.<br><b>[Desire]</b> 탈모 관리 전후 만족도 리뷰 및 정기 관리 프로그램 제안.<br><b>[Action]</b> 첫 방문 두피 정밀 진단 무료 이벤트 및 네이버 예약 유도.",
        swot: "<b>[Strength]</b> 대표원장 1:1 책임 시술, 남성 탈모 특화 전문성.<br><b>[Weakness]</b> 100% 예약제로 인한 당일 방문 제한.<br><b>[Opportunity]</b> 인근 주거 밀집 지역의 잠재적 남성 고객층 두터움.<br><b>[Threat]</b> 대형 프랜차이즈 미용실의 저가 공세.",
        four_p: "<b>[Product]</b> 남성 전용 탈모 샴푸 바 및 두피 스케일링 패키지.<br><b>[Price]</b> 전문 시술 대비 합리적인 미들급 가격 책정.<br><b>[Place]</b> 도마동 주택가 중심의 높은 접근성 및 편안한 내부 인테리어.<br><b>[Promotion]</b> 당근마켓 지역 광고 및 입소문 마케팅.",
        conclusion: "노블은 남성 고객의 페인 포인트(탈모, 프라이버시)를 정확히 타격하는 전문성을 갖추고 있습니다. '원장 직접 시술'의 신뢰도를 바탕으로 지역 밀착형 충성 고객을 확보하는 것이 핵심 전략입니다."
      };
    } else {
      // Default Generic Logic
      analysis = {
        status: "completed",
        stp: "신규 업체 상권 분석 진행 완료.",
        aida: "지역 맞춤형 마케팅 시나리오 도출.",
        swot: "경쟁사 대비 강점 및 약점 분석.",
        four_p: "최적화된 서비스/가격/유통/촉진 전략 제안.",
        conclusion: "상기 분석을 바탕으로 24시간 자동 마케팅 엔진을 가동할 준비가 되었습니다."
      };
    }

    // 3. Update DB
    const { error: updateError } = await supabase
      .from("marketing_clients")
      .update({ 
        analysis_report: { ...analysis, timestamp: new Date().toISOString() }
      })
      .eq("id", clientId);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, report: analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
