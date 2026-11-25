'use strict';
const BASE='https://vzshvcvbhnvvpvarmzbq.supabase.co';
const API=BASE+'/functions/v1/education-library';
const PUBLIC='sb_publishable_yxgGfu00bTgNcy0q_mBnPw_0pYm7lYf';
const $=id=>document.getElementById(id);
const nf=new Intl.NumberFormat('ar-IQ');
let token='',role='',tab='stats',draft=null,revision=0,selected=null,dirty=false,stats=null,generation=0;
const channelNames={google_play:'Google Play',huawei:'Huawei',galaxy:'Samsung Galaxy Store',amazon:'Amazon',xiaomi:'Xiaomi GetApps',oppo:'OPPO',vivo:'VIVO',website:'نسخة الموقع',other:'غير معروف أو متجر آخر'};
const featureNames={library:'المكتبة',pdf:'قراءة PDF',lessons:'الشروحات',tutor:'المدرس',messages:'الرسائل',quiz:'الاختبارات'};
const field=(f,n)=>f.elements.namedItem(n);
const text=(tag,value)=>{const e=document.createElement(tag);e.textContent=value??'';return e;};
const notice=value=>{$('status').textContent=value;};
function row(values){const tr=document.createElement('tr');for(const value of values)tr.append(text('td',value));return tr;}
function card(label,value){const e=text('div');e.className='card';e.append(text('span',label),text('b',nf.format(value)));return e;}
function action(label,fn){const e=text('button',label);e.type='button';e.addEventListener('click',fn);return e;}
async function request(path,body,options={}){
 const auth=options.auth??true;
 const h={'content-type':'application/json'};if(auth&&token)h.Authorization='Bearer '+token;
 if(options.supabase)h.apikey=PUBLIC;
 const r=await fetch((options.supabase?BASE:API)+path,{method:body===undefined?'GET':'POST',headers:h,body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(25000)});
 const data=await r.json().catch(()=>({}));
 if(!r.ok){if(r.status===401&&auth)lock();throw Error(r.status===409?'تغيرت المسودة على الخادم. أعد تحميلها قبل الحفظ.':r.status===403?'حسابك لا يملك صلاحية هذه العملية.':data.error==='invalid_campaign'?'راجع حقول الرعاية والرابط ووقت البداية والنهاية.':'تعذّر إتمام الطلب ('+r.status+').');}
 return data;
}
function lock(){generation++;token='';draft=null;revision=0;selected=null;dirty=false;$('dashboard').hidden=true;$('gate').hidden=false;for(const id of ['message-list','rating-list','rating-comments','sponsor-list','sponsor-daily','channels','features','stat-cards','audit','content-list'])$(id).replaceChildren();$('catalog-json').value='';$('content-value').value='';$('message-form').reset();$('sponsor-form').reset();}
async function safe(fn){try{await fn();}catch(e){notice(e.message||'تعذّر الاتصال. حاول مجدداً.');}}
async function refreshStats(){
 const session=generation;const data=await request('/v1/admin/dashboard');if(session!==generation)return;stats=data;role=data.role;
 const channels=Object.entries(data.channels??{});const sum=key=>channels.reduce((total,[,n])=>total+Number(n[key]||0),0);
 $('stat-cards').replaceChildren(card('أول تشغيل مسجل',sum('firstOpenTotal')),card('نشط خلال 24 ساعة',sum('active24h')),card('أول تشغيل خلال 24 ساعة',sum('firstOpen24h')));
 $('channels').replaceChildren(...channels.map(([key,n])=>row([channelNames[key]||key,nf.format(n.firstOpenTotal),nf.format(n.firstOpen24h),nf.format(n.active24h)])));
 $('features').replaceChildren(...Object.entries(data.features24h??{}).map(([key,n])=>card(featureNames[key]||key,n)));
 $('message-list').replaceChildren(...(data.messages??[]).map(m=>{
  const div=text('div');div.className='row-item';div.append(text('h3',m.title),text('p',m.body),text('p','فتح الرسالة: '+nf.format(data.reads?.[m.id]??0)+' تثبيت مشارك · '+(m.published?'منشورة':'مسودة أو مؤرشفة')));
  if(role==='owner')div.append(action('تعديل',()=>{const f=$('message-form');for(const key of ['id','title','body'])field(f,key).value=m[key];field(f,'published').checked=m.published;f.scrollIntoView({behavior:'smooth'});}),action(m.published?'أرشفة':'نشر',()=>safe(async()=>{if(!confirm('تأكيد '+(m.published?'أرشفة':'نشر')+' هذه الرسالة؟'))return;await request('/v1/admin/messages',{id:m.id,published:!m.published});await refreshStats();notice('تم تحديث الرسالة.');})));
  return div;
 }));
 for(const id of ['catalog-publish','sponsors-enabled'])$(id).disabled=role!=='owner';
 for(const f of ['message-form','sponsor-form'])for(const el of $(f).elements)el.disabled=role!=='owner';
}
async function refreshRatings(){
 if(role!=='owner'){notice('تقارير التقييمات متاحة للمالك.');return;}
 const session=generation;const data=await request('/v1/admin/ratings');if(session!==generation)return;
 $('rating-list').replaceChildren(...data.items.map(r=>row([r.title,nf.format(r.average),nf.format(r.rating_count),nf.format(r.app),nf.format(r.website)])));
 $('rating-comments').replaceChildren(...data.comments.map(c=>{const div=text('div');div.className='row-item';div.append(text('strong',c.title),text('p',nf.format(c.rating)+' / ٥ · '+(c.source==='app'?'التطبيق':'الموقع')),text('p',c.suggestion));return div;}));
 if(!data.items.length)$('rating-list').append(row(['لا توجد تقييمات بعد','','','','']));
}
const localDate=iso=>new Date(new Date(iso).getTime()+3*3600000).toISOString().slice(0,16);
async function refreshSponsors(){
 if(role!=='owner'){notice('الرعايات والتقارير المالية متاحة للمالك.');return;}
 const session=generation;const data=await request('/v1/admin/sponsors');if(session!==generation)return;
 $('sponsors-enabled').checked=Boolean(data.settings?.enabled);
 const labels={draft:'مسودة',approved:'معتمدة',active:'نشطة',paused:'موقوفة',expired:'منتهية'};
 $('sponsor-list').replaceChildren(...data.campaigns.map(c=>{const div=text('div');div.className='row-item';const state=Date.parse(c.ends_at)<=Date.now()?'منتهية':labels[c.status];div.append(text('h3',c.institution+' — '+c.title),text('p',state+' · '+nf.format(c.agreed_iqd)+' دينار · مراجعة '+nf.format(c.revision)),action('تعديل الحملة',()=>{const f=$('sponsor-form');for(const key of ['id','revision','institution','title','body','url','image_url','status','agreed_iqd'])field(f,key).value=c[key];for(const key of ['starts_at','ends_at'])field(f,key).value=localDate(c[key]);field(f,'reviewed').checked=false;f.scrollIntoView({behavior:'smooth'});}));return div;}));
 $('sponsor-daily').replaceChildren(...data.daily.map(d=>row([d.day,data.campaigns.find(c=>c.id===d.campaign)?.title||d.campaign,d.platform==='app'?'التطبيق':'الموقع',nf.format(d.views),nf.format(d.clicks)])));
}
function contentList(){
 if(!draft)return;const section=$('content-section').value;const query=$('content-search').value.trim();selected=null;$('content-value').value='';
 const matches=draft[section].map((value,index)=>({value,index})).filter(({value})=>!query||JSON.stringify(value).includes(query));
 $('content-list').replaceChildren(...matches.slice(0,100).map(({value,index})=>action((value.title||value.id||'عنصر')+' · '+(value.grade||''),()=>{selected={section,index};$('content-value').value=JSON.stringify(value,null,2);})));$('catalog-info').textContent='مراجعة '+revision+' · '+matches.length+' عنصر مطابق · تظهر أول 100 نتيجة';
}
function paintDraft(){contentList();$('catalog-json').value=JSON.stringify(draft,null,2);}
async function refreshCatalog(){
 if(dirty)return;const session=generation;const data=await request('/v1/admin/catalog');if(session!==generation)return;draft=data.draft;revision=data.revision;paintDraft();
 $('audit').replaceChildren(...data.audit.map(x=>text('p',x.at+' · '+x.action)));
}
async function refresh(){await refreshStats();if(tab==='ratings')await refreshRatings();if(tab==='sponsors')await refreshSponsors();if(tab==='catalog')await refreshCatalog();}
$('login').addEventListener('submit',e=>{e.preventDefault();safe(async()=>{const f=e.currentTarget;const submit=f.querySelector('button');submit.disabled=true;try{notice('جارٍ التحقق من الحساب…');const session=await request('/auth/v1/token?grant_type=password',{email:field(f,'email').value,password:field(f,'password').value},{supabase:true,auth:false});token=session.access_token;generation++;await refreshStats();$('gate').hidden=true;$('dashboard').hidden=false;f.reset();notice('تم تسجيل الدخول.');}catch(err){lock();throw err;}finally{submit.disabled=false;}});});
$('logout').onclick=()=>{const old=token;lock();if(old)fetch(BASE+'/auth/v1/logout?scope=local',{method:'POST',headers:{apikey:PUBLIC,Authorization:'Bearer '+old}}).catch(()=>{});notice('تم تسجيل الخروج.');};
for(const b of document.querySelectorAll('[data-tab]'))b.onclick=()=>safe(async()=>{tab=b.dataset.tab;for(const section of document.querySelectorAll('.tab'))section.hidden=section.id!==tab;await refresh();});
$('refresh').onclick=()=>safe(refresh);
$('message-form').onsubmit=e=>{e.preventDefault();safe(async()=>{const f=e.currentTarget;const data={title:field(f,'title').value,body:field(f,'body').value,published:field(f,'published').checked};if(field(f,'id').value)data.id=Number(field(f,'id').value);if(data.published&&!confirm('تأكيد نشر الرسالة في التطبيق؟'))return;await request('/v1/admin/messages',data);f.reset();await refreshStats();notice('تم حفظ الرسالة.');});};
$('message-new').onclick=()=>$('message-form').reset();
$('sponsor-new').onclick=()=>$('sponsor-form').reset();
$('sponsor-form').onsubmit=e=>{e.preventDefault();safe(async()=>{const f=e.currentTarget;const d={};for(const key of ['institution','title','body','url','image_url','status'])d[key]=field(f,key).value;for(const key of ['starts_at','ends_at'])d[key]=new Date(field(f,key).value+':00+03:00').toISOString();d.agreed_iqd=Number(field(f,'agreed_iqd').value);d.reviewed=field(f,'reviewed').checked;d.placement='adult_sponsors';if(field(f,'id').value){d.id=field(f,'id').value;d.revision=Number(field(f,'revision').value);}if(!confirm('تأكيد حفظ هذه النسخة من الحملة؟'))return;await request('/v1/admin/sponsors',d);f.reset();await refreshSponsors();notice('تم حفظ الحملة.');});};
$('sponsors-enabled').onchange=e=>safe(async()=>{const value=e.target.checked;e.target.checked=!value;if(!confirm(value?'تفعيل عرض الحملات المعتمدة النشطة؟':'إيقاف عرض جميع الرعايات؟'))return;await request('/v1/admin/sponsors/settings',{enabled:value});e.target.checked=value;notice('تم تحديث مفتاح عرض الرعايات.');});
$('content-section').onchange=contentList;$('content-search').oninput=contentList;
$('content-new').onclick=()=>{if(!draft)return;const section=$('content-section').value;selected={section,index:'new'};const id=crypto.randomUUID().replaceAll('-','').slice(0,24);const value=section==='resources'?{id,grade:1,subject:'math',type:'book',format:'source',title:'',url:'https://'}:section==='lessons'?{id,grade:1,subject:'math',chapter:'',title:'',url:'https://',body:[],videos:[],questions:[]}: {title:'',text:'',date:new Date().toISOString().slice(0,10),url:'https://'};$('content-value').value=JSON.stringify(value,null,2);};
$('content-edit').onsubmit=e=>{e.preventDefault();safe(async()=>{if(!selected)throw Error('اختر عنصراً أولاً.');const value=JSON.parse($('content-value').value);if(selected.index==='new')draft[selected.section].push(value);else draft[selected.section][selected.index]=value;dirty=true;paintDraft();notice('تم تعديل المسودة محلياً. احفظها على الخادم.');});};
$('content-delete').onclick=()=>{if(!selected||selected.index==='new'||!confirm('إزالة العنصر من المسودة المحلية؟'))return;draft[selected.section].splice(selected.index,1);dirty=true;paintDraft();};
$('catalog-import').onclick=()=>safe(async()=>{draft=JSON.parse($('catalog-json').value);if(!Array.isArray(draft.resources)||!Array.isArray(draft.lessons)||!Array.isArray(draft.news))throw Error('مخطط JSON غير صالح.');dirty=true;paintDraft();notice('تم تحميل JSON محلياً. سيتحقق الخادم منه عند الحفظ.');});
async function saveCatalog(publish){if(!draft)return;if(publish&&!confirm('نشر هذه المسودة لجميع مستخدمي التطبيق؟'))return;const saved=await request('/v1/admin/catalog',{revision,draft,publish});revision=saved.revision;dirty=false;await refreshCatalog();notice(publish?'تم نشر الفهرس.':'تم حفظ المسودة على الخادم.');}
$('catalog-save').onclick=()=>safe(()=>saveCatalog(false));$('catalog-publish').onclick=()=>safe(()=>saveCatalog(true));
function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
$('catalog-export').onclick=()=>{if(draft)download('study-library-catalog.json',JSON.stringify(draft,null,2),'application/json');};
$('export-stats').onclick=()=>{if(!stats)return;const escape=v=>'"'+String(v).replaceAll('"','""').replace(/^[=+@-]/,"'$&")+'"';const rows=[['source','first_open','first_open_24h','active_24h'],...Object.entries(stats.channels).map(([k,v])=>[k,v.firstOpenTotal,v.firstOpen24h,v.active24h])];download('study-library-activity.csv','\uFEFF'+rows.map(r=>r.map(escape).join(',')).join('\r\n'),'text/csv');};
setInterval(()=>{if(token&&!document.hidden&&['stats','messages'].includes(tab))safe(refreshStats);},30000);
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
