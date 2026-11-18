(() => {
 if(window.__tahaAnalytics) return; window.__tahaAnalytics=true;
 const privacy=()=>navigator.globalPrivacyControl||navigator.doNotTrack==='1';
 const testing=new URLSearchParams(location.search).get('analytics_test')==='1';
 let running=false,stopped=false,visitor,session;
 const uid=()=>crypto.randomUUID();
 const read=(k)=>{try{return JSON.parse(localStorage.getItem(k))}catch{return null}};
 const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
 const allowed=()=>!privacy()&&read('taha-analytics-consent')===true;
 function consentUI(){
  if(read('taha-analytics-consent')!==null||privacy()||testing)return;
  const box=document.createElement('aside');box.className='analytics-consent';box.setAttribute('aria-label','اختيار الخصوصية');
  const text=document.createElement('p');text.textContent='تسمح بإحصائيات الزيارة حتى نطوّر الموقع؟ نستخدم معرّف متصفح عشوائي وGoogle Analytics. تگدر ترفض وتستمر بالتصفح.';
  const link=document.createElement('a');link.href='privacy.html';link.textContent='سياسة الخصوصية';
  const choose=(value)=>{write('taha-analytics-consent',value);box.remove();if(value)start()};
  const yes=document.createElement('button');yes.textContent='أوافق على الإحصائيات';yes.onclick=()=>choose(true);
  const no=document.createElement('button');no.textContent='أرفض';no.onclick=()=>choose(false);
  box.append(text,link,yes,no);document.body.append(box);
 }
 function start(){
  if(running||privacy()||(!testing&&!allowed()))return;running=true;
  if(!testing){
   window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
   const safeUrl=new URL(location.origin+location.pathname);for(const k of ['utm_source','utm_medium','utm_campaign']){const v=new URLSearchParams(location.search).get(k);if(v)safeUrl.searchParams.set(k,v.slice(0,100))}let safeRef='';try{const r=new URL(document.referrer);safeRef=r.origin+r.pathname}catch{}window.gtag('js',new Date());window.gtag('config','G-3XWG1JH4VT',{page_location:safeUrl.href,page_referrer:safeRef});
   const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id=G-3XWG1JH4VT';document.head.append(script);
  }
  if(!crypto?.randomUUID||(navigator.webdriver&&!testing))return;
  let stored;try{stored=localStorage.getItem('taha-visitor-v1');if(stored?.startsWith('\"'))stored=JSON.parse(stored)}catch{}visitor=/^[0-9a-f-]{36}$/i.test(stored||'')?stored:uid();try{localStorage.setItem('taha-visitor-v1',visitor)}catch{}
  // Preserve the original visitor identifier if it predates JSON storage.
  const page=location.pathname.replace(/\/index\.html$/,'/');
  const incoming=TahaTraffic.classify(location.search,document.referrer,location.origin);
  const key=testing?'taha-session-test-v2':'taha-session-v2';
  function current(){
   const now=Date.now();let saved=read(key)||session;
   if(!saved||now-saved.last>1800000||now<saved.last||(!incoming.internal&&incoming.tagged&&(saved.campaign!==incoming.campaign||saved.source!==incoming.source||saved.medium!==incoming.medium))) {
    saved={id:uid(),last:now,...(incoming.internal?{source:'unknown',medium:'',campaign:''}:incoming)};
   }
   saved.last=now;write(key,saved);return saved;
  }
  session=current();
  function send(kind,title='',category='',meta={}){
   if(stopped||privacy()||(!testing&&!allowed()))return;
   session=current();
   const body={p_event:uid(),p_session:session.id,p_visitor:visitor,p_kind:kind,p_page:page,p_title:String(title).slice(0,180),p_category:category,p_grade:meta.grade||'',p_subject:meta.subject||'',p_source:session.source,p_medium:session.medium,p_campaign:session.campaign,p_test:testing};
   fetch(TAHA_METRICS.endpoint+'/rest/v1/rpc/taha_record_event_v2',{method:'POST',headers:{'Content-Type':'application/json',apikey:TAHA_METRICS.publicKey},body:JSON.stringify(body),keepalive:true}).catch(()=>{});
  }
  window.tahaRecordFile=(kind,title,category,meta={})=>{if(['pdf','download','section'].includes(kind)&&title)send(kind,title,category,meta)};
  let viewed=false;const view=()=>{if(!viewed&&!document.hidden){viewed=true;send('view',document.title)}};
  view();document.addEventListener('visibilitychange',view);
  setInterval(()=>{if(!document.hidden)send('active')},45000);
  document.addEventListener('click',e=>{
   const a=e.target.closest('[data-metric="download"]');
   if(a)window.tahaRecordFile('download',a.dataset.fileTitle||a.closest('article,section')?.querySelector('h2,h3')?.textContent?.trim()||a.textContent.trim(),'تطبيق أندرويد');
  });
  if(typeof IntersectionObserver!=='undefined'){
   const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){send('section',e.target.querySelector('h2,h3')?.textContent?.trim()||'تطبيق','تطبيق أندرويد');observer.unobserve(e.target)}},{threshold:.5});
   document.querySelectorAll('article').forEach(a=>{if(a.querySelector('[data-metric="download"]'))observer.observe(a)});
  }
 }
 window.addEventListener('storage',e=>{if(e.key==='taha-analytics-consent'&&e.newValue!=='true'){stopped=true;window['ga-disable-G-3XWG1JH4VT']=true}});
 if(testing||allowed())start();consentUI();
})()
