(() => {
  'use strict';
  const nf = new Intl.NumberFormat('ar-IQ',{maximumFractionDigits:2});
  const labels = {book:'كتاب',notes:'ملزمة أو ملخص',exams:'أسئلة وزارية',lesson:'شرح'};
  const make = (tag,txt) => { const el=document.createElement(tag); if(txt!==undefined)el.textContent=txt;return el; };
  async function rpc(name,body){
    const res=await fetch(TAHA_METRICS.endpoint+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:TAHA_METRICS.publicKey,'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'});
    if(!res.ok)throw new Error('HTTP '+res.status);
    return res.json();
  }
  async function resourceId(parts){
    const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(parts)));
    return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
  }
  function visitorId(){
    const key='taha-resource-rating-visitor-v1';
    try{
      let id=localStorage.getItem(key);
      if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id||'')){id=crypto.randomUUID();localStorage.setItem(key,id);}
      return id;
    }catch{throw new Error('Storage unavailable');}
  }
  function mount(root,parts){
    if(!root)return;
    root.replaceChildren();root.className='resource-rating';
    const heading=make('h3','قيّم هذا '+(labels[parts[1]]||'المرجع'));
    const summary=make('p','جارٍ جلب التقييمات…');summary.className='resource-rating-summary';summary.setAttribute('role','status');
    const form=make('form');const field=make('fieldset');const legend=make('legend','اختر من ١ إلى ٥ نجوم');field.append(legend);
    const stars=make('div');stars.className='resource-stars';
    const radios=[];
    for(let i=1;i<=5;i++){
      const label=make('label');const input=make('input');input.type='radio';input.name='rating';input.value=String(i);input.required=true;input.setAttribute('aria-label',i+' من 5');
      const star=make('span','★');star.setAttribute('aria-hidden','true');label.append(input,star);stars.append(label);radios.push(input);
    }
    const noteLabel=make('label','ملاحظة للإدارة (اختياري، دون معلومات شخصية)');noteLabel.className='resource-note';
    const note=make('textarea');note.maxLength=300;note.rows=2;note.placeholder='مثلاً: الملف ناقص أو الشرح واضح';noteLabel.append(note);
    const send=make('button','إرسال التقييم');send.type='submit';send.className='resource-send';
    const status=make('p','');status.setAttribute('role','status');
    const privacy=make('small','نحفظ معرّفاً عشوائياً للمتصفح عند إرسال تقييمك لمنع تكراره من نفس المتصفح. الملاحظات تظهر للإدارة فقط.');
    field.append(stars,noteLabel,send,privacy);form.append(field,status);root.append(heading,summary,form);
    field.disabled=true;
    let id;
    const paint=()=>{const v=Number(form.elements.rating.value);radios.forEach(r=>r.parentElement.classList.toggle('active',Number(r.value)<=v));};
    form.addEventListener('change',paint);
    function show(data){summary.textContent=data.count?('★ '+nf.format(data.average)+' / ٥ · '+nf.format(data.count)+' تقييم'):'لا توجد تقييمات بعد — كن أول من يقيّم.';}
    resourceId(parts).then(async value=>{id=value;try{show(await rpc('taha_resource_rating_summary',{p_resource:id}));}catch{summary.textContent='تعذّر جلب التقييمات حالياً.';}finally{field.disabled=false;}}).catch(()=>{summary.textContent='التقييم غير متاح في هذا المتصفح.';});
    form.addEventListener('submit',async ev=>{
      ev.preventDefault();if(!id||!form.elements.rating.value)return;
      field.disabled=true;status.textContent='جارٍ حفظ التقييم…';
      try{
        const result=await rpc('taha_resource_rating_submit',{p_resource:id,p_visitor:visitorId(),p_rating:Number(form.elements.rating.value),p_source:'website',p_suggestion:note.value.trim()});
        show(result);status.textContent='تم حفظ تقييمك. يمكنك تعديله لاحقاً.';note.value='';
      }catch{status.textContent='لم يُحفظ التقييم. حاول مجدداً أو تأكد من إتاحة تخزين المتصفح.';}
      finally{field.disabled=false;}
    });
  }
  window.TahaResourceRatings={mount,resourceId,mountBook(root,e){mount(root,[String(e.grade),e.type,e.subject||'',e.title||'',e.url||'']);}};
})();
