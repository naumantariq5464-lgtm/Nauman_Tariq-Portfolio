/* ============================================================
   skills-marquee.js — Infinite icon-only marquee with hover tooltip
   Smooth JS-driven scroll — no CSS animation jump on loop reset
   ============================================================ */

(function () {
  const DEVICONS = 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons';

  const skills = [
    // ── Frontend ──────────────────────────────────────────────
    { name: 'HTML5',        icon: `${DEVICONS}/html5/html5-original.svg`,                       expertise: 95, years: '5+ Years' },
    { name: 'CSS3',         icon: `${DEVICONS}/css3/css3-original.svg`,                         expertise: 92, years: '5+ Years' },
    { name: 'JavaScript',   icon: `${DEVICONS}/javascript/javascript-original.svg`,              expertise: 90, years: '4+ Years' },
    { name: 'Bootstrap',    icon: `${DEVICONS}/bootstrap/bootstrap-original.svg`,               expertise: 90, years: '4+ Years' },
    { name: 'TailwindCSS',  icon: `${DEVICONS}/tailwindcss/tailwindcss-original.svg`,           expertise: 85, years: '2+ Years' },
    { name: 'React',        icon: `${DEVICONS}/react/react-original.svg`,                        expertise: 88, years: '3+ Years' },
    { name: 'React Native', icon: `${DEVICONS}/react/react-original.svg`,                        expertise: 82, years: '2+ Years' },
    // ── Backend ───────────────────────────────────────────────
    { name: 'Python',       icon: `${DEVICONS}/python/python-original.svg`,                     expertise: 95, years: '4+ Years' },
    { name: 'FastAPI',      icon: `${DEVICONS}/fastapi/fastapi-original.svg`,                   expertise: 92, years: '3+ Years' },
    { name: 'Node.js',      icon: `${DEVICONS}/nodejs/nodejs-original.svg`,                    expertise: 80, years: '3+ Years' },
    { name: 'Express.js',   icon: `${DEVICONS}/express/express-original.svg`,                  expertise: 78, years: '3+ Years' },
    // ── Databases ─────────────────────────────────────────────
    { name: 'PostgreSQL',   icon: `${DEVICONS}/postgresql/postgresql-original.svg`,             expertise: 85, years: '3+ Years' },
    { name: 'MongoDB',      icon: `${DEVICONS}/mongodb/mongodb-original.svg`,                   expertise: 80, years: '2+ Years' },
    { name: 'MySQL',        icon: `${DEVICONS}/mysql/mysql-original.svg`,                       expertise: 80, years: '2+ Years' },
    // Vector DB — use a generic vector/database icon
    { name: 'Vector DB',    icon: `${DEVICONS}/cosmosdb/cosmosdb-original.svg`,               expertise: 75, years: '1+ Years' },
    // ── DevOps & Tools ────────────────────────────────────────
    { name: 'Docker',       icon: `${DEVICONS}/docker/docker-original.svg`,                    expertise: 78, years: '2+ Years' },
    { name: 'Git',          icon: `${DEVICONS}/git/git-original.svg`,                          expertise: 93, years: '4+ Years' },
    { name: 'AWS',          icon: `${DEVICONS}/amazonwebservices/amazonwebservices-plain-wordmark.svg`, expertise: 70, years: '1+ Years' },
    // ── AI / ML ───────────────────────────────────────────────
    // LangChain — official GitHub org avatar
    { name: 'LangChain',    icon: 'https://avatars.githubusercontent.com/u/126733545?s=200&v=4', expertise: 88, years: '2+ Years' },
    // LangGraph — same LangChain icon (same org)
    { name: 'LangGraph',    icon: 'https://avatars.githubusercontent.com/u/126733545?s=200&v=4', expertise: 80, years: '1+ Years' },
    // OpenAI
    { name: 'OpenAI',       icon: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg', expertise: 85, years: '2+ Years' },
    // Hugging Face
    { name: 'Hugging Face', icon: 'https://huggingface.co/front/assets/huggingface_logo-noborder.svg', expertise: 78, years: '1+ Years' },
    // n8n — official logo
    { name: 'n8n',          icon: 'https://avatars.githubusercontent.com/u/45487711?s=200&v=4', expertise: 80, years: '1+ Years' },
    // RAG — use a vector/database icon to represent Retrieval-Augmented Generation
    { name: 'RAG',          icon: `${DEVICONS}/redis/redis-original.svg`,                      expertise: 82, years: '1+ Years' },
    { name: 'TypeScript',   icon: `${DEVICONS}/typescript/typescript-original.svg`,             expertise: 80, years: '2+ Years' },
    { name: 'Figma',        icon: `${DEVICONS}/figma/figma-original.svg`,                      expertise: 72, years: '2+ Years' },
  ];

  // ── DOM References ───────────────────────────────────────────
  const track   = document.getElementById('skillsTrack');
  const tooltip = document.getElementById('skillTooltip');
  const tipName  = document.getElementById('tooltipName');
  const tipExp   = document.getElementById('tooltipExp');
  const tipYears = document.getElementById('tooltipYears');
  const marquee  = document.getElementById('skillsMarquee');

  if (!track || !tooltip) return;

  // ── Build icon item ───────────────────────────────────────────
  function createItem(skill) {
    const div = document.createElement('div');
    div.className = 'skill-icon-item';
    div.setAttribute('data-name',  skill.name);
    div.setAttribute('data-exp',   skill.expertise);
    div.setAttribute('data-years', skill.years);
    div.setAttribute('aria-label', skill.name);
    div.setAttribute('role',       'img');

    const img = document.createElement('img');
    img.src     = skill.icon;
    img.alt     = skill.name;
    img.loading = 'lazy';
    // Fallback: show name text if icon fails to load
    img.onerror = function () { this.style.display = 'none'; };

    const label = document.createElement('span');
    label.className   = 'skill-icon-label';
    label.textContent = skill.name;

    div.appendChild(img);
    div.appendChild(label);
    return div;
  }

  // ── Render: original set + exact clone for seamless loop ─────
  // We render skills once, measure the width, then clone
  skills.forEach(skill => track.appendChild(createItem(skill)));

  // After first render, clone the whole set to make loop seamless
  // We wait for images to settle before measuring
  function initLoop() {
    // Clone all current children (the original set)
    const originals = Array.from(track.children);
    originals.forEach(child => track.appendChild(child.cloneNode(true)));

    // ── JS-driven smooth scroll (replaces CSS animation) ─────
    // This avoids the hard-jump that CSS animation reset causes
    let offset    = 0;
    let paused    = false;
    const SPEED   = 0.6; // px per frame — tweak for faster/slower
    let rafId     = null;

    function getHalfWidth() {
      // Half the track = width of one full set of icons
      return track.scrollWidth / 2;
    }

    function step() {
      if (!paused) {
        offset += SPEED;
        const half = getHalfWidth();
        // When we've scrolled exactly one full set, reset silently to 0
        if (offset >= half) {
          offset = offset - half; // keep sub-pixel remainder for smoothness
        }
        track.style.transform = `translate3d(-${offset}px, 0, 0)`;
      }
      rafId = requestAnimationFrame(step);
    }

    rafId = requestAnimationFrame(step);

    // Pause on hover
    if (marquee) {
      marquee.addEventListener('mouseenter', () => { paused = true; });
      marquee.addEventListener('mouseleave', () => { paused = false; });
    }
  }

  // Small delay so layout is painted and widths are correct
  setTimeout(initLoop, 100);

  // ── Tooltip Logic ─────────────────────────────────────────────
  let tooltipVisible = false;

  function showTooltip(e, item) {
    tipName.textContent  = item.dataset.name;
    tipExp.textContent   = `Expertise ${item.dataset.exp}%`;
    tipYears.textContent = item.dataset.years;
    tooltip.classList.add('visible');
    tooltipVisible = true;
    positionTooltip(e);
  }

  function positionTooltip(e) {
    const tw = tooltip.offsetWidth  || 170;
    const th = tooltip.offsetHeight || 80;
    let   x  = e.clientX - tw / 2;
    let   y  = e.clientY - th - 14;

    if (x < 8) x = 8;
    if (x + tw > window.innerWidth - 8) x = window.innerWidth - tw - 8;
    if (y < 8) y = e.clientY + 20;

    tooltip.style.left = x + 'px';
    tooltip.style.top  = y + 'px';
  }

  function hideTooltip() {
    tooltip.classList.remove('visible');
    tooltipVisible = false;
  }

  track.addEventListener('mouseover', function (e) {
    const item = e.target.closest('.skill-icon-item');
    if (item) showTooltip(e, item);
  });

  track.addEventListener('mousemove', function (e) {
    if (tooltipVisible) positionTooltip(e);
  });

  track.addEventListener('mouseout', function (e) {
    const item = e.target.closest('.skill-icon-item');
    if (item) hideTooltip();
  });

})();
