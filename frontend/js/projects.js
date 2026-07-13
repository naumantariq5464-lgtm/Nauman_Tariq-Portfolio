/* ============================================================
   projects.js — Fetch projects from FastAPI backend
   No hardcoded fallback — shows "No projects available" when API
   returns empty or is unreachable
   ============================================================ */

(function () {

  const grid       = document.getElementById('projectsGrid');
  const filterBtns = document.querySelector('.project-filters');
  if (!grid) return;

  let allProjects  = [];
  let activeFilter = 'all';

  // ── Empty state HTML ──────────────────────────────────────
  function emptyState(msg) {
    return `
      <div class="col-12" data-aos="fade-up">
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
      <div class="col-12 text-center py-5" data-aos="fade-up">
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
      // API unreachable — show empty state, no fake data
      allProjects = [];
    }

    buildFilters();
    renderAll('all');
  }

  // ── Build filter buttons from live categories only ────────
  function buildFilters() {
    if (!filterBtns) return;

    // Always keep "All" button
    filterBtns.innerHTML = `<button class="filter-btn active" data-filter="all">All</button>`;

    // Only add categories that actually have projects
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

    // Re-attach click handlers
    filterBtns.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        filterBtns.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        activeFilter = this.dataset.filter;
        renderAll(activeFilter);
      });
    });
  }

  // ── Render a single card ──────────────────────────────────
  function renderCard(p) {
    const tags = p.skills_tags
      ? p.skills_tags.split(',').map(t =>
          `<span class="project-tag">${t.trim()}</span>`).join('')
      : '';

    const demoBtn = p.demo_link
      ? `<a href="${p.demo_link}" target="_blank" rel="noopener"
            class="btn btn-primary-custom project-demo-btn">Live Demo</a>`
      : '';

    const img = p.image_url
      ? p.image_url
      : `https://placehold.co/600x360/111111/FFFFFF?text=${encodeURIComponent(p.title)}`;

    return `
      <div class="col-lg-4 col-md-6 project-card-col"
           data-category="${p.category?.slug || ''}"
           data-aos="fade-up">
        <div class="project-card">
          <img src="${img}" alt="${p.title}"
               class="project-card-img" loading="lazy"
               onerror="this.src='https://placehold.co/600x360/f5f5f5/999?text=Project'" />
          <div class="project-card-body">
            <span class="project-category-badge">${p.category?.name || 'Project'}</span>
            <h5 class="project-card-title">${p.title}</h5>
            <p class="project-card-desc">${p.description}</p>
            <div class="project-tags">${tags}</div>
            <div class="project-card-actions">
              ${p.github_link
                ? `<a href="${p.github_link}" target="_blank" rel="noopener"
                      class="project-action-icon" aria-label="GitHub">
                     <i class="bi bi-github"></i></a>`
                : ''}
              ${p.linkedin_link
                ? `<a href="${p.linkedin_link}" target="_blank" rel="noopener"
                      class="project-action-icon" aria-label="LinkedIn Post">
                     <i class="bi bi-linkedin"></i></a>`
                : ''}
              ${demoBtn}
            </div>
          </div>
        </div>
      </div>`;
  }

  // ── Filter & render grid ──────────────────────────────────
  function renderAll(filter) {
    const filtered = filter === 'all'
      ? allProjects
      : allProjects.filter(p => p.category?.slug === filter);

    if (allProjects.length === 0) {
      // No projects in DB at all
      grid.innerHTML = emptyState('No projects available yet.');
      return;
    }

    if (filtered.length === 0) {
      // Category selected but no projects in it
      const catName = filterBtns?.querySelector(`[data-filter="${filter}"]`)?.textContent || filter;
      grid.innerHTML = emptyState(`No projects in "${catName}" yet.`);
      return;
    }

    grid.innerHTML = filtered.map(renderCard).join('');
    if (typeof AOS !== 'undefined') AOS.refresh();
  }

  // ── Init ─────────────────────────────────────────────────
  loadProjects();

})();
