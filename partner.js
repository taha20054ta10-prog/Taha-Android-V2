const sponsor = document.querySelector('#sponsor-form')
if (sponsor) {
  document.querySelectorAll('[data-format]').forEach(link => {
    link.addEventListener('click', () => { sponsor.elements.format.value = link.dataset.format })
  })
  sponsor.addEventListener('submit', event => {
    event.preventDefault()
    const project = sponsor.elements.project
    if (!project.value.trim()) {
      project.value = ''
      project.reportValidity()
      return
    }
    const format = sponsor.elements.format.selectedOptions[0].text
    const details = sponsor.elements.details.value.trim()
    const message = ['السلام عليكم، أريد أستفسر عن إعلان في موقع طه أندرويد.', 'المشروع: ' + project.value.trim(), 'نوع الإعلان: ' + format]
    if (details) message.push('التفاصيل: ' + details)
    window.location.href = 'https://wa.me/9647731329582?text=' + encodeURIComponent(message.join('\n'))
  })
}

const ledger = document.querySelector('#ledger-form')
if (ledger) initializeLedger(ledger)

function initializeLedger(form) {
  const storageKey = 'taha-android.sponsor-ledger.v1'
  const currency = new Intl.NumberFormat('ar-IQ')
  const iraqiDate = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Baghdad', year:'numeric', month:'2-digit', day:'2-digit'})
  const labels = { paid:'مستلم', pending:'بانتظار الاستلام' }
  const rows = document.querySelector('#ledger-rows')
  const status = document.querySelector('#ledger-status')
  const exportButton = document.querySelector('#export-ledger')
  const cancel = document.querySelector('#cancel-edit')
  const submit = form.querySelector('[type=submit]')
  let editing = null
  let entries = []

  function readEntries() {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
    if (!Array.isArray(saved) || !saved.every(entry =>
      entry && typeof entry.id === 'string' && typeof entry.campaign === 'string' &&
      typeof entry.date === 'string' && Number.isSafeInteger(entry.amount) && entry.amount > 0 &&
      Object.hasOwn(labels, entry.status))) throw new TypeError('Invalid ledger')
    return saved
  }

  function resetForm() {
    editing = null
    form.reset()
    const pieces = Object.fromEntries(iraqiDate.formatToParts(new Date()).map(part => [part.type, part.value]))
    form.elements.date.value = [pieces.year, pieces.month, pieces.day].join('-')
    document.querySelector('#record-title').textContent = 'إضافة إيراد'
    submit.textContent = 'حفظ الإيراد'
    cancel.hidden = true
  }

  function render() {
    const total = entries.reduce((sum, entry) => sum + entry.amount, 0)
    const paid = entries.reduce((sum, entry) => sum + (entry.status === 'paid' ? entry.amount : 0), 0)
    document.querySelector('#total-amount').textContent = currency.format(total)
    document.querySelector('#paid-amount').textContent = currency.format(paid)
    document.querySelector('#pending-amount').textContent = currency.format(total - paid)
    document.querySelector('#record-count').textContent = currency.format(entries.length) + ' عمليات'
    document.querySelector('#ledger-empty').hidden = entries.length > 0
    document.querySelector('#ledger-scroll').hidden = entries.length === 0
    exportButton.disabled = entries.length === 0
    rows.replaceChildren()
    const sorted = [...entries].sort((first, second) => second.date.localeCompare(first.date))
    for (const entry of sorted) {
      const row = rows.insertRow()
      row.insertCell().textContent = entry.campaign
      row.insertCell().textContent = entry.date
      row.insertCell().textContent = currency.format(entry.amount)
      const state = row.insertCell()
      state.textContent = labels[entry.status]
      state.className = 'entry-' + entry.status
      const actions = row.insertCell()
      for (const [action, label] of [['edit', 'تعديل'], ['delete', 'حذف']]) {
        const button = document.createElement('button')
        button.type = 'button'
        button.dataset.action = action
        button.dataset.id = entry.id
        button.textContent = label
        button.setAttribute('aria-label', label + ' ' + entry.campaign)
        actions.append(button)
      }
    }
  }

  function save(next, message) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next))
    } catch {
      status.textContent = 'تعذّر الحفظ في هذا المتصفح.'
      return false
    }
    entries = next
    render()
    status.textContent = message
    return true
  }

  resetForm()
  try {
    entries = readEntries()
  } catch {
    status.textContent = 'تعذّرت قراءة السجل المحلي. تحقق من إعدادات تخزين المتصفح.'
    submit.disabled = true
    return
  }
  render()
  window.addEventListener('storage', event => {
    if (event.key !== storageKey && event.key !== null) return
    try {
      entries = readEntries()
      render()
      resetForm()
      status.textContent = 'تم تحديث السجل من علامة تبويب أخرى.'
    } catch {
      status.textContent = 'تعذّرت قراءة آخر تحديث للسجل.'
    }
  })
  cancel.addEventListener('click', resetForm)
  form.addEventListener('submit', event => {
    event.preventDefault()
    const campaign = form.elements.campaign
    if (!campaign.value.trim()) {
      campaign.value = ''
      campaign.reportValidity()
      return
    }
    const entry = {
      id: editing ?? crypto.randomUUID(),
      campaign: campaign.value.trim(),
      amount: form.elements.amount.valueAsNumber,
      date: form.elements.date.value,
      status: form.elements.status.value
    }
    const next = editing ? entries.map(item => item.id === editing ? entry : item) : [entry, ...entries]
    if (save(next, 'تم حفظ الإيراد.')) resetForm()
  })
  rows.addEventListener('click', event => {
    const button = event.target.closest('button[data-id]')
    if (!button) return
    const entry = entries.find(item => item.id === button.dataset.id)
    if (!entry) return
    if (button.dataset.action === 'edit') {
      editing = entry.id
      for (const field of ['campaign', 'amount', 'date', 'status']) form.elements[field].value = entry[field]
      document.querySelector('#record-title').textContent = 'تعديل الإيراد'
      submit.textContent = 'حفظ التعديل'
      cancel.hidden = false
      form.elements.campaign.focus()
      return
    }
    if (window.confirm('تحذف إيراد «' + entry.campaign + '»؟') &&
        save(entries.filter(item => item.id !== entry.id), 'تم حذف الإيراد.') && editing === entry.id) resetForm()
  })
  exportButton.addEventListener('click', () => {
    const quote = value => {
      const text = String(value)
      const safe = /^[\s\u0000-\u001f]*[=+@-]|^[\t\r\n]/.test(text) ? "'" + text : text
      return '"' + safe.replaceAll('"', '""') + '"'
    }
    const data = [['الحملة','التاريخ','المبلغ بالدينار العراقي','الحالة'],
      ...entries.map(entry => [entry.campaign, entry.date, entry.amount, labels[entry.status]])]
    const csv = data.map(columns => columns.map(quote).join(',')).join('\r\n')
    const href = URL.createObjectURL(new Blob(['\uFEFF', csv], {type:'text/csv;charset=utf-8'}))
    const link = document.createElement('a')
    link.href = href
    link.download = 'taha-android-revenue.csv'
    document.body.append(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(href), 1000)
  })
}

// Add approved campaigns here. Each needs a placement ('home' or 'catalog'),
// title, description, and an HTTPS destination. The first valid entry per placement is shown.
const publicSponsors = []

for (const [placement, selector] of [['home', '#home-sponsor'], ['catalog', '#catalog-sponsor']]) {
  const slot = document.querySelector(selector)
  if (!slot) continue
  const campaign = publicSponsors.find(item => item.placement === placement &&
    item.title && item.description && URL.canParse(item.url) && new URL(item.url).protocol === 'https:')
  if (!campaign) continue

  const copy = document.createElement('div')
  const label = document.createElement('span')
  const title = document.createElement('strong')
  const description = document.createElement('p')
  const action = document.createElement('a')
  label.className = 'sponsor-disclosure'
  label.textContent = 'إعلان ممول'
  title.textContent = campaign.title
  description.textContent = campaign.description
  action.className = 'button ghost'
  action.href = campaign.url
  action.target = '_blank'
  action.rel = 'sponsored noopener noreferrer'
  action.textContent = 'زيارة موقع المعلن ↗'
  copy.append(label, title, description)
  slot.append(copy, action)
  slot.hidden = false
}
