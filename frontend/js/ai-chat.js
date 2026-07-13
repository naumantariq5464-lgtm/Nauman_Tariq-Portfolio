/* ============================================================
   ai-chat.js — AI Portfolio Assistant chat popup UI
   In Phase 4 this will call the FastAPI /ai/chat endpoint
   ============================================================ */

(function () {
  const fabAI      = document.getElementById('fabAI');
  const popup      = document.getElementById('aiChatPopup');
  const closeBtn   = document.getElementById('aiChatClose');
  const chatBody   = document.getElementById('aiChatBody');
  const chatForm   = document.getElementById('aiChatForm');
  const chatInput  = document.getElementById('aiChatInput');

  if (!fabAI || !popup) return;

  // ── Session memory (conversation history for UI) ──────────────
  let isOpen = false;

  // ── Open / Close ──────────────────────────────────────────────
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

  // Close on outside click
  document.addEventListener('click', function (e) {
    if (isOpen && !popup.contains(e.target) && !fabAI.contains(e.target)) {
      isOpen = false;
      popup.style.setProperty('display', 'none', 'important');
      popup.classList.remove('open');
    }
  });

  // ── Message Helpers ───────────────────────────────────────────
  function appendMessage(text, sender) {
    const wrapper = document.createElement('div');
    wrapper.className = sender === 'user' ? 'user-message' : 'ai-message';

    if (sender === 'ai') {
      const dot = document.createElement('div');
      dot.className = 'ai-msg-dot';
      dot.innerHTML = '<i class="bi bi-stars"></i>';
      wrapper.appendChild(dot);
    }

    const bubble = document.createElement('div');
    bubble.className = sender === 'user' ? 'user-bubble' : 'ai-bubble';
    bubble.textContent = text;

    wrapper.appendChild(bubble);
    chatBody.appendChild(wrapper);
    scrollBottom();
  }

  function appendTyping() {
    const wrapper = document.createElement('div');
    wrapper.className = 'ai-message';
    wrapper.id = 'typingIndicator';

    const dot = document.createElement('div');
    dot.className = 'ai-msg-dot';
    dot.innerHTML = '<i class="bi bi-stars"></i>';

    const typing = document.createElement('div');
    typing.className = 'ai-typing';
    typing.innerHTML = `
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>`;

    wrapper.appendChild(dot);
    wrapper.appendChild(typing);
    chatBody.appendChild(wrapper);
    scrollBottom();
  }

  function removeTyping() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
  }

  function scrollBottom() {
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  // ── Phase 1 Static Responses ──────────────────────────────────
  // Will be replaced by real Grok API calls in Phase 4
  const staticResponses = {
    default: "I'm Nauman's AI assistant! I can tell you about his projects, skills, experience, and services. What would you like to know?",
    skills:  "Nauman is skilled in Python, FastAPI, JavaScript, React, React Native, PostgreSQL, Docker, and AI/ML technologies including LangChain and Grok API.",
    project: "Nauman has built AI agents, full-stack web apps, mobile apps, and automation systems. Check out the Projects section for details!",
    contact: "You can reach Nauman via the contact form on this page, or directly at nauman@email.com. He's based in Pakistan.",
    service: "Nauman offers Web Development, AI Agents, AI Automation, Mobile Apps, Machine Learning, and API Development services.",
    hello:   "Hello! Great to meet you. I'm here to help you learn about Nauman's work and expertise. What would you like to know?",
    experience: "Nauman has 4+ years of experience as a Full Stack Developer and AI Engineer, working with international clients on freelance projects.",
  };

  function getStaticResponse(message) {
    const msg = message.toLowerCase();
    if (/skill|tech|stack|language|tool/.test(msg))    return staticResponses.skills;
    if (/project|work|built|portfolio/.test(msg))      return staticResponses.project;
    if (/contact|email|phone|reach|hire/.test(msg))    return staticResponses.contact;
    if (/service|offer|provide|do/.test(msg))          return staticResponses.service;
    if (/hi|hello|hey|good|morning|evening/.test(msg)) return staticResponses.hello;
    if (/experience|years|background/.test(msg))       return staticResponses.experience;
    return staticResponses.default;
  }

  // ── Send Message ──────────────────────────────────────────────
  if (chatForm) {
    chatForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const text = chatInput.value.trim();
      if (!text) return;

      chatInput.value = '';
      chatInput.disabled = true;

      appendMessage(text, 'user');
      appendTyping();

      try {
        /* ── Phase 4: replace this block ──────────────────────
           const res = await fetch('/api/ai/chat', {
             method:  'POST',
             headers: { 'Content-Type': 'application/json' },
             body:    JSON.stringify({ message: text }),
           });
           const data = await res.json();
           removeTyping();
           appendMessage(data.reply, 'ai');
        ─────────────────────────────────────────────────── */

        // Phase 1 mock — static keyword responses
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 800));
        removeTyping();
        appendMessage(getStaticResponse(text), 'ai');

      } catch (err) {
        removeTyping();
        appendMessage("Sorry, I couldn't connect right now. Please try again later.", 'ai');
        console.error('AI chat error:', err);
      } finally {
        chatInput.disabled = false;
        chatInput.focus();
      }
    });
  }

  // Allow Enter to submit, Shift+Enter for newline
  if (chatInput) {
    chatInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event('submit'));
      }
    });
  }
})();
