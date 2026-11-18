(() => {
 const $=id=>document.getElementById(id),nf=new Intl.NumberFormat('ar-IQ');
 const labels={google:'Google',facebook:'Facebook',instagram:'Instagram',telegram:'Telegram',tiktok:'TikTok',youtube:'YouTube',pinterest:'Pinterest',bing:'Bing',yahoo:'Yahoo',search:'محركات بحث أخرى',referral:'مواقع خارجية',direct:'مباشر — الإحالة غير متاحة',unknown:'غير معروف'};
 let token,epoch=0,busy=false,lastReport;
 const val=id=>$(id).value;
 const cell=v=>{const td=document.createElement('td');td.textContent=v??'—';return td};
 function table(id,rows){$(id).replaceChildren(...rows.map(values=>{const tr=document.createElement('tr');tr.append(...values.map(cell));return tr}));if(!rows.length){const tr=document.createElement('tr');const td=cell('لا توجد بيانات مسجلة للفلاتر المختارة');td.colSpan=10;tr.append(td);$(id).append(tr)}}
 const baghdad=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Baghdad',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const iso=d=>d.toISOString().slice(0,10);
 function dates(){if(val('report-period')==='custom')return;const today=new Date(baghdad()+'T12:00:00Z'),end=new Date(today),start=new Date(today);if(val('report-period')==='yesterday'){start.setUTCDate(start.getUTCDate()-1);end.setUTCDate(end.getUTCDate()-1)}else start.setUTCDate(start.getUTCDate()-Number(val('report-period'))+1);$('report-start').value=iso(start);$('report-end').value=iso(end)}
 for(const [value,text] of Object.entries(labels)){const o=document.createElement('option');o.value=value;o.textContent=text;$('report-source').append(o)}
 const pageNames={'/Taha-Android-V2/':'الرئيسية','/Taha-Android-V2/library.html':'المكتبة الدراسية'};
 const pages=['','library.html','education-news.html','sixth-scientific-notes.html','fourth-preparatory-exams.html','fifth-preparatory-exams.html','iraq-past-ministry-exams.html','download-plus-pro.html','privacy.html','ads.html'];
 for(const page of pages){const path='/Taha-Android-V2/'+page;const o=document.createElement('option');o.value=path;o.textContent=pageNames[path]||page;$('report-page').append(o)}
 for(const source of ['facebook','instagram','telegram','tiktok','youtube','pinterest','google']){
  const row=document.createElement('div');row.className='utm-row';const title=document.createElement('strong');title.textContent=labels[source];
  const input=document.createElement('input');input.readOnly=true;input.setAttribute('aria-label','رابط '+labels[source]);const url=new URL('https://taha20054ta10-prog.github.io/Taha-Android-V2/');url.search=new URLSearchParams({utm_source:source,utm_medium:source==='google'?'cpc':'social',utm_campaign:'site_promotion'});input.value=url.href;
  const copy=document.createElement('button');copy.type='button';copy.className='button ghost';copy.textContent='نسخ';copy.onclick=async()=>{try{await navigator.clipboard.writeText(input.value);$('report-copy-status').textContent='تم نسخ رابط '+labels[source]}catch{input.select();$('report-copy-status').textContent='حدد الرابط وانسخه يدوياً'}};row.append(title,input,copy);$('report-utm').append(row);
 }
 function render(data){
  lastReport=data;const summary={...data.summary,active:data.active};const names={visitors:'الزوار الفريدون تقريبياً',new_visitors:'متصفحات جديدة منذ بدء القياس',returning_visitors:'زوار سبق تسجيلهم قبل الفترة',sessions:'الجلسات',views:'مشاهدات الصفحات',pdf_opens:'ضغطات فتح PDF',downloads:'ضغطات التحميل',active:'نشطون خلال ٩٠ ثانية — حسب المنصة فقط'};
  $('report-summary').replaceChildren(...Object.entries(names).map(([k,v])=>{const a=document.createElement('article');a.className='partner-panel';const h=document.createElement('h2');h.textContent=v;const n=document.createElement('strong');n.textContent=nf.format(summary[k]);a.append(h,n);return a}));
  const total=data.summary.sessions;
  table('report-sources',Object.entries(labels).map(([source,label])=>{const r=data.sources.find(x=>x.source===source);return r?[label,nf.format(r.visitors),nf.format(r.sessions),nf.format(r.views),nf.format(total?r.sessions/total*100:0)+'٪']:[label,'لا توجد بيانات مسجلة','—','—','—']}));
  const max=Math.max(1,...data.sources.map(s=>s.sessions));$('report-source-chart').replaceChildren(...data.sources.map(s=>{const li=document.createElement('li'),span=document.createElement('span'),bar=document.createElement('progress'),n=document.createElement('span');span.textContent=labels[s.source]||s.source;bar.max=max;bar.value=s.sessions;bar.setAttribute('aria-label',span.textContent+' جلسات');n.textContent=nf.format(s.sessions);li.append(span,bar,n);return li}));$('report-top-source').textContent=data.sources.length?'أعلى مصدر حسب الجلسات: '+labels[data.sources[0].source]:'لا توجد بيانات مصادر مسجلة.';
  table('report-pages',data.pages.map(r=>[pageNames[r.page]||r.title||r.page,r.page,nf.format(r.views),nf.format(r.visitors)]));
  const files=[...data.files].sort((a,b)=>val('report-sort')==='date'?new Date(b.last_at)-new Date(a.last_at):(b.opens+b.downloads)-(a.opens+a.downloads));
  table('report-files',files.map(r=>[r.title,r.category,r.grade||'غير مسجل',r.subject||'غير مسجل',nf.format(r.opens),nf.format(r.downloads),new Date(r.last_at).toLocaleString('ar-IQ',{timeZone:'Asia/Baghdad'})]));
  table('report-apps',data.apps.map(r=>[r.title,labels[r.source],nf.format(r.views),nf.format(r.downloads)]));
  table('report-campaigns',data.campaigns.map(r=>[labels[r.source],r.medium||'—',r.campaign||'بدون حملة',nf.format(r.sessions),nf.format(r.views)]));
  const peak=Math.max(1,...data.daily.map(d=>d.views));$('report-daily').replaceChildren(...data.daily.map(d=>{const li=document.createElement('li'),t=document.createElement('time'),b=document.createElement('progress'),n=document.createElement('span');t.textContent=d.day;b.max=peak;b.value=d.views;b.setAttribute('aria-label','مشاهدات '+d.day);n.textContent=nf.format(d.views);li.append(t,b,n);return li}));
  $('report-comparison').textContent='المشاهدات: '+nf.format(data.summary.views)+' · الفترة السابقة المساوية: '+nf.format(data.previous_views)+(data.previous_views?' · التغيّر '+nf.format((data.summary.views-data.previous_views)/data.previous_views*100)+'٪':' · لا تتوفر قاعدة مقارنة سابقة');
  $('report-export').disabled=false;
 }
 async function refresh(){
  if(!token||busy)return;const e=epoch;const body={p_start:val('report-start'),p_end:val('report-end'),p_source:val('report-source'),p_page:val('report-page'),p_category:val('report-category'),p_test:$('report-test').checked};
  if(!body.p_start||!body.p_end||body.p_start>body.p_end){$('report-status').textContent='اختر فترة صحيحة.';return}
  busy=true;$('report-status').textContent='جارٍ تحميل البيانات الفعلية…';
  try{const r=await fetch(TAHA_METRICS.endpoint+'/rest/v1/rpc/taha_owner_report_v2',{method:'POST',headers:{'Content-Type':'application/json',apikey:TAHA_METRICS.publicKey,Authorization:'Bearer '+token},body:JSON.stringify(body),cache:'no-store'});if(!r.ok)throw new Error(String(r.status));const data=await r.json();if(e!==epoch)return;render(data);$('report-status').textContent=(body.p_test?'بيانات اختبار منفصلة · ':'')+'آخر تحديث '+new Date().toLocaleTimeString('ar-IQ',{timeZone:'Asia/Baghdad'})+' · تحديث كل ٣٠ ثانية.'}catch(error){if(e===epoch){lastReport=undefined;$('report-export').disabled=true;$('report-status').textContent='تعذّر تحديث البيانات ('+error.message+'). القيم المعروضة قديمة إن وجدت.'}}finally{busy=false;if(e!==epoch&&token)refresh()}
 }
 $('report-filters').addEventListener('submit',e=>{e.preventDefault();epoch++;refresh()});$('report-period').addEventListener('change',()=>{dates();epoch++;refresh()});
 for(const id of ['report-start','report-end'])$(id).addEventListener('change',()=>{$('report-period').value='custom'});
 $('report-sort').addEventListener('change',()=>{if(lastReport)render(lastReport)});
 const csvCell=v=>'"'+String(v??'').replace(/^[=+@\-\t\r]/,"'$&").replace(/"/g,'""')+'"';
 $('report-export').onclick=()=>{if(!lastReport||!token)return;const rows=[['التقرير','من','إلى',val('report-start'),val('report-end')],['القسم','البيانات']];for(const key of ['sources','pages','files','apps','campaigns','daily']){rows.push([key]);const list=lastReport[key];if(list.length){const headers=Object.keys(list[0]);rows.push(headers);rows.push(...list.map(r=>headers.map(k=>r[k])))}}const blob=new Blob(['\ufeff'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='taha-analytics-'+val('report-start')+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 dates();window.TahaOwnerReports={open(t){token=t;epoch++;refresh()},close(){token=undefined;epoch++;lastReport=undefined;for(const id of ['report-summary','report-sources','report-pages','report-files','report-apps','report-campaigns','report-daily','report-source-chart'])$(id).replaceChildren();$('report-status').textContent='';$('report-comparison').textContent='';$('report-top-source').textContent='';$('report-export').disabled=true}};
 setInterval(()=>{if(!document.hidden)refresh()},30000);
})()
