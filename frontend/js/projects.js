/* ============================================================
   projects.js — Static project cards + category filter
   In Phase 3 these will be replaced with live API calls
   ============================================================ */

(function () {
  // ── Sample Projects Data ──────────────────────────────────────
  const projects = [
    {
      id: 1,
      title: 'AI Portfolio CMS',
      category: 'ai-agents',
      categoryLabel: 'AI Agents',
      description: 'A production-grade AI-powered portfolio CMS with dynamic project management, hidden admin dashboard, and an AI assistant with RAG and tool-calling.',
      image: 'https://placehold.co/600x360/111111/FFFFFF?text=AI+Portfolio+CMS',
      tags: ['FastAPI', 'Python', 'PostgreSQL', 'Grok API', 'RAG'],
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      demo: '#',
    },
    {
      id: 2,
      title: 'E-Commerce Platform',
      category: 'website',
      categoryLabel: 'Website',
      description: 'Full-stack e-commerce platform with product catalog, cart, checkout, payment integration, and an admin panel for inventory management.',
      image: 'https://placehold.co/600x360/111111/FFFFFF?text=E-Commerce+Platform',
      tags: ['React', 'Node.js', 'MongoDB', 'Stripe', 'Bootstrap'],
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      demo: '#',
    },
    {
      id: 3,
      title: 'AI Customer Support Agent',
      category: 'ai-automation',
      categoryLabel: 'AI Automation',
      description: 'Intelligent customer support agent with memory, multi-turn conversations, ticket creation, and seamless handoff to human agents.',
      image: 'https://placehold.co/600x360/111111/FFFFFF?text=AI+Support+Agent',
      tags: ['LangChain', 'FastAPI', 'OpenAI', 'Redis', 'Python'],
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      demo: null,
    },
    {
      id: 4,
      title: 'Sentiment Analysis Dashboard',
      category: 'machine-learning',
      categoryLabel: 'Machine Learning',
      description: 'Real-time sentiment analysis of social media posts using NLP. Dashboard shows trends, insights, and exportable reports.',
      image: 'https://placehold.co/600x360/111111/FFFFFF?text=Sentiment+Analysis',
      tags: ['Python', 'scikit-learn', 'NLTK', 'FastAPI', 'Chart.js'],
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      demo: '#',
    },
    {
      id: 5,
      title: 'Fitness Tracker App',
      category: 'mobile-apps',
      categoryLabel: 'Mobile Apps',
      description: 'Cross-platform fitness tracking app built with React Native. Features workout logging, progress charts, and push notifications.',
      image: 'https://placehold.co/600x360/111111/FFFFFF?text=Fitness+Tracker',
      tags: ['React Native', 'Expo', 'Node.js', 'MongoDB', 'Firebase'],
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      demo: null,
    },
    {
      id: 6,
      title: 'Web Scraping Automation',
      category: 'python',
      categoryLabel: 'Python Projects',
      description: 'Automated web scraper that extracts data from multiple sources, cleans it, and exports structured reports to CSV and Google Sheets.',
      image: 'https://placehold.co/600x360/111111/FFFFFF?text=Web+Scraping',
      tags: ['Python', 'Selenium', 'BeautifulSoup', 'Pandas', 'gspread'],
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      demo: null,
    },
  ];

  // ── DOM References ────────────────────────────────────────────
  const grid        = document.getElementById('projectsGrid');
  const filterBtns  = document.querySelectorAll('.filter-btn');
  if (!grid) return;

  // ── Render a single card ──────────────────────────────────────
  function renderCard(project) {
    const tagsHTML = project.tags
      .map(t => `<span class="project-tag">${t}</span>`)
      .join('');

    const demoBtn = project.demo
      ? `<a href="${project.demo}" target="_blank" rel="noopener" class="btn btn-primary-custom project-demo-btn">Live Demo</a>`
      : '';

    return `
      <div class="col-lg-4 col-md-6 project-card-col" data-category="${project.category}" data-aos="fade-up">
        <div class="project-card">
          <img src="${project.image}" alt="${project.title}" class="project-card-img" loading="lazy" />
          <div class="project-card-body">
            <span class="project-category-badge">${project.categoryLabel}</span>
            <h5 class="project-card-title">${project.title}</h5>
            <p class="project-card-desc">${project.description}</p>
            <div class="project-tags">${tagsHTML}</div>
            <div class="project-card-actions">
              <a href="${project.github}" target="_blank" rel="noopener" class="project-action-icon" aria-label="GitHub">
                <i class="bi bi-github"></i>
              </a>
              <a href="${project.linkedin}" target="_blank" rel="noopener" class="project-action-icon" aria-label="LinkedIn Post">
                <i class="bi bi-linkedin"></i>
              </a>
              ${demoBtn}
            </div>
          </div>
        </div>
      </div>`;
  }

  // ── Initial render ────────────────────────────────────────────
  function renderAll(filter) {
    const filtered = filter === 'all'
      ? projects
      : projects.filter(p => p.category === filter);

    grid.innerHTML = filtered.map(renderCard).join('');

    // Re-init AOS for newly added elements
    if (typeof AOS !== 'undefined') AOS.refresh();
  }

  renderAll('all');

  // ── Category Filter ───────────────────────────────────────────
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderAll(btn.dataset.filter);
    });
  });
})();
