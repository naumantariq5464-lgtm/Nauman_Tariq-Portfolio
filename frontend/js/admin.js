/* ============================================================
   admin.js — Hidden admin login trigger + modal
   Trigger: triple-click on "Nauman Tariq" text in footer
   ============================================================ */

(function () {
  const trigger       = document.getElementById('adminTrigger');
  const togglePassBtn = document.getElementById('toggleAdminPass');
  const passInput     = document.getElementById('adminPass');
  const passIcon      = document.getElementById('togglePassIcon');
  const loginForm     = document.getElementById('adminLoginForm');
  const loginError    = document.getElementById('adminLoginError');

  if (!trigger) return;

  // ── Triple-click to open admin modal ─────────────────────────
  let clickCount  = 0;
  let clickTimer  = null;

  trigger.addEventListener('click', function () {
    clickCount++;

    if (clickTimer) clearTimeout(clickTimer);

    clickTimer = setTimeout(function () {
      clickCount = 0;
    }, 600);

    if (clickCount >= 3) {
      clickCount = 0;
      clearTimeout(clickTimer);
      openAdminModal();
    }
  });

  function openAdminModal() {
    const modalEl = document.getElementById('adminLoginModal');
    if (!modalEl) return;

    // Reset form state
    if (loginForm) loginForm.reset();
    if (loginError) loginError.classList.add('d-none');

    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }

  // ── Password visibility toggle ────────────────────────────────
  if (togglePassBtn && passInput && passIcon) {
    togglePassBtn.addEventListener('click', function () {
      const isPassword = passInput.type === 'password';
      passInput.type   = isPassword ? 'text' : 'password';
      passIcon.className = isPassword ? 'bi bi-eye-slash' : 'bi bi-eye';
    });
  }

  // ── Login form submit ─────────────────────────────────────────
  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const username = document.getElementById('adminUser').value.trim();
      const password = passInput.value;

      if (!username || !password) return;

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      submitBtn.disabled    = true;
      submitBtn.textContent = 'Logging in...';
      if (loginError) loginError.classList.add('d-none');

      try {
        /* ── Phase 3: replace with real API call ──────────────
           const res = await fetch('/api/auth/login', {
             method:  'POST',
             headers: { 'Content-Type': 'application/json' },
             body:    JSON.stringify({ username, password }),
           });
           if (!res.ok) throw new Error('Invalid credentials');
           const { access_token } = await res.json();
           localStorage.setItem('admin_token', access_token);
           // Redirect to admin dashboard
        ────────────────────────────────────────────────────── */

        // Phase 1 stub — shows error (no real auth yet)
        await new Promise(resolve => setTimeout(resolve, 800));
        throw new Error('Backend not connected yet (Phase 1)');

      } catch (err) {
        if (loginError) loginError.classList.remove('d-none');
        console.warn('Admin login:', err.message);
      } finally {
        submitBtn.disabled    = false;
        submitBtn.textContent = 'Login';
      }
    });
  }
})();
