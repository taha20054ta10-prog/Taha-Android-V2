const tools = document.querySelector('#catalog-tools');
const search = document.querySelector('#app-search');
const filter = document.querySelector('#app-filter');
const items = [...document.querySelectorAll('#catalog .app')];
const empty = document.querySelector('#catalog-empty');
const status = document.querySelector('#catalog-status');

function normalized(value) {
  return value.toLowerCase()
    .normalize('NFKC')
    .replace(/[\u0610-\u061a\u064b-\u065f\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .trim();
}

const searchable = items.map(item => normalized(item.textContent + ' ' + item.dataset.keywords));

function updateCatalog() {
  const query = normalized(search.value);
  let visible = 0;
  items.forEach((item, index) => {
    const matchesStatus = filter.value === 'all' || item.dataset.status === filter.value;
    item.hidden = !matchesStatus || !searchable[index].includes(query);
    if (!item.hidden) visible++;
  });
  empty.hidden = visible !== 0;
  status.textContent = visible ? `عدد التطبيقات المعروضة ${visible}` : 'ماكو نتائج';
}

tools.hidden = false;
search.addEventListener('input', updateCatalog);
filter.addEventListener('change', updateCatalog);
document.querySelector('#reset-catalog').addEventListener('click', () => {
  search.value = '';
  filter.value = 'all';
  updateCatalog();
  search.focus();
});

function openLinkedGuide() {
  if (location.hash === '#install-guide') document.querySelector('#install-guide').open = true;
}
window.addEventListener('hashchange', openLinkedGuide);
openLinkedGuide();

// Accessible eight-slide carousel; pause while hovered or focused.
(()=>{const root=document.querySelector('#showcase');if(!root)return;const slides=[...root.querySelectorAll('.showcase-slide')],dots=[...root.querySelectorAll('[data-slide]')];let current=0,timer;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;function show(n){current=(n+slides.length)%slides.length;slides.forEach((s,i)=>{s.classList.toggle('active',i===current);s.setAttribute('aria-hidden',String(i!==current));s.querySelector('a').tabIndex=i===current?0:-1});dots.forEach((d,i)=>{d.classList.toggle('active',i===current);d.setAttribute('aria-current',String(i===current))})}function stop(){clearInterval(timer)}function start(){stop();if(!reduced)timer=setInterval(()=>show(current+1),5500)}document.querySelector('#slide-prev').addEventListener('click',()=>{show(current-1);start()});document.querySelector('#slide-next').addEventListener('click',()=>{show(current+1);start()});dots.forEach(d=>d.addEventListener('click',()=>{show(Number(d.dataset.slide));start()}));root.addEventListener('mouseenter',stop);root.addEventListener('mouseleave',start);root.addEventListener('focusin',stop);root.addEventListener('focusout',e=>{if(!root.contains(e.relatedTarget))start()});document.addEventListener('visibilitychange',()=>document.hidden?stop():start());show(0);start()})();
