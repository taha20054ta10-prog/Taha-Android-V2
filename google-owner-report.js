(() => {
  const $ = id => document.getElementById(id);
  const config = window.TAHA_GOOGLE_REPORT;
  const scope = 'https://www.googleapis.com/auth/analytics.readonly';
  const nf = new Intl.NumberFormat('ar-IQ', {maximumFractionDigits: 2});
  let owner = false, accessToken, expiresAt = 0, client, busy = false, epoch = 0;
  const connect = $('google-connect'), note = $('google-report-status');
  const clear = () => {
    for (const id of ['google-summary', 'google-sources', 'google-pages', 'google-daily']) $(id).replaceChildren();
  };
  function table(id, headers, rows) {
    const el = $(id); el.replaceChildren();
    const head = document.createElement('tr');
    for (const title of headers) {const th = document.createElement('th'); th.textContent = title; head.append(th);}
    el.append(head);
    if (!rows.length) rows = [['لا توجد بيانات معالجة لهذه الفترة']];
    for (const values of rows) {const tr = document.createElement('tr'); for (const value of values) {const td = document.createElement('td'); td.textContent = value; tr.append(td);} el.append(tr);}
  }
  const dimension = (row, i) => row.dimensionValues?.[i]?.value ?? '—';
  const metric = (row, i) => row?.metricValues?.[i]?.value;
  const formatted = value => value === undefined ? '—' : nf.format(Number(value));
  async function api(method, body, signal) {
    const r = await fetch('https://analyticsdata.googleapis.com/v1beta/properties/' + config.propertyId + ':' + method, {
      method: 'POST', headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + accessToken},
      body: JSON.stringify(body), signal, cache: 'no-store'
    });
    const data = await r.json();
    if (!r.ok) {const error = new Error(data.error?.message || String(r.status)); error.status = r.status; throw error;}
    return data;
  }
  function report(metrics, dimensions, dates) {
    return {dateRanges: [dates], metrics: metrics.map(name => ({name})), dimensions: dimensions.map(name => ({name})), limit: '10000'};
  }
  async function refresh() {
    if (!owner || !accessToken || busy) return;
    if (Date.now() >= expiresAt) {accessToken = undefined; clear(); note.textContent = 'انتهى تفويض الجلسة. اضغط ربط Google للمتابعة.'; connect.disabled = false; return;}
    const startDate = $('report-start').value, endDate = $('report-end').value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || startDate > endDate) {note.textContent = 'اختر فترة صحيحة لتقرير Google.'; return;}
    busy = true; const current = epoch, dates = {startDate, endDate};
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 25000);
    note.textContent = 'جارٍ جلب أرقام Google الرسمية…';
    try {
      const reports = [report(['totalUsers', 'newUsers', 'sessions', 'screenPageViews', 'engagedSessions', 'engagementRate'], [], dates),
        report(['totalUsers', 'sessions', 'screenPageViews'], ['sessionSource', 'sessionMedium', 'sessionCampaignName'], dates),
        report(['screenPageViews', 'totalUsers'], ['pagePath', 'pageTitle'], dates),
        report(['screenPageViews', 'sessions', 'totalUsers'], ['date'], dates)];
      const data = await api('batchRunReports', {requests: reports}, controller.signal);
      if (!owner || current !== epoch) return;
      const summary = data.reports?.[0], labels = ['مستخدمو Google', 'مستخدمون جدد', 'جلسات Google', 'مشاهدات Google', 'جلسات متفاعلة', 'نسبة التفاعل'];
      $('google-summary').replaceChildren(...labels.map((label, i) => {const card = document.createElement('article'); card.className = 'partner-panel'; const title = document.createElement('h3'), value = document.createElement('strong'); title.textContent = label; const raw = metric(summary?.rows?.[0], i); value.textContent = raw === undefined ? '—' : i === 5 ? nf.format(Number(raw) * 100) + '٪' : formatted(raw); card.append(title, value); return card;}));
      table('google-sources', ['المصدر', 'الوسيط', 'الحملة', 'المستخدمون', 'الجلسات', 'المشاهدات'], (data.reports?.[1]?.rows || []).map(r => [dimension(r, 0), dimension(r, 1), dimension(r, 2), ...[0, 1, 2].map(i => formatted(metric(r, i)))]));
      table('google-pages', ['المسار', 'عنوان الصفحة', 'المشاهدات', 'المستخدمون'], (data.reports?.[2]?.rows || []).map(r => [dimension(r, 0), dimension(r, 1), formatted(metric(r, 0)), formatted(metric(r, 1))]));
      table('google-daily', ['اليوم', 'المشاهدات', 'الجلسات', 'المستخدمون'], (data.reports?.[3]?.rows || []).map(r => [dimension(r, 0), ...[0, 1, 2].map(i => formatted(metric(r, i)))]));
      const zone = summary?.metadata?.timeZone || 'حسب إعداد عقار Google';
      note.textContent = 'آخر تحديث ' + new Date().toLocaleTimeString('ar-IQ', {timeZone: 'Asia/Baghdad'}) + ' · توقيت البيانات: ' + zone + ' · فلاتر التاريخ فقط تنطبق على هذا القسم. الجداول تعرض أول 10000 صف؛ أرقام Google مستقلة عن Supabase.';
      if (data.reports?.some(r => r.metadata?.subjectToThresholding || r.metadata?.dataLossFromOtherRow)) note.textContent += ' قد تتأثر التفاصيل بحدود الخصوصية أو تجميع Google.';
      // Realtime is optional: a failure must not discard valid historical reports.
      try {const live = await api('runRealtimeReport', {metrics: [{name: 'activeUsers'}]}, controller.signal); if (owner && current === epoch) $('google-realtime').textContent = 'نشطون وفق تقرير Google لآخر ٣٠ دقيقة: ' + formatted(metric(live.rows?.[0], 0));}
      catch {if (owner && current === epoch) $('google-realtime').textContent = 'تعذّر جلب نشاط Google الحالي؛ التقارير أعلاه مستقلة عنه.';}
    } catch (error) {
      if (owner && current === epoch) {
        clear();
        if (error.status === 401) {accessToken = undefined; expiresAt = 0;}
        note.textContent = error.name === 'AbortError' ? 'تأخر رد Google. جرّب التحديث.' : 'تعذّر جلب تقرير Google: ' + error.message;
      }
    } finally {clearTimeout(timeout); busy = false;}
  }
  async function loadIdentity() {
    if (window.google?.accounts?.oauth2) return;
    await new Promise((resolve, reject) => {const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = resolve; s.onerror = () => reject(new Error('تعذّر تحميل نافذة Google')); document.head.append(s);});
  }
  connect.addEventListener('click', async () => {
    if (!owner) return;
    if (!config.clientId) {note.textContent = 'إعداد الربط جاهز؛ يلزم إكمال إنشاء عميل Google وتفويض قراءة الإحصائيات.'; return;}
    connect.disabled = true;
    try {
      await loadIdentity();
      if (!owner) return;
      client = window.google.accounts.oauth2.initTokenClient({client_id: config.clientId, scope, include_granted_scopes: false,
        callback(response) {
          connect.disabled = false;
          if (!owner) return;
          if (response.error || !response.access_token || !window.google.accounts.oauth2.hasGrantedAllScopes(response, scope)) {note.textContent = 'لم يُمنح تفويض قراءة الإحصائيات.'; return;}
          accessToken = response.access_token; expiresAt = Date.now() + Math.max(0, Number(response.expires_in || 3600) - 30) * 1000;
          refresh();
        }, error_callback() {connect.disabled = false; note.textContent = 'أُغلقت نافذة Google أو تعذّر فتحها. اضغط ربط Google للمحاولة.';}
      });
      client.requestAccessToken({prompt: 'select_account'});
    } catch (error) {connect.disabled = false; note.textContent = error.message;}
  });
  $('google-refresh').addEventListener('click', refresh);
  window.TahaGoogleReports = {
    open() {owner = true; epoch++; connect.disabled = false; note.textContent = config.clientId ? 'اضغط ربط Google واعتمد حسابك الذي يملك العقار.' : 'واجهة الربط جاهزة وتنتظر إكمال عميل Google وتفويض القراءة.';},
    close() {owner = false; epoch++; accessToken = undefined; expiresAt = 0; clear(); $('google-realtime').textContent = ''; note.textContent = '';}
  };
  setInterval(() => {if (!document.hidden) refresh();}, 60000);
})();
