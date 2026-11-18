(() => {
  if (!window.crypto?.randomUUID || navigator.globalPrivacyControl || navigator.doNotTrack === '1' || navigator.webdriver) return
  const key = 'taha-visitor-v1'
  let visitor = crypto.randomUUID()
  try {
    const existing = localStorage.getItem(key)
    if (/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(existing || '')) visitor = existing
    else localStorage.setItem(key, visitor)
  } catch {
    // Continue with an ID scoped to this page if browser storage is unavailable.
  }

  window.tahaRecordFile = function(kind,title,category) {
    if (!['pdf','download'].includes(kind) || !title) return;
    fetch(TAHA_METRICS.endpoint + '/rest/v1/rpc/taha_record_file', {
      method:'POST', headers:{'Content-Type':'application/json',apikey:TAHA_METRICS.publicKey},
      body:JSON.stringify({p_visitor:visitor,p_kind:kind,p_title:String(title).slice(0,180),p_category:String(category||'أخرى').slice(0,40)}),
      keepalive:true
    }).catch(()=>{});
  };
  function recordSource() {
    const params = new URLSearchParams(location.search);
    const tagged = (params.get('utm_source') || '').toLowerCase();
    let host = '';
    try { host = new URL(document.referrer).hostname.toLowerCase(); } catch {}
    const name = tagged || host;
    let source = 'direct';
    if (/facebook|fb\.com|fb\.me/.test(name)) source = 'facebook';
    else if (/google\./.test(name)) source = 'google';
    else if (/telegram|t\.me/.test(name)) source = 'telegram';
    else if (/instagram/.test(name)) source = 'instagram';
    else if (/tiktok/.test(name)) source = 'tiktok';
    else if (/youtube|youtu\.be/.test(name)) source = 'youtube';
    else if (/pinterest|pin\.it/.test(name)) source = 'pinterest';
    else if (name) source = 'other';
    fetch(TAHA_METRICS.endpoint + '/rest/v1/rpc/taha_record_source', {
      method:'POST',headers:{'Content-Type':'application/json',apikey:TAHA_METRICS.publicKey},
      body:JSON.stringify({p_visitor:visitor,p_source:source}),keepalive:true
    }).catch(()=>{});
  }
  function record(event) {
    fetch(TAHA_METRICS.endpoint + '/rest/v1/rpc/taha_record_visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: TAHA_METRICS.publicKey },
      body: JSON.stringify({ p_visitor: visitor, p_event: event }),
      keepalive: true
    }).catch(() => {})
  }

  if (!document.hidden) { record('view'); recordSource() }
  else document.addEventListener('visibilitychange', () => { if (!document.hidden) record('view') }, { once: true })
  setInterval(() => { if (!document.hidden) record('active') }, 45000)
  document.addEventListener('click', event => {
    const control = event.target.closest('[data-metric]')
    if (control) { record(control.dataset.metric); if (control.dataset.metric === 'download') window.tahaRecordFile?.('download',control.dataset.fileTitle || control.closest('article,section')?.querySelector('h2,h3')?.textContent?.trim() || control.textContent.trim(),'تطبيق أندرويد'); }
  })
})()
