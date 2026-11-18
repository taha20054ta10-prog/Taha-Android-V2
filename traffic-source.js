/* Pure source classification, shared by tracker and tests. */
(function(root) {
 function classify(search, referrer, origin) {
  const q=new URLSearchParams(search), tagged=(q.get('utm_source')||'').trim().toLowerCase();
  let h='',internal=false; try {const u=new URL(referrer);h=u.hostname.toLowerCase();internal=u.origin===origin && u.pathname.startsWith('/Taha-Android-V2/')}catch{}
  const match=(host,domain)=>host===domain||host.endsWith('.'+domain);
  let source='unknown',medium='';
  const social={facebook:['facebook.com','fb.com','fb.me'],instagram:['instagram.com'],telegram:['t.me','telegram.org'],tiktok:['tiktok.com'],youtube:['youtube.com','youtu.be'],pinterest:['pinterest.com','pin.it']};
  if(tagged) {
   source=['google','bing','yahoo',...Object.keys(social)].includes(tagged)?tagged:'unknown';
   medium=(q.get('utm_medium')||'').slice(0,40);
  } else if(internal) return {internal:true};
  else if(!h) {source='direct';medium='(none)'}
  else {
   source='referral';medium='referral';
   for(const [s,domains] of Object.entries(social)) if(domains.some(d=>match(h,d))||(s==='pinterest'&&/(^|\.)pinterest\.(com|co\.uk|de|fr|es|it|ca|jp|com\.au|com\.mx|com\.br)$/.test(h))) {source=s;medium='social';break}
   if(/(^|\.)google\.(com|[a-z]{2}|com\.[a-z]{2}|co\.[a-z]{2})$/.test(h)) {source='google';medium='organic'}
   else if(match(h,'bing.com')) {source='bing';medium='organic'}
   else if(match(h,'yahoo.com')) {source='yahoo';medium='organic'}
   else if(['duckduckgo.com','yandex.com','yandex.ru','baidu.com','ecosia.org','search.brave.com'].some(d=>match(h,d))) {source='search';medium='organic'}
  }
  return {source,medium,campaign:(q.get('utm_campaign')||'').slice(0,100),internal:false,tagged:!!tagged};
 }
 root.TahaTraffic={classify};
 if(typeof module!=='undefined')module.exports=root.TahaTraffic;
})(typeof window!=='undefined'?window:globalThis);
