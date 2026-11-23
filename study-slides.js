/* Taha Android — original, client-side illustrated study presentations.
   A study presentation is NOT an uploaded/recorded video.
   Teacher videos remain embedded only in the separately attributed source links. */
(() => {
  'use strict';
  if (window.tahaIllustratedLessonsInitialized) return;
  window.tahaIllustratedLessonsInitialized = true;
  const studyCards = Array.from(document.querySelectorAll('article.lesson, article.less, section.topic, article.letter'));
  if (!studyCards.length || typeof HTMLDialogElement === 'undefined') return;

  const style = document.createElement('style');
  style.textContent = [
    '.taha-lesson-tools{display:flex;flex-wrap:wrap;gap:9px;margin:12px 0;padding:10px;border:1px solid #416a82;border-radius:12px;background:#0d293d}',
    '.taha-lesson-tools button,.taha-lesson-tools a{border:1px solid #71a6bd;border-radius:9px;background:#173d58;color:#fff;padding:8px 12px;font:inherit;text-decoration:none;cursor:pointer}',
    '.taha-lesson-tools button:hover,.taha-lesson-tools a:hover{background:#275e7c}',
    '.taha-slide-dialog{border:1px solid #64a5bc;border-radius:22px;padding:0;max-width:min(94vw,720px);width:720px;background:#071b2f;color:#fff;box-shadow:0 15px 85px #000a}',
    '.taha-slide-dialog::backdrop{background:#010916d9;backdrop-filter:blur(4px)}',
    '.taha-slide-head{display:flex;justify-content:space-between;align-items:center;gap:12px;background:#102e46;padding:13px 18px}',
    '.taha-slide-head button,.taha-slide-actions button{border:1px solid #5b92aa;border-radius:9px;padding:8px 12px;background:#20445f;color:white;cursor:pointer;font:inherit}',
    '.taha-slide-stage{min-height:245px;display:grid;align-content:center;gap:13px;padding:24px 22px;text-align:center;line-height:1.85}',
    '.taha-slide-stage h2{margin:0;color:#ffe29c;font-size:clamp(1.25rem,4vw,2.05rem)}',
    '.taha-slide-stage p{margin:0;white-space:pre-line;font-size:clamp(1rem,2.6vw,1.4rem);overflow-wrap:anywhere}',
    '.taha-slide-actions{padding:12px 17px 18px;display:flex;flex-wrap:wrap;justify-content:center;gap:9px;border-top:1px solid #345a71}',
    '.taha-slide-actions button:disabled{opacity:.4;cursor:not-allowed}',
    '.taha-slide-progress{text-align:center;color:#a9d2e3;font-size:.85rem;padding-bottom:7px}',
    '.taha-slide-note{font-size:.82rem;color:#bed1df;text-align:center;margin:0;padding:0 15px 17px}',
    '@media(prefers-reduced-motion:no-preference){.taha-slide-stage{animation:taha-stage-in .3s ease}}',
    '@keyframes taha-stage-in{from{opacity:.3;transform:translateY(9px)}to{opacity:1;transform:none}}'
  ].join('');
  document.head.append(style);

  const dialog = document.createElement('dialog');
  dialog.className = 'taha-slide-dialog';
  dialog.setAttribute('aria-label', 'العرض التعليمي المصوّر');
  const head = document.createElement('header');
  head.className = 'taha-slide-head';
  const context = document.createElement('strong');
  const close = document.createElement('button');
  close.type = 'button'; close.textContent = 'إغلاق ✕';
  head.append(context, close);
  const stage = document.createElement('div');
  stage.className = 'taha-slide-stage';
  stage.setAttribute('aria-live', 'polite');
  const progress = document.createElement('div');
  progress.className = 'taha-slide-progress';
  const actions = document.createElement('nav');
  actions.className = 'taha-slide-actions';
  const prev = document.createElement('button'), next = document.createElement('button');
  const auto = document.createElement('button'), speak = document.createElement('button');
  prev.type = next.type = auto.type = speak.type = 'button';
  prev.textContent = 'السابق'; next.textContent = 'التالي';
  auto.textContent = '▶ تشغيل المشاهد تلقائياً'; speak.textContent = '🔊 قراءة آلية';
  actions.append(prev, auto, next, speak);
  const note = document.createElement('p');
  note.className = 'taha-slide-note';
  note.textContent = 'شرح بصري تفاعلي من نصوص طه أندرويد؛ ليس فيديو مصوّراً أو تسجيلاً لمدرس. القراءة الصوتية تعتمد على أصوات جهازك.';
  dialog.append(head, stage, progress, actions, note);
  document.body.append(dialog);

  let scenes = [], current = 0, timer = null, trigger = null;
  function stopAuto() {
    if (timer !== null) clearInterval(timer);
    timer = null;
    auto.textContent = '▶ تشغيل المشاهد تلقائياً';
  }
  function stopSpeech() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }
  function showSlide() {
    const scene = scenes[current];
    if (!scene) return;
    stage.replaceChildren();
    const title = document.createElement('h2'), body = document.createElement('p');
    title.textContent = scene.title; body.textContent = scene.body;
    stage.append(title, body);
    stage.style.animation = 'none'; void stage.offsetWidth; stage.style.animation = '';
    progress.textContent = 'المشهد ' + (current + 1) + ' من ' + scenes.length;
    prev.disabled = current === 0; next.disabled = current === scenes.length - 1;
  }
  function nextSlide() {
    if (current >= scenes.length - 1) { stopAuto(); return; }
    current++; stopSpeech(); showSlide();
    if (current === scenes.length - 1 && timer !== null) stopAuto();
  }
  function openSlides(card, button) {
    const h = card.querySelector('h2,h3');
    const title = h ? h.textContent.trim() : 'الدرس';
    const textParts = Array.from(card.querySelectorAll('p'))
      .filter(p => !p.closest('details') && !p.closest('[data-video]') && !p.classList.contains('minor'))
      .map(p => p.textContent.trim()).filter(Boolean);
    const block = card.querySelector('blockquote');
    const question = card.querySelector('details summary');
    const answer = card.querySelector('details p');
    scenes = [{title: 'عنوان الدرس', body: title}];
    const explanation = textParts.slice(0, 2).join('\n');
    if (explanation) scenes.push({title: 'نفهم الفكرة', body: explanation});
    if (block && block.textContent.trim()) scenes.push({title: 'مثال محلول', body: block.textContent.trim()});
    if (textParts.length > 2) scenes.push({title: 'خطوة إضافية', body: textParts.slice(2, 4).join('\n')});
    if (question) scenes.push({title: 'فكر قبل الإجابة', body: question.textContent.trim()});
    if (answer) scenes.push({title: 'الإجابة والتفسير', body: answer.textContent.trim()});
    if (scenes.length < 3) scenes.push({title: 'خطوة التعلّم', body: 'أعد قراءة شرح الدرس، ثم أجب عن السؤال وتحقق من الحل في الصفحة.'});
    context.textContent = title;
    trigger = button; current = 0; stopAuto(); stopSpeech(); showSlide();
    if (!dialog.open) dialog.showModal();
  }
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    stopAuto(); stopSpeech();
    if (trigger && trigger.isConnected) trigger.focus();
  });
  prev.addEventListener('click', () => { if (current > 0) { current--; stopSpeech(); showSlide(); } });
  next.addEventListener('click', nextSlide);
  auto.addEventListener('click', () => {
    if (timer !== null) { stopAuto(); return; }
    auto.textContent = '⏸ إيقاف العرض';
    timer = setInterval(nextSlide, 9000);
  });
  speak.addEventListener('click', () => {
    if (!('speechSynthesis' in window)) { speak.textContent = 'الصوت غير متاح على هذا الجهاز'; return; }
    stopSpeech();
    const line = scenes[current];
    if (!line) return;
    const utterance = new SpeechSynthesisUtterance(line.title + '. ' + line.body);
    utterance.lang = 'ar-IQ';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  });
  window.addEventListener('pagehide', () => { stopAuto(); stopSpeech(); });

  studyCards.forEach((card, i) => {
    if (card.querySelector('.taha-lesson-tools')) return;
    const title = card.querySelector('h2,h3');
    const paragraphs = card.querySelector('p');
    if (!title || !paragraphs) return;
    if (!card.id) card.id = 'taha-study-step-' + (i + 1);
    const tools = document.createElement('div');
    tools.className = 'taha-lesson-tools';
    const btn = document.createElement('button');
    btn.type = 'button'; btn.textContent = '🎞️ شرح مرئي تفاعلي';
    btn.setAttribute('aria-label', 'شاهد عرضاً مرئياً تفاعلياً لدرس ' + title.textContent.trim());
    btn.addEventListener('click', () => openSlides(card, btn));
    const share = document.createElement('a');
    share.href = '#' + encodeURIComponent(card.id);
    share.textContent = '🔗 رابط هذا الدرس';
    share.setAttribute('aria-label', 'رابط مباشر إلى درس ' + title.textContent.trim());
    tools.append(btn, share);
    card.append(tools);
  });
})();
