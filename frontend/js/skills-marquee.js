/* ============================================================
   skills-marquee.js — Infinite icon-only marquee with hover tooltip
   ============================================================ */

(function () {
  // ── Skill Data ──────────────────────────────────────────────
  // Using Devicons CDN for colored tech icons
  const DEVICONS = 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons';

  const skills = [
    // ── Frontend ──────────────────────────────────────────────
    { name: 'HTML5',          icon: `${DEVICONS}/html5/html5-original.svg`,                  expertise: 95, years: '5+ Years' },
    { name: 'CSS3',           icon: `${DEVICONS}/css3/css3-original.svg`,                    expertise: 92, years: '5+ Years' },
    { name: 'JavaScript',     icon: `${DEVICONS}/javascript/javascript-original.svg`,         expertise: 90, years: '4+ Years' },
    { name: 'Bootstrap',      icon: `${DEVICONS}/bootstrap/bootstrap-original.svg`,          expertise: 90, years: '4+ Years' },
    { name: 'TailwindCSS',    icon: `${DEVICONS}/tailwindcss/tailwindcss-original.svg`,      expertise: 85, years: '2+ Years' },
    { name: 'React',          icon: `${DEVICONS}/react/react-original.svg`,                   expertise: 88, years: '3+ Years' },
    { name: 'React Native',   icon: `${DEVICONS}/react/react-original.svg`,                   expertise: 82, years: '2+ Years' },
    // ── Backend ───────────────────────────────────────────────
    { name: 'Python',         icon: `${DEVICONS}/python/python-original.svg`,                expertise: 95, years: '4+ Years' },
    { name: 'FastAPI',        icon: `${DEVICONS}/fastapi/fastapi-original.svg`,              expertise: 92, years: '3+ Years' },
    { name: 'Node.js',        icon: `${DEVICONS}/nodejs/nodejs-original.svg`,               expertise: 80, years: '3+ Years' },
    { name: 'Express.js',     icon: `${DEVICONS}/express/express-original.svg`,             expertise: 78, years: '3+ Years' },
    // ── Databases ─────────────────────────────────────────────
    { name: 'PostgreSQL',     icon: `${DEVICONS}/postgresql/postgresql-original.svg`,        expertise: 85, years: '3+ Years' },
    { name: 'MongoDB',        icon: `${DEVICONS}/mongodb/mongodb-original.svg`,              expertise: 80, years: '2+ Years' },
    { name: 'Vector DB',      icon: `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/apachekafka/apachekafka-original.svg`, expertise: 75, years: '1+ Years' },
    // ── DevOps & Tools ────────────────────────────────────────
    { name: 'Docker',         icon: `${DEVICONS}/docker/docker-original.svg`,               expertise: 78, years: '2+ Years' },
    { name: 'Git',            icon: `${DEVICONS}/git/git-original.svg`,                     expertise: 93, years: '4+ Years' },
    // ── AI / ML ───────────────────────────────────────────────
    { name: 'LangChain',      icon: 'https://avatars.githubusercontent.com/u/126733545?s=200&v=4', expertise: 88, years: '2+ Years' },
    { name: 'OpenAI',         icon: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg', expertise: 85, years: '2+ Years' },
    { name: 'Hugging Face',   icon: 'https://huggingface.co/front/assets/huggingface_logo-noborder.svg', expertise: 78, years: '1+ Years' },
    { name: 'n8n',            icon: 'https://avatars.githubusercontent.com/u/45487711?s=200&v=4', expertise: 80, years: '1+ Years' },
    { name: 'RAG',            icon: `${DEVICONS}/python/python-original.svg`,               expertise: 82, years: '1+ Years' },
    { name: 'TypeScript',     icon: `${DEVICONS}/typescript/typescript-original.svg`,        expertise: 80, years: '2+ Years' },
    { name: 'Figma',          icon: `${DEVICONS}/figma/figma-original.svg`,                 expertise: 72, years: '2+ Years' },
    { name: 'AWS',            icon: `${DEVICONS}/amazonwebservices/amazonwebservices-plain-wordmark.svg`, expertise: 70, years: '1+ Years' },
  ];

  // ── DOM References ───────────────────────────────────────────
  const track   = document.getElementById('skillsTrack');
  const tooltip = document.getElementById('skillTooltip');
  const tipName  = document.getElementById('tooltipName');
  const tipExp   = document.getElementById('tooltipExp');
  const tipYears = document.getElementById('tooltipYears');
  const marquee  = document.getElementById('skillsMarquee');

  if (!track || !tooltip) return;

  // ── Build icon items (doubled for seamless loop) ─────────────
  function createItem(skill) {
    const div = document.createElement('div');
    div.className = 'skill-icon-item';
    div.setAttribute('data-name',     skill.name);
    div.setAttribute('data-exp',      skill.expertise);
    div.setAttribute('data-years',    skill.years);
    div.setAttribute('aria-label',    skill.name);
    div.setAttribute('role',          'img');

    const img = document.createElement('img');
    img.src     = skill.icon;
    img.alt     = skill.name;
    img.loading = 'lazy';

    // Always-visible name label below icon
    const label = document.createElement('span');
    label.className   = 'skill-icon-label';
    label.textContent = skill.name;

    div.appendChild(img);
    div.appendChild(label);
    return div;
  }

  // Render skills twice so the marquee loops seamlessly
  const allSkills = [...skills, ...skills];
  allSkills.forEach(skill => track.appendChild(createItem(skill)));

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

    // Keep inside viewport
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

  // Delegate events on the track
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

  // ── Pause marquee on hover over wrapper ───────────────────────
  if (marquee) {
    marquee.addEventListener('mouseenter', () => track.style.animationPlayState = 'paused');
    marquee.addEventListener('mouseleave', () => track.style.animationPlayState = 'running');
  }
})();
