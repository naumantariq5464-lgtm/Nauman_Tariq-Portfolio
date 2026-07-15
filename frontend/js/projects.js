/* ============================================================
   projects.js — Projects with horizontal slider
   • All filter    → single slider with ALL projects
   • Category filter → single slider with that category's projects
   • 1 project only  → normal centered card (no slider)
   ============================================================ */

(function () {

  const grid       = document.getElementById('projectsGrid');
  const filterBtns = document.querySelector('.project-filters');
  if (!grid) return;

  let allProjects  = [];
  let activeFilter = 'all';

  // ── Empty state ───────────────────────────────────────────
  function emptyState(msg) {
    return `
      <div class="col-12">
        <div class="projects-empty-state">
          <i class="bi bi-folder2-open"></i>
          <h5>${msg}</h5>
          <p>Check back soon — new projects are being added regularly.</p>
        </div>
      </div>`;
  }

  // ── Loading state ─────────────────────────────────────────
  function loadingState() {
    return `
      <div class="col-12 text-center py-5">
        <div class="projects-loading">
          <div class="spinner-border spinner-border-sm me-2" role="status" style="color:var(--black);"></div>
          <span style="color:var(--gray-mid); font-size:0.9rem;">Loading projects...</span>
        </div>
      </div>`;
  }

  // ── Fetch from API ────────────────────────────────────────
  async function loadProjects() {
    grid.innerHTML = loadingState();
    try {
      const res = await fetch(CONFIG.API_BASE_URL + '/projects/');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      allProjects = Array.isArray(data.projects) ? data.projects : [];
    } catch {
      allProjects = [];
    }
    buildFilters();
    renderAll('all');
  }

  // ── Build filter buttons ──────────────────────────────────
  function buildFilters() {
    if (!filterBtns) return;
    filterBtns.innerHTML = `<button class="filter-btn active" data-filter="all">All</button>`;
    const seen = new Set();
    allProjects.forEach(p => {
      if (p.category && !seen.has(p.category.slug)) {
        seen.add(p.category.slug);
        const btn = document.createElement('button');
        btn.className      = 'filter-btn';
        btn.dataset.filter = p.category.slug;
        btn.textContent    = p.category.name;
        filterBtns.appendChild(btn);
      }
    });
    filterBtns.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        filterBtns.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        activeFilter = this.dataset.filter;
        renderAll(activeFilter);
      });
    });
  }

  // ── Single project card HTML ──────────────────────────────
  function cardHTML(p) {
    const tags = p.skills_tags
      ? p.skills_tags.split(',').map(t => `<span class="project-tag">${t.trim()}</span>`).join('')
      : '';
    const img = p.image_url
      ? p.image_url
      : `https://placehold.co/600x360/111111/FFFFFF?text=${encodeURIComponent(p.title)}`;
    const demoBtn = p.demo_link
      ? `<a href="${p.demo_link}" target="_blank" rel="noopener" class="btn btn-primary-custom project-demo-btn">Live Demo</a>`
      : '';
    return `
      <div class="project-card">
        <img src="${img}" alt="${p.title}" class="project-card-img" loading="lazy"
             onerror="this.src='https://placehold.co/600x360/f5f5f5/999?text=Project'" />
        <div class="project-card-body">
          <span class="project-category-badge">${p.category?.name || 'Project'}</span>
          <h5 class="project-card-title">${p.title}</h5>
          <p class="project-card-desc">${p.description}</p>
          <div class="project-tags">${tags}</div>
          <div class="project-card-actions">
            ${p.github_link
              ? `<a href="${p.github_link}" target="_blank" rel="noopener" class="project-action-icon" aria-label="GitHub"><i class="bi bi-github"></i></a>`
              : ''}
            ${p.linkedin_link
              ? `<a href="${p.linkedin_link}" target="_blank" rel="noopener" class="project-action-icon" aria-label="LinkedIn"><i class="bi bi-linkedin"></i></a>`
              : ''}
            ${demoBtn}
          </div>
        </div>
      </div>`;
  }

  // ── Render the full projects area ─────────────────────────
  function renderAll(filter) {
    if (allProjects.length === 0) {
      grid.innerHTML = emptyState('No projects available yet.');
      return;
    }

    const list = filter === 'all'
      ? allProjects
      : allProjects.filter(p => p.category?.slug === filter);

    if (list.length === 0) {
      const catName = filterBtns?.querySelector(`[data-filter="${filter}"]`)?.textContent || filter;
      grid.innerHTML = emptyState(`No projects in "${catName}" yet.`);
      return;
    }

    // Only 1 project — show a centered card, no slider needed
    if (list.length === 1) {
      grid.innerHTML = `
        <div class="col-lg-4 col-md-6 mx-auto project-card-col" data-aos="fade-up">
          ${cardHTML(list[0])}
        </div>`;
      if (typeof AOS !== 'undefined') AOS.refresh();
      return;
    }

    // 2+ projects — build slider
    const sliderId = filter === 'all' ? 'main' : filter;
    const slides   = list.map(p => `
      <div class="proj-slide">${cardHTML(p)}</div>
    `).join('');

    grid.innerHTML = `
      <div class="col-12" data-aos="fade-up">

        <!-- Slider viewport -->
        <div class="proj-slider-wrapper">
          <div class="proj-slider-track" id="track-${sliderId}">
            ${slides}
          </div>
        </div>

        <!-- Controls: prev  dots  next -->
        <div class="proj-slider-controls">
          <button class="proj-slider-btn" id="prev-${sliderId}" aria-label="Previous project">
            <i class="bi bi-chevron-left"></i>
          </button>
          <div class="proj-slider-dots" id="dots-${sliderId}"></div>
          <button class="proj-slider-btn" id="next-${sliderId}" aria-label="Next project">
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>

        <!-- Counter: 1 / 5 -->
        <p class="proj-slider-counter" id="counter-${sliderId}">1 / ${list.length}</p>

      </div>`;

    if (typeof AOS !== 'undefined') AOS.refresh();
    initSlider(sliderId, list.length);
  }

  // ── Wire up slider behaviour ──────────────────────────────
  function initSlider(sliderId, total) {
    const track   = document.getElementById(`track-${sliderId}`);
    const prevBtn = document.getElementById(`prev-${sliderId}`);
    const nextBtn = document.getElementById(`next-${sliderId}`);
    const dotsEl  = document.getElementById(`dots-${sliderId}`);
    const counter = document.getElementById(`counter-${sliderId}`);
    if (!track) return;

    let current = 0;

    // Build dots
    for (let i = 0; i < total; i++) {
      const dot = document.createElement('span');
      dot.className = 'proj-dot' + (i === 0 ? ' active' : '');
      dot.addEventListener('click', () => goTo(i));
      dotsEl.appendChild(dot);
    }

    function goTo(index) {
      current = (index + total) % total;   // wraps around
      track.style.transform = `translateX(-${current * 100}%)`;
      dotsEl.querySelectorAll('.proj-dot').forEach((d, i) =>
        d.classList.toggle('active', i === current)
      );
      if (counter) counter.textContent = `${current + 1} / ${total}`;
    }

    prevBtn.addEventListener('click', () => goTo(current - 1));
    nextBtn.addEventListener('click', () => goTo(current + 1));

    // Swipe support (mobile)
    let startX = 0;
    track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend',   e => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) diff > 0 ? goTo(current + 1) : goTo(current - 1);
    }, { passive: true });
  }

  loadProjects();

})();
