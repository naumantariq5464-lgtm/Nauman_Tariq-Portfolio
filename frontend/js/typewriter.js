/* ============================================================
   typewriter.js — Hero section typing animation
   Cycles through titles: type → pause → delete → next (infinite loop)
   ============================================================ */

(function () {
  const titles = [
    'Full Stack Developer',
    'AI Engineer',
    'AI Automation Expert',
    'React Native Developer',
  ];

  const el = document.getElementById('typewriter-text');
  if (!el) return;

  let titleIndex  = 0;
  let charIndex   = 0;
  let isDeleting  = false;
  let isPaused    = false;

  const TYPING_SPEED   = 80;   // ms per character while typing
  const DELETING_SPEED = 45;   // ms per character while deleting
  const PAUSE_AFTER    = 1800; // ms to pause after full word is typed
  const PAUSE_BEFORE   = 400;  // ms to pause before starting next word

  function tick() {
    const current = titles[titleIndex];

    if (isPaused) return; // paused — wait() will schedule next tick

    if (!isDeleting) {
      // --- Typing ---
      charIndex++;
      el.textContent = current.substring(0, charIndex);

      if (charIndex === current.length) {
        // Word fully typed → pause before deleting
        isPaused = true;
        setTimeout(function () {
          isPaused   = false;
          isDeleting = true;
          tick();
        }, PAUSE_AFTER);
        return;
      }
    } else {
      // --- Deleting ---
      charIndex--;
      el.textContent = current.substring(0, charIndex);

      if (charIndex === 0) {
        // Word fully deleted → move to next title
        isDeleting  = false;
        titleIndex  = (titleIndex + 1) % titles.length;

        isPaused = true;
        setTimeout(function () {
          isPaused = false;
          tick();
        }, PAUSE_BEFORE);
        return;
      }
    }

    setTimeout(tick, isDeleting ? DELETING_SPEED : TYPING_SPEED);
  }

  // Small initial delay so preloader doesn't overlap
  setTimeout(tick, 500);
})();
