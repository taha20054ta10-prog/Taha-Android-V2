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

  function record(event) {
    fetch(TAHA_METRICS.endpoint + '/rest/v1/rpc/taha_record_visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: TAHA_METRICS.publicKey },
      body: JSON.stringify({ p_visitor: visitor, p_event: event }),
      keepalive: true
    }).catch(() => {})
  }

  if (!document.hidden) record('view')
  else document.addEventListener('visibilitychange', () => { if (!document.hidden) record('view') }, { once: true })
  setInterval(() => { if (!document.hidden) record('active') }, 45000)
  document.addEventListener('click', event => {
    const control = event.target.closest('[data-metric]')
    if (control) record(control.dataset.metric)
  })
})()
