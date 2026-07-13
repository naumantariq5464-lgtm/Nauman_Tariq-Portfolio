/* ============================================================
   admin.js — Hidden admin login trigger + JWT auth
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

  // ── Triple-click to open admin modal ──────────────────────
  let clickCount = 0, clickTimer = null;
  trigger.addEventListener('click', function () {
    clickCount++;
    if (clickTimer) clearTimeout(clickTimer);
    clickTimer = setTimeout(() => { clickCount = 0; }, 600);
    if (clickCount >= 3) {
      clickCount = 0;
      clearTimeout(clickTimer);
      openAdminModal();
    }
  });

  function openAdminModal() {
    const modalEl = document.getElementById('adminLoginModal');
    if (!modalEl) return;
    if (loginForm) loginForm.reset();
    if (loginError) loginError.classList.add('d-none');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }

  // ── Password toggle ───────────────────────────────────────
  if (togglePassBtn && passInput && passIcon) {
    togglePassBtn.addEventListener('click', function () {
      const isPass = passInput.type === 'password';
      passInput.type = isPass ? 'text' : 'password';
      passIcon.className = isPass ? 'bi bi-eye-slash' : 'bi bi-eye';
    });
  }

  // ── Login form submit ─────────────────────────────────────
  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const username  = document.getElementById('adminUser').value.trim();
      const password  = passInput.value;
      if (!username || !password) return;

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const origText  = submitBtn.textContent;
      submitBtn.disabled    = true;
      submitBtn.textContent = 'Logging in...';
      if (loginError) loginError.classList.add('d-none');

      try {
        const res = await fetch(CONFIG.API_BASE_URL + '/auth/login', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ username, password }),
        });

        if (res.status === 429) {
          showLoginError('Too many attempts. Please wait 15 minutes.');
          return;
        }
        if (!res.ok) {
          showLoginError('Invalid username or password.');
          return;
        }

        const data = await res.json();
        Auth.setTokens(data.access_token, data.refresh_token);

        // Close modal and redirect to admin dashboard
        bootstrap.Modal.getInstance(document.getElementById('adminLoginModal'))?.hide();
        window.location.href = 'admin-dashboard.html';

      } catch {
        showLoginError('Could not connect to server.');
      } finally {
        submitBtn.disabled    = false;
        submitBtn.textContent = origText;
      }
    });
  }

  function showLoginError(msg) {
    if (!loginError) return;
    loginError.innerHTML = `<i class="bi bi-exclamation-circle me-2"></i>${msg}`;
    loginError.classList.remove('d-none');
  }

  // ── Auto-redirect if already logged in ───────────────────
  // (Only on index.html, not on dashboard)
  if (Auth.isLoggedIn() && window.location.pathname.includes('index')) {
    // Don't auto-redirect — admin might just be browsing
  }
})();
