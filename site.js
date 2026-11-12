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
