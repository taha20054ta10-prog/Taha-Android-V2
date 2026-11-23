/* Taha Android: shared, local-only onward navigation. No redirects or ad click tricks. */
(() => {
  'use strict';
  if (document.getElementById('taha-explore-more')) return;
  const mount = document.querySelector('main') || document.body;
  const file = location.pathname.split('/').pop() || 'index.html';
  const grades = [
    ['الأول الابتدائي','grade-one.html','one-primary'],
    ['الثاني الابتدائي','grade-two.html','two-primary'],
    ['الثالث الابتدائي','grade-three.html','three-primary'],
    ['الرابع الابتدائي','grade-four.html','four-primary'],
    ['الخامس الابتدائي','grade-five.html','five-primary'],
    ['السادس الابتدائي','grade-six.html','six-primary'],
    ['الأول المتوسط','grade-first-middle.html','one-middle'],
    ['الثاني المتوسط','grade-second-middle.html','two-middle'],
    ['الثالث المتوسط','grade-third-middle.html','three-middle'],
    ['الرابع العلمي','grade-fourth-scientific.html','four-scientific'],
    ['الخامس العلمي','grade-fifth-scientific.html','five-scientific'],
    ['السادس العلمي','grade-sixth-scientific.html','six-scientific'],
    ['الرابع الأدبي','grade-fourth-literary.html','four-literary'],
    ['الخامس الأدبي','grade-fifth-literary.html','five-literary'],
    ['السادس الأدبي','grade-sixth-literary.html','six-literary']
  ];
  let current = grades.findIndex(g => file === g[1] || file === 'video-grade-' + g[2] + '.html');
  if (file === 'index.html') return;
  const root = document.createElement('section');
  root.id = 'taha-explore-more';
  root.setAttribute('aria-labelledby','taha-next-title');
  const h = document.createElement('h2');
  h.id = 'taha-next-title';
  h.textContent = 'تابع رحلتك داخل طه أندرويد';
  const p = document.createElement('p');
  p.textContent = 'اختار قسمك الثاني بدون ما ترجع وتدور من البداية. روابط الكتب والفيديوهات الخارجية واضحة ومنفصلة عن شرح الموقع.';
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label','روابط داخلية مرتبطة بالمحتوى');
  function link(label, href) {
    const a = document.createElement('a');
    a.href = href; a.textContent = label;
    if ((href === file) || (href === './' && file === 'index.html')) a.setAttribute('aria-current','page');
    nav.append(a);
  }
  link('🏠 الرئيسية','./');
  link('🎓 جميع الصفوف','curriculum-index.html');
  link('📚 المكتبة'+(current >= 0 ? ' — '+grades[current][0] : ''),current >= 0 ? 'library.html?grade='+(current+1) : 'library.html');
  link('✏️ الشروحات والأسئلة','lessons.html');
  link('🎬 '+(current >= 0 ? 'فيديوهات هذا الصف':'فيديوهات كل الصفوف'),current >= 0 ? 'video-grade-'+grades[current][2]+'.html' : 'video-all-grades.html');
  link('📱 التطبيقات','./#apps');
  link('🤖 البوتات','./#bots');
  if (current >= 0) {
    const adjacent = document.createElement('div');
    adjacent.className='taha-adjacent-grades';
    function nearby(i,word) {
      if (i < 0 || i >= grades.length) return;
      const a = document.createElement('a');
      a.href=grades[i][1];a.textContent=word+': '+grades[i][0];adjacent.append(a);
    }
    nearby(current-1,'الصف السابق');
    nearby(current+1,'الصف التالي');
    root.append(h,p,nav,adjacent);
  } else {
    root.append(h,p,nav);
  }
  const style=document.createElement('style');
  style.textContent='#taha-explore-more{max-width:1100px;box-sizing:border-box;margin:27px auto;padding:20px;border:1px solid #537c94;border-radius:17px;background:#102b41;color:#f3faff;line-height:1.8;clear:both}#taha-explore-more h2{font-size:clamp(1.25rem,3vw,1.7rem);color:#ffe1a4;margin:0 0 7px}#taha-explore-more p{font-size:.95rem;color:#c8d9e6;margin:0 0 12px}#taha-explore-more nav,#taha-explore-more .taha-adjacent-grades{display:flex;flex-wrap:wrap;gap:9px;align-items:stretch}#taha-explore-more a{display:inline-flex;align-items:center;min-height:44px;padding:8px 12px;text-decoration:none;color:#e9faff;background:#1c4059;border:1px solid #5b8aa1;border-radius:10px;font-size:.92rem;font-weight:700;white-space:normal}#taha-explore-more a:hover{background:#2c5771}#taha-explore-more a[aria-current=page]{border-color:#e2c27e;color:#ffe9b8}#taha-explore-more .taha-adjacent-grades{margin-top:12px;padding-top:12px;border-top:1px solid #537c94}#taha-explore-more a:focus-visible{outline:3px solid #ffe19d;outline-offset:3px}@media(max-width:600px){#taha-explore-more{margin:18px 10px;padding:15px}#taha-explore-more nav a{flex:1 1 120px;justify-content:center;text-align:center}}';
  document.head.append(style);
  if (mount.tagName === 'MAIN') mount.append(root);
  else {
    const footer = document.querySelector('footer');
    if (footer) footer.before(root); else document.body.append(root);
  }
})();
