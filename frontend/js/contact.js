/* ============================================================
   contact.js — Contact form with real FastAPI backend POST
   ============================================================ */

(function () {
  const form       = document.getElementById('contactForm');
  const submitBtn  = document.getElementById('contactSubmitBtn');
  const btnText    = submitBtn && submitBtn.querySelector('.btn-text');
  const btnLoader  = submitBtn && submitBtn.querySelector('.btn-loader');
  const successMsg = document.getElementById('contactSuccess');
  const errorMsg   = document.getElementById('contactError');

  if (!form) return;

  const fields = {
    fullName: document.getElementById('fullName'),
    email:    document.getElementById('email'),
    subject:  document.getElementById('subject'),
    message:  document.getElementById('message'),
  };

  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  }

  function validateField(input) {
    const val = input.value.trim();
    let ok = true;
    if (!val) ok = false;
    else if (input.type === 'email' && !isValidEmail(val)) ok = false;
    else if (input.id === 'fullName' && val.length < 2) ok = false;
    else if (input.id === 'message' && val.length < 10) ok = false;
    input.classList.toggle('is-invalid', !ok);
    input.classList.toggle('is-valid', ok);
    return ok;
  }

  function validateAll() {
    let valid = true;
    Object.values(fields).forEach(f => { if (!validateField(f)) valid = false; });
    return valid;
  }

  Object.values(fields).forEach(input => {
    input.addEventListener('blur',  () => validateField(input));
    input.addEventListener('input', () => { if (input.classList.contains('is-invalid')) validateField(input); });
  });

  function setLoading(loading) {
    submitBtn.disabled = loading;
    btnText.classList.toggle('d-none', loading);
    btnLoader.classList.toggle('d-none', !loading);
  }

  function showSuccess() {
    successMsg.classList.remove('d-none');
    errorMsg.classList.add('d-none');
    form.reset();
    Object.values(fields).forEach(f => f.classList.remove('is-valid', 'is-invalid'));
    setTimeout(() => successMsg.classList.add('d-none'), 7000);
  }

  function showError(msg) {
    errorMsg.classList.remove('d-none');
    const p = errorMsg.querySelector('p, div');
    if (p && msg) p.innerHTML = `<i class="bi bi-exclamation-circle me-2"></i>${msg}`;
    successMsg.classList.add('d-none');
    setTimeout(() => errorMsg.classList.add('d-none'), 6000);
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    successMsg.classList.add('d-none');
    errorMsg.classList.add('d-none');
    if (!validateAll()) return;

    const payload = {
      full_name: fields.fullName.value.trim(),
      email:     fields.email.value.trim(),
      subject:   fields.subject.value.trim(),
      message:   fields.message.value.trim(),
    };

    setLoading(true);
    try {
      const res = await fetch(CONFIG.API_BASE_URL + '/contact/', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      if (res.status === 429) {
        showError('Too many messages. Please try again later.');
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showError(err.detail || 'Something went wrong. Please try again.');
        return;
      }
      showSuccess();
    } catch {
      showError('Could not connect to server. Please try again later.');
    } finally {
      setLoading(false);
    }
  });
})();
