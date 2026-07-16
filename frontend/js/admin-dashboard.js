/* ============================================================
   admin-dashboard.js — Full Admin Dashboard Logic
   Handles: Overview, Projects CRUD, Categories CRUD, Messages
   ============================================================ */

(function () {

  // ── Auth guard ────────────────────────────────────────────
  if (!Auth.isLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }

  // ── State ─────────────────────────────────────────────────
  let projects   = [];
  let categories = [];
  let messages   = [];
  let currentMsg = null;

  // ── Toast ─────────────────────────────────────────────────
  function toast(msg, duration = 2800) {
    const t = document.getElementById('adminToast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), duration);
  }

  // ── API helper ────────────────────────────────────────────
  async function api(path, opts = {}) {
    try {
      const res = await apiFetch(path, opts);
      if (!res) return null;
      if (res.status === 204) return {};
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'Server error');
      return data;
    } catch (err) {
      toast('Error: ' + err.message);
      return null;
    }
  }

  // ── Navigation ────────────────────────────────────────────
  const sidebarLinks = document.querySelectorAll('.sidebar-link[data-section]');
  const sections     = document.querySelectorAll('.admin-section');
  const headerTitle  = document.getElementById('headerTitle');

  sidebarLinks.forEach(link => {
    link.addEventListener('click', function () {
      const sec = this.dataset.section;
      sidebarLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
      sections.forEach(s => s.classList.remove('active'));
      document.getElementById('section-' + sec)?.classList.add('active');
      headerTitle.textContent = this.textContent.trim();
      closeSidebarMobile();

      if (sec === 'overview')   loadOverview();
      if (sec === 'projects')   loadProjects();
      if (sec === 'categories') loadCategories();
      if (sec === 'messages')   loadMessages();
    });
  });

  // ── Sidebar mobile toggle ─────────────────────────────────
  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    document.getElementById('adminSidebar')?.classList.toggle('open');
  });
  function closeSidebarMobile() {
    if (window.innerWidth <= 768) document.getElementById('adminSidebar')?.classList.remove('open');
  }

  // ── Logout ────────────────────────────────────────────────
  ['logoutBtn', 'headerLogout'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => {
      Auth.clear();
      window.location.href = 'index.html';
    });
  });

  // ── Modal helpers ─────────────────────────────────────────
  function openModal(id)  { document.getElementById(id)?.classList.add('open'); }
  function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });
  document.querySelectorAll('.admin-modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  // ── Format date ───────────────────────────────────────────
  function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  /* ════════════════════════════════════════════════════════
     OVERVIEW
  ════════════════════════════════════════════════════════ */
  async function loadOverview() {
    const [projData, catData, msgData] = await Promise.all([
      api('/projects/'),
      api('/categories/'),
      api('/contact/messages?limit=5'),
    ]);

    document.getElementById('statProjects').textContent   = projData?.total ?? '—';
    document.getElementById('statCategories').textContent = Array.isArray(catData) ? catData.length : '—';
    document.getElementById('statMessages').textContent   = msgData?.total ?? '—';
    document.getElementById('statUnread').textContent     = msgData?.unread ?? '—';

    const body = document.getElementById('recentMsgBody');
    if (!body) return;
    if (!msgData?.messages?.length) {
      body.innerHTML = `<tr><td colspan="4"><div class="empty-state"><i class="bi bi-inbox"></i><p>No messages yet.</p></div></td></tr>`;
      return;
    }
    body.innerHTML = msgData.messages.map(m => `
      <tr onclick="window.openMessage(${m.id})">
        <td style="font-weight:${m.is_read ? 400 : 700}">${m.full_name}</td>
        <td>${m.subject}</td>
        <td>${fmtDate(m.created_at)}</td>
        <td><span class="${m.is_read ? 'badge-read' : 'badge-unread'}">${m.is_read ? 'Read' : 'Unread'}</span></td>
      </tr>`).join('');

    updateUnreadBadge(msgData.unread);
  }

  function updateUnreadBadge(count) {
    const badge = document.getElementById('sidebarUnread');
    if (!badge) return;
    badge.textContent = count;
    badge.classList.toggle('show', count > 0);
  }

  /* ════════════════════════════════════════════════════════
     PROJECTS
  ════════════════════════════════════════════════════════ */
  async function loadProjects() {
    const data = await api('/projects/');
    if (!data) return;
    projects = data.projects || [];
    renderProjectsTable();
  }

  function renderProjectsTable() {
    const body = document.getElementById('projectsTableBody');
    if (!body) return;
    if (!projects.length) {
      body.innerHTML = `<tr><td colspan="5"><div class="empty-state"><i class="bi bi-folder2-open"></i><p>No projects yet. Click "Add Project" to get started.</p></div></td></tr>`;
      return;
    }
    body.innerHTML = projects.map(p => `
      <tr>
        <td><img class="proj-thumb" src="${p.image_url || 'https://placehold.co/52x36/f5f5f5/999?text=—'}" alt="${p.title}" /></td>
        <td style="font-weight:600; max-width:220px;">${p.title}</td>
        <td>${p.category?.name || '—'}</td>
        <td>${p.is_featured ? '<span class="badge-featured">Featured</span>' : '—'}</td>
        <td>
          <div class="d-flex gap-2">
            <button class="btn-admin-outline" onclick="editProject(${p.id})"><i class="bi bi-pencil"></i></button>
            <button class="btn-danger" onclick="deleteProject(${p.id})"><i class="bi bi-trash"></i></button>
          </div>
        </td>
      </tr>`).join('');
  }

  // Add Project button
  document.getElementById('addProjectBtn')?.addEventListener('click', () => {
    document.getElementById('projectModalTitle').textContent = 'Add Project';
    document.getElementById('projectForm').reset();
    document.getElementById('projectId').value = '';
    document.getElementById('pImagePreview').classList.remove('show');
    loadCategoryOptions();
    openModal('projectModal');
  });

  // Image preview
  document.getElementById('pImage')?.addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;
    const preview = document.getElementById('pImagePreview');
    preview.src = URL.createObjectURL(file);
    preview.classList.add('show');
  });

  // Auto-fill form for edit
  window.editProject = async function (id) {
    const p = projects.find(x => x.id === id);
    if (!p) return;
    document.getElementById('projectModalTitle').textContent = 'Edit Project';
    document.getElementById('projectId').value   = p.id;
    document.getElementById('pTitle').value      = p.title;
    document.getElementById('pDesc').value       = p.description;
    document.getElementById('pGithub').value     = p.github_link || '';
    document.getElementById('pLinkedin').value   = p.linkedin_link || '';
    document.getElementById('pDemo').value       = p.demo_link || '';
    document.getElementById('pTags').value       = p.skills_tags || '';
    document.getElementById('pOrder').value      = p.display_order || 0;
    document.getElementById('pFeatured').checked = p.is_featured;

    const preview = document.getElementById('pImagePreview');
    if (p.image_url) { preview.src = p.image_url; preview.classList.add('show'); }
    else             { preview.classList.remove('show'); }

    await loadCategoryOptions(p.category_id);
    openModal('projectModal');
  };

  // ── Custom confirm popup ──────────────────────────────────
  function showConfirm(title, message, icon, onConfirm) {
    document.getElementById('confirmTitle').textContent   = title;
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmIcon').className      = `bi ${icon} confirm-icon-i`;
    document.getElementById('confirmOkBtn').onclick = async () => {
      closeModal('confirmModal');
      await onConfirm();
    };
    openModal('confirmModal');
  }

  window.deleteProject = async function (id) {
    const p = projects.find(x => x.id === id);
    showConfirm(
      'Delete Project',
      `Are you sure you want to delete "${p?.title || 'this project'}"? This cannot be undone.`,
      'bi-trash3',
      async () => {
        const res = await api(`/projects/${id}`, { method: 'DELETE' });
        if (res !== null) { toast('Project deleted.'); loadProjects(); }
      }
    );
  };

  // Save project
  document.getElementById('saveProjectBtn')?.addEventListener('click', async () => {
    const form = document.getElementById('projectForm');
    if (!form.reportValidity()) return;

    const id      = document.getElementById('projectId').value;
    const saveBtn = document.getElementById('saveProjectBtn');

    // Show loading state
    saveBtn.disabled   = true;
    saveBtn.innerHTML  = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

    const fd  = new FormData();
    fd.append('title',       document.getElementById('pTitle').value.trim());
    fd.append('description', document.getElementById('pDesc').value.trim());
    const catVal = document.getElementById('pCategory').value;
    if (catVal) fd.append('category_id', catVal);
    fd.append('github_link',   document.getElementById('pGithub').value.trim());
    fd.append('linkedin_link', document.getElementById('pLinkedin').value.trim());
    fd.append('demo_link',     document.getElementById('pDemo').value.trim());
    fd.append('skills_tags',   document.getElementById('pTags').value.trim());
    fd.append('display_order', document.getElementById('pOrder').value);
    fd.append('is_featured',   document.getElementById('pFeatured').checked);
    const imgFile = document.getElementById('pImage').files[0];
    if (imgFile) fd.append('image', imgFile);

    const endpoint = id ? `/projects/${id}` : '/projects/';
    const method   = id ? 'PUT' : 'POST';
    const res = await apiFetch(endpoint, { method, body: fd });

    // Restore button
    saveBtn.disabled  = false;
    saveBtn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Save Project';

    if (!res || !res.ok) { toast('Failed to save project.'); return; }

    toast(id ? 'Project updated!' : 'Project created!');
    closeModal('projectModal');
    loadProjects();
  });

  async function loadCategoryOptions(selectedId = null) {
    const data = await api('/categories/');
    const sel  = document.getElementById('pCategory');
    if (!sel || !Array.isArray(data)) return;
    sel.innerHTML = '<option value="">— No Category —</option>' +
      data.map(c => `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${c.name}</option>`).join('');
  }

  /* ════════════════════════════════════════════════════════
     CATEGORIES
  ════════════════════════════════════════════════════════ */
  async function loadCategories() {
    const data = await api('/categories/');
    if (!Array.isArray(data)) return;
    categories = data;
    renderCategoriesTable();
  }

  function renderCategoriesTable() {
    const body = document.getElementById('categoriesTableBody');
    if (!body) return;
    if (!categories.length) {
      body.innerHTML = `<tr><td colspan="4"><div class="empty-state"><i class="bi bi-tags"></i><p>No categories yet.</p></div></td></tr>`;
      return;
    }
    body.innerHTML = categories.map(c => `
      <tr>
        <td style="font-weight:600">${c.name}</td>
        <td><code style="font-size:0.82rem; background:#f5f5f5; padding:2px 8px; border-radius:4px;">${c.slug}</code></td>
        <td>${fmtDate(c.created_at)}</td>
        <td>
          <div class="d-flex gap-2">
            <button class="btn-admin-outline" onclick="editCategory(${c.id})"><i class="bi bi-pencil"></i></button>
            <button class="btn-danger" onclick="deleteCategory(${c.id})"><i class="bi bi-trash"></i></button>
          </div>
        </td>
      </tr>`).join('');
  }

  document.getElementById('addCategoryBtn')?.addEventListener('click', () => {
    document.getElementById('categoryModalTitle').textContent = 'Add Category';
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
    openModal('categoryModal');
  });

  // Auto-generate slug from name
  document.getElementById('cName')?.addEventListener('input', function () {
    const slugEl = document.getElementById('cSlug');
    if (!slugEl.dataset.manual) {
      slugEl.value = this.value.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-');
    }
  });
  document.getElementById('cSlug')?.addEventListener('input', function () {
    this.dataset.manual = '1';
  });

  window.editCategory = function (id) {
    const c = categories.find(x => x.id === id);
    if (!c) return;
    document.getElementById('categoryModalTitle').textContent = 'Edit Category';
    document.getElementById('categoryId').value = c.id;
    document.getElementById('cName').value      = c.name;
    document.getElementById('cSlug').value      = c.slug;
    openModal('categoryModal');
  };

  window.deleteCategory = async function (id) {
    const c = categories.find(x => x.id === id);
    showConfirm(
      'Delete Category',
      `Delete "${c?.name || 'this category'}"? Projects in it will be uncategorized.`,
      'bi-tags',
      async () => {
        const res = await api(`/categories/${id}`, { method: 'DELETE' });
        if (res !== null) { toast('Category deleted.'); loadCategories(); }
      }
    );
  };

  document.getElementById('saveCategoryBtn')?.addEventListener('click', async () => {
    const form = document.getElementById('categoryForm');
    if (!form.reportValidity()) return;
    const id   = document.getElementById('categoryId').value;
    const body = { name: document.getElementById('cName').value.trim(), slug: document.getElementById('cSlug').value.trim() };
    const res  = await api(id ? `/categories/${id}` : '/categories/', { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) });
    if (res) { toast(id ? 'Category updated!' : 'Category created!'); closeModal('categoryModal'); loadCategories(); }
  });

  /* ════════════════════════════════════════════════════════
     MESSAGES
  ════════════════════════════════════════════════════════ */
  async function loadMessages(unreadOnly = false) {
    const data = await api(`/contact/messages?limit=100&unread_only=${unreadOnly}`);
    if (!data) return;
    messages = data.messages || [];
    renderMessagesTable();
    updateUnreadBadge(data.unread || 0);
  }

  document.getElementById('unreadFilter')?.addEventListener('change', function () {
    loadMessages(this.checked);
  });

  function renderMessagesTable() {
    const body = document.getElementById('messagesTableBody');
    if (!body) return;
    if (!messages.length) {
      body.innerHTML = `<tr><td colspan="6"><div class="empty-state"><i class="bi bi-inbox"></i><p>No messages.</p></div></td></tr>`;
      return;
    }
    body.innerHTML = messages.map(m => `
      <tr onclick="window.openMessage(${m.id})" style="cursor:pointer">
        <td style="font-weight:${m.is_read ? 400 : 700}">${m.full_name}</td>
        <td>${m.email}</td>
        <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${m.subject}</td>
        <td>${fmtDate(m.created_at)}</td>
        <td><span class="${m.is_read ? 'badge-read' : 'badge-unread'}">${m.is_read ? 'Read' : 'Unread'}</span></td>
        <td onclick="event.stopPropagation()">
          <button class="btn-danger" onclick="deleteMsg(${m.id})"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`).join('');
  }

  window.openMessage = async function (id) {
    const m = messages.find(x => x.id === id) || await api(`/contact/messages/${id}`);
    if (!m) return;
    currentMsg = m;

    document.getElementById('messageModalBody').innerHTML = `
      <div class="msg-detail-label">From</div>
      <div class="msg-detail-value">${m.full_name} &lt;${m.email}&gt;</div>
      <div class="msg-detail-label">Subject</div>
      <div class="msg-detail-value">${m.subject}</div>
      <div class="msg-detail-label">Date</div>
      <div class="msg-detail-value">${fmtDate(m.created_at)}</div>
      <div class="msg-detail-label">Message</div>
      <div class="msg-body-text">${m.message}</div>`;

    const toggleBtn = document.getElementById('toggleReadBtn');
    toggleBtn.textContent = m.is_read ? 'Mark as Unread' : 'Mark as Read';

    // Auto-mark as read
    if (!m.is_read) {
      await api(`/contact/messages/${m.id}/status`, { method: 'PATCH', body: JSON.stringify({ is_read: true }) });
      const msg = messages.find(x => x.id === m.id);
      if (msg) { msg.is_read = true; renderMessagesTable(); }
    }

    openModal('messageModal');
  };

  document.getElementById('toggleReadBtn')?.addEventListener('click', async () => {
    if (!currentMsg) return;
    const newVal = !currentMsg.is_read;
    await api(`/contact/messages/${currentMsg.id}/status`, { method: 'PATCH', body: JSON.stringify({ is_read: newVal }) });
    currentMsg.is_read = newVal;
    const msg = messages.find(x => x.id === currentMsg.id);
    if (msg) { msg.is_read = newVal; renderMessagesTable(); }
    document.getElementById('toggleReadBtn').textContent = newVal ? 'Mark as Unread' : 'Mark as Read';
    toast(newVal ? 'Marked as read.' : 'Marked as unread.');
  });

  document.getElementById('deleteMsgBtn')?.addEventListener('click', async () => {
    if (!currentMsg) return;
    showConfirm(
      'Delete Message',
      `Delete message from "${currentMsg.full_name}"? This cannot be undone.`,
      'bi-envelope-x',
      async () => {
        const res = await api(`/contact/messages/${currentMsg.id}`, { method: 'DELETE' });
        if (res !== null) {
          toast('Message deleted.');
          closeModal('messageModal');
          messages = messages.filter(m => m.id !== currentMsg.id);
          renderMessagesTable();
        }
      }
    );
  });

  window.deleteMsg = async function (id) {
    const m = messages.find(x => x.id === id);
    showConfirm(
      'Delete Message',
      `Delete message from "${m?.full_name || 'this sender'}"? This cannot be undone.`,
      'bi-envelope-x',
      async () => {
        const res = await api(`/contact/messages/${id}`, { method: 'DELETE' });
        if (res !== null) { toast('Message deleted.'); messages = messages.filter(m => m.id !== id); renderMessagesTable(); }
      }
    );
  };

  // ── Init ──────────────────────────────────────────────────
  loadOverview();

})();
