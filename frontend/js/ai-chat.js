/* ============================================================
   ai-chat.js — AI Portfolio Assistant
   Connects to FastAPI /api/v1/ai/chat endpoint (Groq AI Agent)
   ============================================================ */

(function () {
  const fabAI     = document.getElementById('fabAI');
  const popup     = document.getElementById('aiChatPopup');
  const closeBtn  = document.getElementById('aiChatClose');
  const chatBody  = document.getElementById('aiChatBody');
  const chatForm  = document.getElementById('aiChatForm');
  const chatInput = document.getElementById('aiChatInput');

  if (!fabAI || !popup) return;

  // ── Session ID (persist across page — reset on close) ─────
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

  // ── Helpers ───────────────────────────────────────────────
  function scrollBottom() {
    if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
  }

  function appendMessage(text, sender) {
    const wrapper = document.createElement('div');
    wrapper.className = sender === 'user' ? 'user-message' : 'ai-message';

    if (sender === 'ai') {
      const dot = document.createElement('div');
      dot.className   = 'ai-msg-dot';
      dot.innerHTML   = '<i class="bi bi-stars"></i>';
      dot.style.cssText = 'width:26px;height:26px;min-width:26px;background:#111111;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.65rem;color:#ffffff;flex-shrink:0;';
      wrapper.appendChild(dot);
    }

    const bubble = document.createElement('div');
    bubble.className = sender === 'user' ? 'user-bubble' : 'ai-bubble';

    // Render newlines
    bubble.innerHTML = text.replace(/\n/g, '<br/>');

    wrapper.appendChild(bubble);
    if (chatBody) chatBody.appendChild(wrapper);
    scrollBottom();
  }

  function appendTyping() {
    const wrapper = document.createElement('div');
    wrapper.className = 'ai-message';
    wrapper.id = 'typingIndicator';

    const dot = document.createElement('div');
    dot.className   = 'ai-msg-dot';
    dot.innerHTML   = '<i class="bi bi-stars"></i>';
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
        body:    JSON.stringify({
          message:    text,
          session_id: sessionId,
        }),
      });

      if (res.status === 429) {
        return "You've sent too many messages. Please wait a bit and try again.";
      }
      if (res.status === 503) {
        return "AI Assistant is not configured yet. Please check back soon.";
      }
      if (!res.ok) {
        return "Something went wrong. Please try again.";
      }

      const data = await res.json();
      // Save session ID for conversation continuity
      if (data.session_id) sessionId = data.session_id;
      return data.reply || "I didn't get a response. Please try again.";

    } catch (err) {
      // Backend offline — friendly fallback
      return "I can't connect to the server right now. Please make sure the backend is running.";
    }
  }

  // ── Form submit ───────────────────────────────────────────
  if (chatForm) {
    chatForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const text = chatInput ? chatInput.value.trim() : '';
      if (!text) return;

      if (chatInput) {
        chatInput.value    = '';
        chatInput.disabled = true;
      }

      // Append user bubble
      appendMessage(text, 'user');
      appendTyping();

      // Call backend
      const reply = await sendMessage(text);

      removeTyping();
      appendMessage(reply, 'ai');

      if (chatInput) {
        chatInput.disabled = false;
        chatInput.focus();
      }
    });
  }

  // Enter key to submit
  if (chatInput) {
    chatInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (chatForm) chatForm.dispatchEvent(new Event('submit'));
      }
    });
  }

})();
