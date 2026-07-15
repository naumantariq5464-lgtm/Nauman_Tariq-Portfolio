/* ============================================================
   ai-chat.js — AI Portfolio Assistant
   Features: typewriter effect, project buttons, rich formatting
   ============================================================ */

(function () {
  const fabAI     = document.getElementById('fabAI');
  const popup     = document.getElementById('aiChatPopup');
  const closeBtn  = document.getElementById('aiChatClose');
  const chatBody  = document.getElementById('aiChatBody');
  const chatForm  = document.getElementById('aiChatForm');
  const chatInput = document.getElementById('aiChatInput');

  if (!fabAI || !popup) return;

  let isOpen    = false;
  let sessionId = '';

  // ── Open / Close ──────────────────────────────────────────
  fabAI.addEventListener('click', function (e) {
    e.stopPropagation();
    isOpen = !isOpen;
    if (isOpen) {
      popup.style.setProperty('display', 'flex', 'important');
      popup.style.setProperty('flex-direction', 'column', 'important');
      popup.classList.add('open');
      setTimeout(() => chatInput && chatInput.focus(), 300);
    } else {
      popup.style.setProperty('display', 'none', 'important');
      popup.classList.remove('open');
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      isOpen = false;
      popup.style.setProperty('display', 'none', 'important');
      popup.classList.remove('open');
    });
  }

  document.addEventListener('click', function (e) {
    if (isOpen && !popup.contains(e.target) && !fabAI.contains(e.target)) {
      isOpen = false;
      popup.style.setProperty('display', 'none', 'important');
      popup.classList.remove('open');
    }
  });

  // ── Scroll to bottom ──────────────────────────────────────
  function scrollBottom() {
    if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
  }

  // ── Parse [LINKS: ...] — one per project, render inline ────
  function parseAndRenderAIText(rawText) {
    // Split text by [LINKS: ...] tags
    const parts = rawText.split(/\[LINKS:\s*(.*?)\]/gi);
    // parts = [text, links1, text, links2, text, ...]

    const container = document.createElement('div');

    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        // Text part
        const textChunk = parts[i].trim();
        if (textChunk) {
          const p = document.createElement('div');
          p.innerHTML = formatText(textChunk);
          p.style.marginBottom = '4px';
          container.appendChild(p);
        }
      } else {
        // Links part — build buttons for THIS project
        const linkStr = parts[i];
        const buttons = [];
        linkStr.split(',').forEach(part => {
          const eqIdx = part.indexOf('=');
          if (eqIdx === -1) return;
          const key = part.slice(0, eqIdx).trim();
          const url = part.slice(eqIdx + 1).trim();
          if (url && url !== '' && url !== 'null' && url !== 'undefined' && url.startsWith('http')) {
            buttons.push({ type: key, url });
          }
        });
        if (buttons.length) {
          const btnRow = buildLinkButtons(buttons);
          btnRow.style.marginBottom = '12px';
          container.appendChild(btnRow);
        }
      }
    }
    return container;
  }

  // ── Format text: bold, bullets ────────────────────────────
  function formatText(text) {
    // Bold **text**
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Newlines
    text = text.replace(/\n/g, '<br>');
    return text;
  }

  // ── Build project link buttons ────────────────────────────
  function buildLinkButtons(buttons) {
    if (!buttons.length) return null;
    const row = document.createElement('div');
    row.style.cssText = 'display:flex; gap:6px; flex-wrap:wrap; margin-top:10px;';

    buttons.forEach(btn => {
      const a = document.createElement('a');
      a.href    = btn.url;
      a.target  = '_blank';
      a.rel     = 'noopener noreferrer';

      const icons = { github: 'bi-github', demo: 'bi-globe', linkedin: 'bi-linkedin' };
      const labels = { github: 'GitHub', demo: 'Live Demo', linkedin: 'LinkedIn' };
      const icon  = icons[btn.type] || 'bi-link-45deg';
      const label = labels[btn.type] || btn.type;

      a.innerHTML = `<i class="bi ${icon}" style="font-size:0.8rem;"></i> ${label}`;
      a.style.cssText = `
        display: inline-flex; align-items: center; gap: 5px;
        background: #111111; color: #ffffff;
        padding: 5px 12px; border-radius: 6px;
        font-size: 0.75rem; font-weight: 600;
        text-decoration: none;
        transition: opacity 0.2s;
      `;
      a.addEventListener('mouseenter', () => a.style.opacity = '0.8');
      a.addEventListener('mouseleave', () => a.style.opacity = '1');
      row.appendChild(a);
    });
    return row;
  }

  // ── Typewriter on plain text, then swap to full HTML ────────
  function typewriterEffect(bubble, contentContainer, onDone) {
    const plainText = contentContainer.textContent || '';
    let i = 0;
    bubble.innerHTML = '';
    function type() {
      if (i < plainText.length) {
        bubble.textContent += plainText[i++];
        scrollBottom();
        setTimeout(type, 8);
      } else {
        bubble.innerHTML = '';
        bubble.appendChild(contentContainer);
        scrollBottom();
        if (onDone) onDone();
      }
    }
    type();
  }

  // ── Append AI message with typewriter ─────────────────────
  function appendAIMessage(text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'ai-message';
    wrapper.style.cssText = 'display:flex; align-items:flex-start; gap:8px;';

    const dot = document.createElement('div');
    dot.className = 'ai-msg-dot';
    dot.innerHTML = '<i class="bi bi-stars"></i>';
    dot.style.cssText = 'width:26px;height:26px;min-width:26px;background:#111111;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.65rem;color:#ffffff;flex-shrink:0;margin-top:4px;';

    const bubble = document.createElement('div');
    bubble.className = 'ai-bubble';

    wrapper.appendChild(dot);
    wrapper.appendChild(bubble);
    if (chatBody) chatBody.appendChild(wrapper);
    scrollBottom();

    // Build rich content (text + per-project buttons)
    const contentContainer = parseAndRenderAIText(text);

    // Typewriter then reveal full content
    typewriterEffect(bubble, contentContainer);
  }

  // ── Append user message ───────────────────────────────────
  function appendUserMessage(text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'user-message';
    wrapper.style.cssText = 'display:flex; justify-content:flex-end;';

    const bubble = document.createElement('div');
    bubble.className = 'user-bubble';
    bubble.textContent = text;

    wrapper.appendChild(bubble);
    if (chatBody) chatBody.appendChild(wrapper);
    scrollBottom();
  }

  // ── Typing indicator ──────────────────────────────────────
  function appendTyping() {
    const wrapper = document.createElement('div');
    wrapper.className = 'ai-message';
    wrapper.id = 'typingIndicator';
    wrapper.style.cssText = 'display:flex; align-items:flex-end; gap:8px;';

    const dot = document.createElement('div');
    dot.innerHTML = '<i class="bi bi-stars"></i>';
    dot.style.cssText = 'width:26px;height:26px;min-width:26px;background:#111111;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.65rem;color:#ffffff;flex-shrink:0;';

    const typing = document.createElement('div');
    typing.className = 'ai-typing';
    typing.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';

    wrapper.appendChild(dot);
    wrapper.appendChild(typing);
    if (chatBody) chatBody.appendChild(wrapper);
    scrollBottom();
  }

  function removeTyping() {
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
  }

  // ── Send message to backend ───────────────────────────────
  async function sendMessage(text) {
    try {
      const res = await fetch(CONFIG.API_BASE_URL + '/ai/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: text, session_id: sessionId }),
      });

      if (res.status === 429) return "You've sent too many messages. Please wait a bit. 😊";
      if (res.status === 503) return "AI Assistant is not configured yet.";
      if (!res.ok) return "Something went wrong. Please try again.";

      const data = await res.json();
      if (data.session_id) sessionId = data.session_id;
      return data.reply || "I didn't get a response. Please try again.";

    } catch {
      return "I can't connect right now. Please make sure the backend is running.";
    }
  }

  // ── Form submit ───────────────────────────────────────────
  if (chatForm) {
    chatForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const text = chatInput ? chatInput.value.trim() : '';
      if (!text) return;

      if (chatInput) { chatInput.value = ''; chatInput.disabled = true; }

      appendUserMessage(text);
      appendTyping();

      const reply = await sendMessage(text);

      removeTyping();
      appendAIMessage(reply);

      if (chatInput) { chatInput.disabled = false; chatInput.focus(); }
    });
  }

  if (chatInput) {
    chatInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (chatForm) chatForm.dispatchEvent(new Event('submit'));
      }
    });
  }

})();
