(() => {
  const track=document.querySelector('#education-ticker-track');
  const list=document.querySelector('#education-live-posts');
  const status=document.querySelector('#education-news-status');
  if(!track&&!list)return;
  const endpoint='https://vzshvcvbhnvvpvarmzbq.supabase.co/functions/v1/education-news';
  const key='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6c2h2Y3ZiaG52dnB2YXJtemJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ5MDc1NTgsImV4cCI6MjExMDQ4MzU1OH0.doq3oaj0crYC_Swcl0CXVk5YnUC6u8-fsnJR-CgZvEQ';
  const official='https://t.me/s/Educationiq';
  const seed=[{"id":"35735","title":"ورشة لتحليل نتائج الاختبارات الوطنية في السليمانية","date":"2026-11-16T11:01:27Z","url":"https://t.me/Educationiq/35735"},{"id":"35716","title":"افتتاح بنايتين مدرسيتين في الموفقية بواسط","date":"2026-11-16T09:00:36Z","url":"https://t.me/Educationiq/35716"}];
  const localDate=new Intl.DateTimeFormat('ar-IQ',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Baghdad'});
  let lastItems='';
  let refreshing=false;
  function createLink(item){
    const link=document.createElement('a');
    link.href=item.url;
    link.target='_blank';
    link.rel='noopener noreferrer';
    link.textContent=item.title;
    return link;
  }
  function update(items){
    const signature=JSON.stringify(items);
    if(signature===lastItems)return;
    lastItems=signature;
    if(track){
      const set=document.createElement('div');
      set.className='education-ticker-set';
      items.forEach(item=>set.append(createLink(item)));
      const copy=set.cloneNode(true);
      copy.setAttribute('aria-hidden','true');
      copy.querySelectorAll('a').forEach(a=>{a.tabIndex=-1;});
      track.style.setProperty('--education-duration',Math.min(110,Math.max(26,items.reduce((n,item)=>n+item.title.length,0)/5))+'s');
      track.replaceChildren(set,copy);
    }
    if(list)list.replaceChildren(...items.map(item=>{
      const article=document.createElement('article');
      article.className='partner-panel format';
      const date=document.createElement('time');
      date.dateTime=item.date;
      date.textContent=localDate.format(new Date(item.date));
      const title=document.createElement('h3');
      title.append(createLink(item));
      article.append(date,title);
      return article;
    }));
  }
  async function refresh(){
    if(refreshing||document.hidden)return;
    refreshing=true;
    try{
      const response=await fetch(endpoint,{headers:{apikey:key,Authorization:'Bearer '+key},signal:AbortSignal.timeout(12000)});
      if(!response.ok)throw Error('News feed unavailable');
      const payload=await response.json();
      const items=payload.items.filter(item=>
        /^\d+$/.test(item.id)&&item.url==='https://t.me/Educationiq/'+item.id&&
        typeof item.title==='string'&&item.title.trim()&&Number.isFinite(Date.parse(item.date)));
      if(!items.length)throw Error('No official posts');
      update(items.slice(0,8));
      if(status)status.textContent=payload.stale?'تعذّر التحديث مؤقتاً. آخر المنشورات المتاحة معروضة أدناه.':
        'آخر فحص للقناة الرسمية: '+localDate.format(new Date(payload.checkedAt));
    }catch{
      if(status)status.textContent='تعذّر تحديث الأخبار مؤقتاً. افتح القناة الرسمية لآخر البيانات.';
      if(!lastItems)update(seed);
    }finally{refreshing=false;}
  }
  refresh();
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  setInterval(refresh,180000);
})();
