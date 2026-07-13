/* ============================================================
   projects.js — Fetch projects from FastAPI backend
   Falls back to static placeholder if API is unreachable
   ============================================================ */

(function () {

  const grid       = document.getElementById('projectsGrid');
  const filterBtns = document.querySelectorAll('.filter-btn');
  if (!grid) return;

  let allProjects = [];

  // ── Fallback static data (shown when API is offline) ──────
  const FALLBACK = [
    {
      id: 1, title: 'AI Portfolio CMS',
      category: { name: 'AI Agents', slug: 'ai-agents' },
      description: 'Production-grade AI-powered portfolio CMS with dynamic project management, hidden admin dashboard, and an AI assistant with RAG and tool-calling.',
      image_url: 'https://placehold.co/600x360/111111/FFFFFF?text=AI+Portfolio+CMS',
      skills_tags: 'FastAPI,Python,PostgreSQL,Grok API,RAG',
      github_link: 'https://github.com', linkedin_link: 'https://linkedin.com', demo_link: '#',
    },
    {
      id: 2, title: 'E-Commerce Platform',
      category: { name: 'Website', slug: 'website' },
      description: 'Full-stack e-commerce platform with product catalog, cart, checkout, payment integration, and admin panel for inventory management.',
      image_url: 'https://placehold.co/600x360/111111/FFFFFF?text=E-Commerce+Platform',
      skills_tags: 'React,Node.js,MongoDB,Stripe,Bootstrap',
      github_link: 'https://github.com', linkedin_link: 'https://linkedin.com', demo_link: '#',
    },
    {
      id: 3, title: 'AI Customer Support Agent',
      category: { name: 'AI Automation', slug: 'ai-automation' },
      description: 'Intelligent customer support agent with memory, multi-turn conversations, ticket creation, and seamless handoff to human agents.',
      image_url: 'https://placehold.co/600x360/111111/FFFFFF?text=AI+Support+Agent',
      skills_tags: 'LangChain,FastAPI,OpenAI,Redis,Python',
      github_link: 'https://github.com', linkedin_link: 'https://linkedin.com', demo_link: null,
    },
    {
      id: 4, title: 'Sentiment Analysis Dashboard',
      category: { name: 'Machine Learning', slug: 'machine-learning' },
      description: 'Real-time sentiment analysis of social media posts using NLP. Dashboard shows trends, insights, and exportable reports.',
      image_url: 'https://placehold.co/600x360/111111/FFFFFF?text=Sentiment+Analysis',
      skills_tags: 'Python,scikit-learn,NLTK,FastAPI,Chart.js',
      github_link: 'https://github.com', linkedin_link: 'https://linkedin.com', demo_link: '#',
    },
    {
      id: 5, title: 'Fitness Tracker App',
      category: { name: 'Mobile Apps', slug: 'mobile-apps' },
      description: 'Cross-platform fitness tracking app built with React Native. Features workout logging, progress charts, and push notifications.',
      image_url: 'https://placehold.co/600x360/111111/FFFFFF?text=Fitness+Tracker',
      skills_tags: 'React Native,Expo,Node.js,MongoDB,Firebase',
      github_link: 'https://github.com', linkedin_link: 'https://linkedin.com', demo_link: null,
    },
    {
      id: 6, title: 'Web Scraping Automation',
      category: { name: 'Python Projects', slug: 'python' },
      description: 'Automated web scraper that extracts data from multiple sources, cleans it, and exports structured reports to CSV and Google Sheets.',
      image_url: 'https://placehold.co/600x360/111111/FFFFFF?text=Web+Scraping',
      skills_tags: 'Python,Selenium,BeautifulSoup,Pandas,gspread',
      github_link: 'https://github.com', linkedin_link: 'https://linkedin.com', demo_link: null,
    },
  ];

  // ── Fetch from API ─────────────────────────────────────────
  async function loadProjects() {
    try {
      const res = await fetch(CONFIG.API_BASE_URL + '/projects/');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      allProjects = data.projects && data.projects.length > 0 ? data.projects : FALLBACK;
    } catch {
      allProjects = FALLBACK;
    }
    renderAll('all');
    buildFilters();
  }

  // ── Build dynamic filter buttons from live categories ─────
  function buildFilters() {
    const slugs = new Set(allProjects.map(p => p.category?.slug).filter(Boolean));
    const names = {};
    allProjects.forEach(p => { if (p.category) names[p.category.slug] = p.category.name; });

    // Keep existing All button, replace the rest
    const container = document.querySelector('.project-filters');
    if (!container) return;

    container.innerHTML = `<button class="filter-btn active" data-filter="all">All</button>`;
    slugs.forEach(slug => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.dataset.filter = slug;
      btn.textContent = names[slug];
      container.appendChild(btn);
    });

    container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        renderAll(this.dataset.filter);
      });
    });
  }

  // ── Render card ────────────────────────────────────────────
  function renderCard(p) {
    const tags = p.skills_tags
      ? p.skills_tags.split(',').map(t => `<span class="project-tag">${t.trim()}</span>`).join('')
      : '';

    const demoBtn = p.demo_link
      ? `<a href="${p.demo_link}" target="_blank" rel="noopener" class="btn btn-primary-custom project-demo-btn">Live Demo</a>`
      : '';

    const cat = p.category ? p.category.name : 'Project';
    const catSlug = p.category ? p.category.slug : '';

    return `
      <div class="col-lg-4 col-md-6 project-card-col" data-category="${catSlug}" data-aos="fade-up">
        <div class="project-card">
          <img src="${p.image_url || 'https://placehold.co/600x360/111111/FFFFFF?text=' + encodeURIComponent(p.title)}"
               alt="${p.title}" class="project-card-img" loading="lazy"
               onerror="this.src='https://placehold.co/600x360/111111/FFFFFF?text=Project'" />
          <div class="project-card-body">
            <span class="project-category-badge">${cat}</span>
            <h5 class="project-card-title">${p.title}</h5>
            <p class="project-card-desc">${p.description}</p>
            <div class="project-tags">${tags}</div>
            <div class="project-card-actions">
              ${p.github_link ? `<a href="${p.github_link}" target="_blank" rel="noopener" class="project-action-icon" aria-label="GitHub"><i class="bi bi-github"></i></a>` : ''}
              ${p.linkedin_link ? `<a href="${p.linkedin_link}" target="_blank" rel="noopener" class="project-action-icon" aria-label="LinkedIn"><i class="bi bi-linkedin"></i></a>` : ''}
              ${demoBtn}
            </div>
          </div>
        </div>
      </div>`;
  }

  // ── Filter & render ────────────────────────────────────────
  function renderAll(filter) {
    const filtered = filter === 'all'
      ? allProjects
      : allProjects.filter(p => p.category?.slug === filter);

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="col-12 text-center py-5"><p class="text-muted">No projects found.</p></div>`;
      return;
    }

    grid.innerHTML = filtered.map(renderCard).join('');
    if (typeof AOS !== 'undefined') AOS.refresh();
  }

  // ── Init ───────────────────────────────────────────────────
  loadProjects();

})();
