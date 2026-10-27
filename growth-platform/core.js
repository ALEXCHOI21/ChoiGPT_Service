export function validateProfile(p) {
 const v={}; for(const k of ['name','description','region','address','contact','website','sample']) v[k]=String(p[k]||'').trim();
 if(!v.name||v.name.length>100||v.description.length<10||v.description.length>3000||v.sample.length>5000) throw Error('업체명과 설명(10~3000자)을 확인하세요.');
 v.keywords=[...new Set((Array.isArray(p.keywords)?p.keywords:[]).map(x=>String(x).trim()).filter(Boolean))];
 if(!v.keywords.length||v.keywords.length>10||v.keywords.some(x=>x.length>40)) throw Error('키워드는 1~10개, 각 40자 이내입니다.');
 if(v.website){const u=new URL(v.website);if(u.protocol!=='https:'||u.username||u.password)throw Error('홈페이지는 HTTPS 주소를 입력하세요.');}
 for(const k of ['region','address','contact'])if(v[k].length>200)throw Error('입력 길이를 확인하세요.');
 return v;
}
export function similarity(a,b){const grams=s=>{s=s.replace(/\s+/g,'');return new Set(Array.from({length:Math.max(0,s.length-2)},(_,i)=>s.slice(i,i+3)));};const x=grams(a),y=grams(b);if(!x.size&&!y.size)return a===b?1:0;return [...x].filter(g=>y.has(g)).length/Math.max(1,new Set([...x,...y]).size);}
export function generate(p,history=[]) {
 p=validateProfile(p);const facts=(p.sample||p.description).split(/\n+|(?<=[.!?。])\s+/).map(x=>x.trim()).filter(Boolean);
 const results=[];const openings=[k=>`${k}, 어떤 곳을 찾고 계신가요?`,k=>`${k} 상담 전에 확인해 보세요.`,k=>`${p.region?p.region+'에서 ':''}${k} 알아보고 계신다면`,k=>`${p.name}에서 안내드립니다: ${k}`];
 for(let i=0;i<4;i++)for(let n=0;n<p.keywords.length;n++) {
  const keyword=p.keywords[n],terms=keyword.toLowerCase().split(/\s+/).filter(t=>t.length>=2);
  const score=f=>terms.reduce((sum,t)=>sum+(f.toLowerCase().includes(t)?t.length:0),0);
  const ranked=[...facts].sort((a,b)=>score(b)-score(a));const fact=score(ranked[0])>0?ranked[0]:p.description;
  const parts=[openings[i](keyword),fact,`업체: ${p.name}`,p.region?`활동 지역: ${p.region}`:'',p.contact?`문의: ${p.contact}`:'',p.website?trackedUrl(p.website):''].filter(Boolean);
  const body=parts.join('\n\n');if([...body].length>500)continue;
  if([...history,...results.map(x=>x.body)].some(t=>similarity(t,body)>.88))continue;
  results.push({body,keyword,angle:['질문','상담 안내','지역 안내','업체 소개'][i]});
 }
 return results;
}
export function trackedUrl(url){const u=new URL(url);u.searchParams.set('utm_source','threads');u.searchParams.set('utm_medium','organic_social');u.searchParams.set('utm_campaign','choigpt_platform');return u.href;}
export const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function businessPage(p,canonical=''){
 p=validateProfile(p);const e=escapeHtml;const schema={'@context':'https://schema.org','@type':'Organization',name:p.name,description:p.description,...(p.website?{url:p.website}:{}),...(p.address?{address:p.address}:{})};
 const faqs=[['어떤 서비스를 제공하나요?',p.description],['어느 지역에서 상담할 수 있나요?',p.region||'상담 시 확인해 주세요.'],['문의는 어떻게 하나요?',p.contact||'업체 홈페이지를 확인해 주세요.']];
 return `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(p.name)} | ${e(p.keywords[0])}</title><meta name="description" content="${e(p.description.slice(0,160))}">${canonical?`<link rel="canonical" href="${e(canonical)}">`:''}<script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script><style>body{max-width:760px;margin:60px auto;padding:24px;color:#152f34;font:18px/1.8 system-ui}h1{font-size:40px}a{color:#126c60}section{border-top:1px solid #ddd;margin-top:32px;padding-top:20px}</style><main><p>${e(p.region)}</p><h1>${e(p.name)}</h1><p>${e(p.description)}</p><section><h2>업체 정보</h2><p>주소: ${e(p.address||'상담 시 안내')}</p><p>문의: ${e(p.contact||'홈페이지 확인')}</p>${p.website?`<a href="${e(p.website)}">공식 홈페이지 방문</a>`:''}</section><section><h2>자주 묻는 질문</h2>${faqs.map(([q,a])=>`<h3>${e(q)}</h3><p>${e(a)}</p>`).join('')}</section></main></html>`;
}
