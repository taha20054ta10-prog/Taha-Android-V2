(function(root) {
  const sections = {
    sources: ['مصادر الزوار', ['source', 'visitors', 'sessions', 'views'], ['المصدر', 'الزوار', 'الجلسات', 'المشاهدات']],
    pages: ['الصفحات', ['page', 'title', 'views', 'visitors'], ['المسار', 'العنوان', 'المشاهدات', 'الزوار']],
    files: ['الكتب والملفات', ['title', 'category', 'grade', 'subject', 'opens', 'downloads', 'last_at'], ['اسم الملف', 'النوع', 'الصف', 'المادة', 'فتح', 'ضغط تحميل', 'آخر تفاعل']],
    apps: ['التطبيقات', ['title', 'source', 'views', 'downloads'], ['التطبيق', 'المصدر', 'ظهور البطاقة', 'ضغط تحميل']],
    campaigns: ['الحملات', ['source', 'medium', 'campaign', 'sessions', 'views'], ['المصدر', 'الوسيط', 'الحملة', 'الجلسات', 'المشاهدات']],
    daily: ['الأرقام اليومية', ['day', 'visitors', 'sessions', 'views'], ['اليوم', 'الزوار', 'الجلسات', 'المشاهدات']]
  };
  function escape(value) {
    let text = String(value ?? '');
    if (/^[\s\uFEFF]*[=+@\-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  function serialize(data, filters) {
    const rows = [['طه أندرويد — إحصائيات الموقع'], ['مصدر البيانات', 'Supabase — مستقل عن Google Analytics'],
      ['من', filters.p_start], ['إلى', filters.p_end], ['المصدر', filters.p_source || 'الجميع'],
      ['الصفحة', filters.p_page || 'الجميع'], ['نوع الملف', filters.p_category || 'الجميع'], ['بيانات اختبار', filters.p_test ? 'نعم' : 'لا'],
      [], ['ملخص الفترة'], ['الزوار', 'الجلسات', 'المشاهدات', 'فتح PDF', 'ضغط تحميل'],
      [data.summary.visitors, data.summary.sessions, data.summary.views, data.summary.pdf_opens, data.summary.downloads]];
    for (const [key, [title, fields, headers]] of Object.entries(sections)) {
      rows.push([], [title], headers);
      const list = data[key] || [];
      if (!list.length) rows.push(['لا توجد بيانات مسجلة']);
      else rows.push(...list.map(row => fields.map(field => row[field] ?? '')));
    }
    return '\uFEFF' + rows.map(row => row.map(escape).join(',')).join('\r\n') + '\r\n';
  }
  let url, preview;
  function clear() {
    if (url) URL.revokeObjectURL(url); url = undefined;
    preview?.remove(); preview = undefined;
  }
  function downloadReport(data, filters) {
    clear();
    const csv = serialize(data, filters), name = 'taha-analytics-' + filters.p_start + (filters.p_test ? '-test' : '') + '.csv';
    url = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8'}));
    preview = document.createElement('section'); preview.className = 'csv-preview'; preview.setAttribute('aria-label', 'معاينة ملف CSV');
    const note = document.createElement('p'); note.setAttribute('role', 'status'); note.textContent = 'تم إعداد ' + name + '. هذه معاينة نفس محتوى الملف. بعد حفظه يمكنك فتحه في Excel بترميز UTF-8.';
    const link = document.createElement('a'); link.className = 'button ghost'; link.href = url; link.download = name; link.textContent = 'حفظ ملف CSV مرة أخرى';
    const details = document.createElement('details'), summary = document.createElement('summary'), text = document.createElement('textarea');
    summary.textContent = 'عرض محتوى CSV قبل الحفظ'; text.readOnly = true; text.value = csv; text.dir = 'ltr'; text.rows = 12; text.setAttribute('aria-label', 'محتوى ملف CSV');
    details.append(summary, text); preview.append(note, link, details); document.getElementById('report-filters').after(preview);
    link.click();
    return {name, csv};
  }
  root.TahaCsv = {serialize, downloadReport, clear};
  if (typeof module !== 'undefined') module.exports = root.TahaCsv;
})(typeof window !== 'undefined' ? window : globalThis);
