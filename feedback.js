(() => {
  const form = document.querySelector('#site-feedback-form')
  if (!form || !window.crypto?.randomUUID || typeof TAHA_METRICS === 'undefined') return
  const fields = document.querySelector('#feedback-fields')
  const status = document.querySelector('#feedback-status')
  const stars = [...form.querySelectorAll('[name=rating]')]
  let visitor = crypto.randomUUID()
  try {
    const key = 'taha-feedback-v1'
    const previous = localStorage.getItem(key)
    if (/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(previous || '')) visitor = previous
    else localStorage.setItem(key, visitor)
  } catch {
    // Keep this page's feedback independent if storage is unavailable.
  }
  function highlight() {
    const selected = Number(form.elements.rating.value)
    stars.forEach(radio => radio.parentElement.classList.toggle('star-active', Number(radio.value) <= selected))
  }
  form.addEventListener('change', highlight)
  form.addEventListener('submit', async event => {
    event.preventDefault()
    const rating = Number(form.elements.rating.value) || null
    const text = form.elements.suggestion.value.trim()
    if (!rating && !text) {
      status.textContent = 'اختَر عدد النجوم أو اكتب اقتراحك.'
      return
    }
    fields.disabled = true
    status.textContent = 'جارٍ إرسال رأيك…'
    try {
      const response = await fetch(TAHA_METRICS.endpoint + '/rest/v1/rpc/taha_submit_feedback', {
        method:'POST', headers:{apikey:TAHA_METRICS.publicKey, 'Content-Type':'application/json'},
        body:JSON.stringify({p_visitor:visitor,p_rating:rating,p_suggestion:text}),
        signal:AbortSignal.timeout(12000)
      })
      if (!response.ok) throw new Error(String(response.status))
      form.reset()
      highlight()
      status.textContent = 'وصل رأيك لإدارة الموقع. شكراً إلك!'
    } catch {
      status.textContent = 'تعذّر الإرسال. جرّب مرة ثانية.'
    } finally {
      fields.disabled = false
    }
  })
  fields.disabled = false
})()

