/* ============================================================
   main.js — AOS init, navbar scroll, smooth scroll, FABs
   ============================================================ */

(function () {

  // ── AOS Initialization ────────────────────────────────────────
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration:   700,
      easing:     'ease-out-cubic',
      once:       true,
      offset:     80,
      delay:      0,
    });
  }

  // ── Navbar: add "scrolled" class on scroll ────────────────────
  const navbar = document.getElementById('mainNav');
  if (navbar) {
    window.addEventListener('scroll', function () {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });
  }

  // ── Navbar: highlight active section link ─────────────────────
  const sections  = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav-link');

  function highlightNav() {
    const scrollY = window.scrollY + 100;
    sections.forEach(function (section) {
      const top    = section.offsetTop;
      const height = section.offsetHeight;
      const id     = section.getAttribute('id');

      if (scrollY >= top && scrollY < top + height) {
        navLinks.forEach(link => {
          link.classList.toggle(
            'active',
            link.getAttribute('href') === '#' + id
          );
        });
      }
    });
  }

  window.addEventListener('scroll', highlightNav, { passive: true });
  highlightNav();

  // ── Smooth Scroll for all anchor links ───────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();

      const navH   = navbar ? navbar.offsetHeight : 70;
      const top    = target.getBoundingClientRect().top + window.scrollY - navH;

      window.scrollTo({ top, behavior: 'smooth' });

      // Close mobile navbar if open
      const navCollapse = document.getElementById('navbarNav');
      if (navCollapse && navCollapse.classList.contains('show')) {
        const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
        if (bsCollapse) bsCollapse.hide();
      }
    });
  });

  // ── FAB: WhatsApp ─────────────────────────────────────────────
  const fabWhatsapp = document.getElementById('fabWhatsapp');
  if (fabWhatsapp) {
    const PHONE   = '923039589929'; // Nauman's WhatsApp number
    const MESSAGE = encodeURIComponent("Hi Nauman! I visited your portfolio and I'd like to discuss a project.");
    fabWhatsapp.addEventListener('click', function () {
      window.open(`https://wa.me/${PHONE}?text=${MESSAGE}`, '_blank', 'noopener');
    });
  }

  // ── FAB: Call ─────────────────────────────────────────────────
  const fabCall = document.getElementById('fabCall');
  if (fabCall) {
    fabCall.addEventListener('click', function () {
      window.location.href = 'tel:+923039589929';
    });
  }

  // ── Back to top on logo click ─────────────────────────────────
  const brand = document.querySelector('.navbar-brand');
  if (brand) {
    brand.addEventListener('click', function (e) {
      if (this.getAttribute('href') === '#home') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  // ── Navbar close on mobile nav-link click ────────────────────
  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      const navCollapse = document.getElementById('navbarNav');
      if (navCollapse && navCollapse.classList.contains('show')) {
        const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
        if (bsCollapse) bsCollapse.hide();
      }
    });
  });

})();

// ── Count-up animation for stats ─────────────────────────────
(function () {
  const counters = document.querySelectorAll('.count-up');
  if (!counters.length) return;

  function animateCounter(el) {
    const target  = parseInt(el.dataset.target, 10);
    const suffix  = el.dataset.suffix || '';
    const duration = 1600; // ms
    const steps    = 40;
    const interval = duration / steps;
    let current    = 0;

    const timer = setInterval(() => {
      current += Math.ceil(target / steps);
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = current + suffix;
    }, interval);
  }

  // Use IntersectionObserver — animate when stats scroll into view
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target); // run only once
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
})();
