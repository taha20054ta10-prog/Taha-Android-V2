'use strict';

(() => {
  const grade = document.getElementById('library-grade');
  const subject = document.getElementById('library-subject');
  const search = document.getElementById('library-search');
  const results = document.getElementById('library-results');
  const message = document.getElementById('library-message');
  const empty = document.getElementById('library-empty');
  const gradeSource = document.getElementById('library-grade-source');
  const reset = document.getElementById('library-reset');
  const buttons = [...document.querySelectorAll('[data-library-type]')];
  if (!grade || !subject || !search || !results || !message || !empty || !gradeSource) return;

  const subjects = {
    islamic: 'التربية الإسلامية', arabic: 'اللغة العربية', english: 'اللغة الإنكليزية',
    french: 'اللغة الفرنسية', kurdish: 'اللغة الكردية', math: 'الرياضيات',
    science: 'العلوم', physics: 'الفيزياء', chemistry: 'الكيمياء', biology: 'الأحياء',
    social: 'الاجتماعيات', history: 'التاريخ', geo: 'الجغرافية', economics: 'الاقتصاد',
    philosophy: 'الفلسفة وعلم النفس', sociology: 'علم الاجتماع', ethics: 'التربية الأخلاقية',
    computer: 'الحاسوب', earth: 'علم الأرض', baath: 'جرائم حزب البعث', other: 'مواد أخرى'
  };
  const formatLabels = {
    pdf: 'رابط PDF مباشر', drive: 'ملف PDF على Google Drive', viewer: 'معاينة Google Drive',
    source: 'صفحة المصدر'
  };
  const scopeLabels = {
    partial: 'محتوى جزئي', archive: 'نسخة في أرشيف خارجي', compilation: 'تجميع تدريبي لأسئلة وزارية',
    'edition-unconfirmed': 'اكتمال الطبعة وتطابقها مع المنهج المحدّث قيد التحقق',
    publisher: 'فهرس الموزع', 'source-edition': 'إصدار 2026–2027 بحسب المصدر'
  };
  const gradeSlugs = [
    'primary-1', 'primary-2', 'primary-3', 'primary-4', 'primary-5', 'primary-6',
    'middle-1', 'middle-2', 'middle-3', 'prep-4-sci', 'prep-5-sci', 'prep-6-sci',
    'prep-4-lit', 'prep-5-lit', 'prep-6-lit'
  ];
  const files = libraryCatalog.filter(file => !file.archived);
  const params = new URLSearchParams(location.search);
  if ([...grade.options].some(option => option.value === params.get('grade'))) grade.value = params.get('grade');
  let type = buttons.some(button => button.dataset.libraryType === params.get('type')) ? params.get('type') : 'book';
  search.value = (params.get('q') || '').slice(0, 180);

  function normalize(value) {
    return value.normalize('NFKC').toLocaleLowerCase('ar')
      .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u0640]/g, '')
      .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
      .replace(/ان[كج]ليز/g, 'انكليز')
      .replace(/[٠-٩۰-۹]/g, digit => String(digit.charCodeAt(0) & 15))
      .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  }

  function externalLink(url, label, className = 'sub-link') {
    const link = document.createElement('a');
    link.href = url;
    link.textContent = label;
    link.className = className;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    return link;
  }

  function externalUrl(file) {
    return file.format === 'drive' || file.format === 'viewer'
      ? file.url.replace(/\/preview$/, '/view') : file.url;
  }

  function openViewer(file) {
    let viewer = document.getElementById('pdf-viewer');
    if (!viewer) {
      viewer = document.createElement('dialog');
      viewer.id = 'pdf-viewer';
      viewer.className = 'pdf-viewer';
      viewer.setAttribute('aria-labelledby', 'pdf-title');
      viewer.innerHTML = '<div class="pdf-toolbar"><strong id="pdf-title"></strong><button type="button" autofocus>إغلاق ✕</button></div><iframe title="قارئ PDF" referrerpolicy="no-referrer"></iframe><p>إذا تعذّرت المعاينة، افتح الملف في تبويب جديد.</p><a target="_blank" rel="noopener noreferrer">فتح في تبويب جديد ↗</a>';
      document.body.append(viewer);
      viewer.querySelector('button').addEventListener('click', () => viewer.close());
      viewer.addEventListener('close', () => viewer.querySelector('iframe').removeAttribute('src'));
    }
    viewer.querySelector('#pdf-title').textContent = file.title;
    viewer.querySelector('iframe').src = file.url;
    viewer.querySelector('a').href = externalUrl(file);
    viewer.showModal();
  }

  function makeCover(file, gradeLabel) {
    const cover = document.createElement('div');
    cover.className = 'library-cover-box';
    cover.setAttribute('aria-hidden', 'true');
    const fallback = document.createElement('div');
    fallback.className = 'math-style-cover';
    const title = document.createElement('strong');
    title.className = 'math-cover-title math-title-long';
    const activity = file.type === 'book' && /نشاط|تمرينات/.test(file.title);
    title.textContent = (activity ? 'نشاط · ' : '') + subjects[file.subject];
    const stage = document.createElement('span');
    stage.className = 'math-cover-grade';
    stage.textContent = gradeLabel;
    fallback.append(title, stage);
    cover.append(fallback);
    if (file.cover) {
      const image = document.createElement('img');
      image.className = 'library-cover';
      image.alt = '';
      image.loading = 'lazy';
      image.addEventListener('error', () => image.remove());
      image.src = file.cover;
      cover.append(image);
    }
    return cover;
  }

  function shareLink(file) {
    const url = new URL('library.html', location.href);
    url.search = new URLSearchParams({grade: file.grade, type: file.type, q: file.title});
    const link = document.createElement('a');
    link.className = 'sub-link book-share';
    link.href = url;
    link.textContent = 'رابط المشاركة';
    link.addEventListener('click', async event => {
      if (!navigator.clipboard?.writeText) return;
      event.preventDefault();
      try {
        await navigator.clipboard.writeText(link.href);
        link.textContent = 'تم نسخ الرابط ✓';
      } catch {
        location.assign(link.href);
      }
    });
    return link;
  }

  function makeCard(file, gradeLabel, alternatives) {
    const card = document.createElement('article');
    card.className = 'card library-book';
    const subtitle = document.createElement('p');
    subtitle.className = 'library-grade-label';
    subtitle.textContent = [subjects[file.subject], gradeLabel, file.author, file.year].filter(Boolean).join(' · ');
    const title = document.createElement('h3');
    title.textContent = file.title;
    const status = document.createElement('p');
    status.className = 'library-grade-label';
    status.textContent = [file.official ? 'وزارة التربية' : null,
      formatLabels[file.format], scopeLabels[file.scope]].filter(Boolean).join(' · ');
    const detail = document.createElement('a');
    detail.className = 'button primary';
    detail.href = 'book.html?' + new URLSearchParams({grade:file.grade,type:file.type,title:file.title});
    detail.textContent = '📖 تفاصيل الملف وطريقة القراءة ←';
    const formatNote = document.createElement('p');
    formatNote.className = 'library-grade-label';
    formatNote.textContent = file.format === 'source' ? 'الرابط يؤدي إلى صفحة مصدر خارجي' : 'القراءة متاحة عبر صفحة التفاصيل';
    card.append(makeCover(file, gradeLabel), subtitle, title, status, formatNote, detail);
    if (file.accessNote) {
      const note = document.createElement('p');
      note.className = 'library-grade-label';
      note.textContent = file.accessNote;
      card.append(note);
    }
    if (alternatives.length) {
      const versions = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = 'روابط ونسخ إضافية';
      versions.append(summary);
      for (const entry of alternatives) {
        const alt=externalLink(externalUrl(entry), entry.title + ' ↗'); alt.addEventListener('click',()=>window.tahaRecordFile?.('pdf',entry.title,'ملف دراسي',{grade:gradeLabel,subject:subjects[entry.subject]||entry.subject})); versions.append(alt);
      }
      card.append(versions);
    }
    card.append(shareLink(file));
    return card;
  }

  function filesForGrade() {
    return files.filter(file => file.grade === grade.value && file.type === type);
  }

  function populateSubjects(preferred = '') {
    const available = new Set(filesForGrade().map(file => file.subject));
    subject.replaceChildren();
    function addOption(id, label) {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = label;
      subject.append(option);
    }
    addOption('', 'كل المواد');
    const sorted = Object.entries(subjects).sort((a, b) => a[1].localeCompare(b[1], 'ar'));
    for (const [id, label] of sorted) {
      if (available.has(id)) addOption(id, label);
    }
    if (available.has(preferred)) subject.value = preferred;
  }

  const priority = {pdf: 0, drive: 1, viewer: 2, source: 3};
  function render() {
    const all = filesForGrade();
    const words = normalize(search.value).split(' ').filter(Boolean);
    const groups = new Map();
    for (const file of all) {
      if (subject.value && file.subject !== subject.value) continue;
      const text = normalize([file.title, subjects[file.subject], file.author, file.year].filter(Boolean).join(' '));
      if (!words.every(word => text.includes(word))) continue;
      const key = file.group || normalize(file.title);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(file);
    }

    const gradeLabel = grade.selectedOptions[0].text;
    results.replaceChildren();
    let pdfCount = 0;
    for (const versions of groups.values()) {
      versions.sort((a, b) => priority[a.format] - priority[b.format]);
      const [first, ...alternatives] = versions;
      if (first.format === 'pdf' || first.format === 'drive') pdfCount++;
      results.append(makeCard(first, gradeLabel, alternatives));
    }
    empty.hidden = groups.size > 0;
    if (reset) {
      reset.hidden = false;
      reset.disabled = !search.value && !subject.value;
    }
    // Keep campaign attribution while making the selected shelf shareable.
    const url = new URL(location.href);
    url.searchParams.set('grade', grade.value);
    url.searchParams.set('type', type);
    for (const [key, value] of [['subject', subject.value], ['q', search.value.trim()]]) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    history.replaceState(null, '', url);

    message.textContent = gradeLabel + ' · ' + groups.size + ' نتيجة: ' + pdfCount
      + ' روابط PDF و' + (groups.size - pdfCount) + ' مصادر أو معاينات';
    const exam = type === 'exams';
    gradeSource.replaceChildren(externalLink(exam
      ? 'https://qus.haltaelam.com/' + gradeSlugs[Number(grade.value) - 1] + '/'
      : 'https://manahijuna.net/' + (type === 'book' ? 'الكتب-المنهجية/' : ''),
      exam ? 'أرشيف أسئلة هذا الصف ↗' : type === 'book' ? 'فهرس خارجي للكتب بحسب الصف ↗' : 'مصادر إضافية للملازم ↗'));
    for (const button of buttons) {
      const active = button.dataset.libraryType === type;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    }
  }

  grade.addEventListener('change', () => {
    populateSubjects();
    render();
  });
  for (const button of buttons) {
    button.addEventListener('click', () => {
      type = button.dataset.libraryType;
      populateSubjects(subject.value);
      render();
    });
  }
  reset?.addEventListener('click', () => {
    search.value = '';
    subject.value = '';
    render();
    search.focus();
  });
  subject.addEventListener('change', render);
  search.addEventListener('input', render);
  populateSubjects(params.get('subject') || '');
  render();
})();
