/* ============================================================
   preloader.js — 5-second branded preloader
   Uses sessionStorage so it only plays once per browser session
   ============================================================ */

(function () {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;

  // If already shown this session, hide immediately
  if (sessionStorage.getItem('preloaderShown')) {
    preloader.style.display = 'none';
    document.body.style.overflow = '';
    return;
  }

  // Block scroll while preloader is visible
  document.body.style.overflow = 'hidden';

  // Hide after exactly 5 seconds with fade-out transition
  setTimeout(function () {
    preloader.classList.add('hide');

    // After transition ends, fully remove from layout
    preloader.addEventListener('transitionend', function () {
      preloader.style.display = 'none';
      document.body.style.overflow = '';
    }, { once: true });

    // Fallback in case transitionend doesn't fire
    setTimeout(function () {
      preloader.style.display = 'none';
      document.body.style.overflow = '';
    }, 800);

    // Mark as shown for this session
    sessionStorage.setItem('preloaderShown', '1');
  }, 5000);
})();
