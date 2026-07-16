/* ============================================================
   protection.js — Basic client-side protection
   Right-click, DevTools, text selection, image drag disabled
   ============================================================ */

(function () {
  'use strict';

  // ── Toast notification ────────────────────────────────────
  function showToast(message) {
    const existing = document.querySelector('.protection-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'protection-toast';
    toast.textContent = message;
    toast.style.cssText = [
      'position:fixed', 'top:20px', 'right:20px',
      'background:#111111', 'color:#ffffff',
      'padding:10px 18px', 'border-radius:8px',
      'font-family:Inter,sans-serif', 'font-size:13px', 'font-weight:500',
      'z-index:999999', 'box-shadow:0 4px 16px rgba(0,0,0,0.25)',
      'pointer-events:none',
      'animation:_toastIn 0.25s ease',
    ].join(';');

    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 2500);
  }

  // ── Inject keyframes once ────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    @keyframes _toastIn {
      from { transform: translateX(110%); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }
    * { user-select: none; -webkit-user-select: none; }
    input, textarea, [contenteditable] {
      user-select: text !important;
      -webkit-user-select: text !important;
    }
  `;
  document.head.appendChild(style);

  // ── Right-click ───────────────────────────────────────────
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    showToast('🚫 Right-click is disabled');
  });

  // ── Keyboard shortcuts ────────────────────────────────────
  document.addEventListener('keydown', function (e) {
    // Ctrl+U — View Source
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      showToast('🔒 View source is disabled');
      return false;
    }
    // Ctrl+Shift+I — DevTools
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
      e.preventDefault();
      showToast('🛡️ DevTools are restricted');
      return false;
    }
    // Ctrl+Shift+J — DevTools Console
    if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
      e.preventDefault();
      return false;
    }
    // F12 — DevTools
    if (e.key === 'F12') {
      e.preventDefault();
      showToast('🔐 DevTools access blocked');
      return false;
    }
    // Ctrl+S — Save
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      showToast('💾 Page saving is disabled');
      return false;
    }
    // Ctrl+P — Print
    if (e.ctrlKey && e.key === 'p') {
      e.preventDefault();
      showToast('🖨️ Printing is disabled');
      return false;
    }
  });

  // ── Text selection ────────────────────────────────────────
  document.addEventListener('selectstart', function (e) {
    // Allow selection inside inputs and textareas
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
    e.preventDefault();
  });

  // ── Image drag ────────────────────────────────────────────
  document.addEventListener('dragstart', function (e) {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
    }
  });

  // ── Iframe embedding block ────────────────────────────────
  if (window.self !== window.top) {
    window.top.location = window.self.location;
  }

  // ── Console warning ───────────────────────────────────────
  console.log('%c🚨 Stop!', 'color:red; font-size:40px; font-weight:bold;');
  console.log('%cThis is a browser feature for developers.', 'color:#cc0000; font-size:15px;');
  console.log('%cIf someone told you to paste something here — it\'s a scam!', 'color:#cc0000; font-size:15px; font-weight:bold;');

})();
