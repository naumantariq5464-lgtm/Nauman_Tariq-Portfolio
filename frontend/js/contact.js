/* ============================================================
   contact.js — Contact form validation & submission
   In Phase 3 this will POST to the FastAPI backend
   ============================================================ */

(function () {
  const form       = document.getElementById('contactForm');
  const submitBtn  = document.getElementById('contactSubmitBtn');
  const btnText    = submitBtn && submitBtn.querySelector('.btn-text');
  const btnLoader  = submitBtn && submitBtn.querySelector('.btn-loader');
  const successMsg = document.getElementById('contactSuccess');
  const errorMsg   = document.getElementById('contactError');

  if (!form) return;

  // ── Field References ──────────────────────────────────────────
  const fields = {
    fullName: document.getElementById('fullName'),
    email:    document.getElementById('email'),
    subject:  document.getElementById('subject'),
    message:  document.getElementById('message'),
  };

  // ── Validators ────────────────────────────────────────────────
  function isValidEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  }

  function validateField(input) {
    const val = input.value.trim();
    let   ok  = true;

    if (!val) {
      ok = false;
    } else if (input.type === 'email' && !isValidEmail(val)) {
      ok = false;
    } else if (input.id === 'fullName' && val.length < 2) {
      ok = false;
    } else if (input.id === 'message' && val.length < 10) {
      ok = false;
    }

    input.classList.toggle('is-invalid', !ok);
    input.classList.toggle('is-valid',    ok);
    return ok;
  }

  function validateAll() {
    let valid = true;
    Object.values(fields).forEach(function (input) {
      if (!validateField(input)) valid = false;
    });
    return valid;
  }

  // Live validation on blur
  Object.values(fields).forEach(function (input) {
    input.addEventListener('blur',  () => validateField(input));
    input.addEventListener('input', () => {
      if (input.classList.contains('is-invalid')) validateField(input);
    });
  });

  // ── UI Helpers ────────────────────────────────────────────────
  function setLoading(loading) {
    submitBtn.disabled = loading;
    btnText.classList.toggle('d-none',  loading);
    btnLoader.classList.toggle('d-none', !loading);
  }

  function showSuccess() {
    successMsg.classList.remove('d-none');
    errorMsg.classList.add('d-none');
    form.reset();
    Object.values(fields).forEach(f => f.classList.remove('is-valid', 'is-invalid'));
    // Auto-hide after 6s
    setTimeout(() => successMsg.classList.add('d-none'), 6000);
  }

  function showError() {
    errorMsg.classList.remove('d-none');
    successMsg.classList.add('d-none');
    setTimeout(() => errorMsg.classList.add('d-none'), 5000);
  }

  // ── Submit Handler ────────────────────────────────────────────
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
      /* ── Phase 3: replace this block with real API call ──
         const res = await fetch('/api/contact', {
           method:  'POST',
           headers: { 'Content-Type': 'application/json' },
           body:    JSON.stringify(payload),
         });
         if (!res.ok) throw new Error('Server error');
      ─────────────────────────────────────────────────── */

      // Phase 1 simulation — remove when backend is ready
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Contact payload (Phase 1 mock):', payload);
      showSuccess();

    } catch (err) {
      console.error('Contact form error:', err);
      showError();
    } finally {
      setLoading(false);
    }
  });
})();
