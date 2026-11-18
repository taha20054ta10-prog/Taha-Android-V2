(() => {
  const login = document.querySelector('#owner-login')
  const gate = document.querySelector('#owner-gate')
  const dashboard = document.querySelector('#owner-dashboard')
  const status = document.querySelector('#owner-status')
  const note = document.querySelector('#metrics-status')
  const range = document.querySelector('#metrics-range')
  const report = document.querySelector('#metrics-report')
  const nf = new Intl.NumberFormat('ar-IQ')
  const feedbackList = document.querySelector('#owner-feedback-list')
  const feedbackSummary = document.querySelector('#owner-feedback-summary')
  const feedbackButton = document.querySelector('#refresh-feedback')
  const feedbackDate = new Intl.DateTimeFormat('ar-IQ', {dateStyle:'medium', timeStyle:'short', timeZone:'Asia/Baghdad'})
  let accessToken
  let refreshing = false
  let generation = 0

  async function request(path, body, token) {
    const headers = { 'Content-Type': 'application/json', apikey: TAHA_METRICS.publicKey }
    if (token) headers.Authorization = 'Bearer ' + token
    const response = await fetch(TAHA_METRICS.endpoint + path, {
      method: 'POST', headers, body: JSON.stringify(body), cache: 'no-store'
    })
    if (!response.ok) throw new Error(String(response.status))
    return response.json()
  }

  function lock(message) {
    generation++
    window.TahaOwnerReports?.close()
    accessToken = undefined
    gate.hidden = false
    dashboard.hidden = true
    status.textContent = message
    report.replaceChildren()
    feedbackList.replaceChildren()
    feedbackSummary.textContent = ''
    dashboard.querySelectorAll('[data-stat]').forEach(node => { node.textContent = '—' })
  }

  function show(data) {
    dashboard.querySelectorAll('[data-stat]').forEach(node => {
      node.textContent = nf.format(data[node.dataset.stat])
    })
    const peak = Math.max(1, ...data.daily.map(day => day.views))
    const dateFormat = new Intl.DateTimeFormat('ar-IQ', { day: 'numeric', month: 'short', timeZone: 'UTC' })
    report.replaceChildren()
    for (const day of data.daily) {
      const row = document.createElement('li')
      const date = document.createElement('time')
      date.dateTime = day.day
      date.textContent = dateFormat.format(new Date(day.day + 'T12:00:00Z'))
      const bar = document.createElement('progress')
      bar.max = peak
      bar.value = day.views
      bar.setAttribute('aria-label', 'مشاهدات ' + date.textContent)
      const value = document.createElement('span')
      value.textContent = nf.format(day.views)
      row.append(date, bar, value)
      report.append(row)
    }
    note.textContent = 'آخر تحديث ' + new Intl.DateTimeFormat('ar-IQ', {
      hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Baghdad'
    }).format(new Date())
  }

  async function refreshFeedback() {
    if (!accessToken || feedbackButton.disabled) return
    feedbackButton.disabled = true
    feedbackSummary.textContent = 'جارٍ جلب الآراء…'
    const session = generation
    try {
      const data = await request('/rest/v1/rpc/taha_owner_feedback', {}, accessToken)
      if (session !== generation) return
      const average = data.average == null ? '—' : nf.format(data.average) + ' من ٥'
      feedbackSummary.textContent = 'متوسط التقييم: ' + average + ' · التقييمات: ' +
        nf.format(data.rating_count) + ' · الاقتراحات: ' + nf.format(data.suggestion_count)
      feedbackList.replaceChildren(...data.recent.map(entry => {
        const row = document.createElement('li')
        const stamp = document.createElement('small')
        const comment = document.createElement('p')
        stamp.textContent = feedbackDate.format(new Date(entry.updated_at)) +
          (entry.rating ? ' · ' + nf.format(entry.rating) + ' من ٥' : '')
        comment.textContent = entry.suggestion || 'تقييم بالنجوم'
        row.append(stamp, comment)
        return row
      }))
    } catch {
      if (session === generation) feedbackSummary.textContent = 'تعذّر تحميل الآراء. جرّب التحديث.'
    } finally {
      feedbackButton.disabled = false
    }
  }

  async function refreshSources() {
    if (!accessToken) return;
    const sourceGeneration=generation;
    const rows=document.querySelector('#owner-sources-rows');
    const note=document.querySelector('#owner-sources-status');
    const labels={facebook:'فيسبوك',google:'Google',telegram:'تيليجرام',instagram:'إنستغرام',tiktok:'تيك توك',youtube:'يوتيوب',pinterest:'Pinterest',direct:'دخول مباشر أو غير معروف',other:'مصدر آخر'};
    try {
      const data=await request('/rest/v1/rpc/taha_owner_sources',{p_days:Number(range.value)},accessToken);
      if(sourceGeneration!==generation)return;
      rows.replaceChildren();
      for(const item of data){
        const tr=document.createElement('tr');
        for(const value of [labels[item.source]||item.source,nf.format(item.views),nf.format(item.visitors)]){
          const td=document.createElement('td');
          td.textContent=value;td.style.padding='10px';tr.append(td);
        }
        rows.append(tr);
      }
      note.textContent=data.length?'المشاهدات حسب مصدر الوصول':'لا توجد بيانات مصادر زيارات بعد.';
    }catch{note.textContent='تعذّر تحميل مصادر الزيارات.'}
  }
  async function refreshFiles() {
    if (!accessToken) return;
    const sourceGeneration=generation;
    const rows=document.querySelector('#owner-files-rows'), note=document.querySelector('#owner-files-status');
    try {
      const data=await request('/rest/v1/rpc/taha_owner_files',{p_days:Number(range.value)},accessToken);
      if(sourceGeneration!==generation)return;
      rows.replaceChildren();
      for(const item of data){
        const tr=document.createElement('tr');
        for(const value of [item.title,item.category,nf.format(item.clicks)]){
          const td=document.createElement('td');td.textContent=value;td.style.padding='10px';tr.append(td);
        }rows.append(tr);
      }
      note.textContent=data.length?'آخر ١٠٠ ملف حسب عدد الضغطات':'لا توجد ضغطات مسجلة في الفترة المختارة.';
    }catch{note.textContent='تعذّر تحميل تفاصيل الملفات.'}
  }
  async function refresh() {
    if (!accessToken || refreshing) return
    refreshing = true
    const session = generation
    const days = Number(range.value)
    try {
      const data = await request('/rest/v1/rpc/taha_owner_metrics', { p_days: days }, accessToken)
      if (session === generation && days === Number(range.value)) show(data)
      if (session === generation) { refreshFiles(); refreshSources() }
    } catch (error) {
      if (session !== generation) return
      if (['401','403'].includes(error.message)) lock('انتهت الجلسة. سجّل دخولك من جديد.')
      else note.textContent = 'تعذّر تحديث الإحصائيات مؤقتاً.'
    } finally {
      refreshing = false
      if (accessToken && days !== Number(range.value)) refresh()
    }
  }

  login.addEventListener('submit', async event => {
    event.preventDefault()
    const submit = login.querySelector('button')
    submit.disabled = true
    status.textContent = 'جارٍ تسجيل الدخول…'
    try {
      const credentials = Object.fromEntries(new FormData(login))
      const session = await request('/auth/v1/token?grant_type=password', credentials)
      const data = await request('/rest/v1/rpc/taha_owner_metrics', { p_days: Number(range.value) }, session.access_token)
      generation++
      accessToken = session.access_token
      window.TahaOwnerReports?.open(accessToken)
      login.reset()
      show(data)
      gate.hidden = true
      dashboard.hidden = false
      document.querySelector('#owner-title').focus()
      refreshFeedback()
      refreshFiles()
      refreshSources()
    } catch {
      status.textContent = 'تعذّر تسجيل الدخول. تحقّق من حساب المالك وكلمة المرور.'
    } finally {
      submit.disabled = false
    }
  })
  document.querySelector('#owner-logout').addEventListener('click', () => {
    const token = accessToken
    if (token) request('/auth/v1/logout?scope=local', {}, token).catch(() => {})
    lock('تم تسجيل الخروج.')
    login.elements.email.focus()
  })
  feedbackButton.addEventListener('click', refreshFeedback)
  range.addEventListener('change', refresh)
  login.querySelector('fieldset').disabled = false
  setInterval(() => { if (!document.hidden) refresh() }, 20000)
})()

