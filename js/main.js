/* OSBio startup: a skippable boot sequence followed directly by the desktop.
   There is no fake sign-in step and no session data is required. */
(function () {
  'use strict';

  const bootScreen = document.getElementById('boot-screen');
  const desktopScreen = document.getElementById('desktop-screen');
  const skipButton = document.getElementById('skip-boot');
  const clock = document.getElementById('system-clock');
  let hasEnteredDesktop = false;
  let bootTimer = null;

  function enterDesktop() {
    if (hasEnteredDesktop) return;
    hasEnteredDesktop = true;
    window.clearTimeout(bootTimer);
    bootScreen.classList.add('is-hidden');
    desktopScreen.classList.remove('is-hidden');
    document.removeEventListener('keydown', handleBootKey);
  }

  function handleBootKey(event) {
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(event.key)) return;
    enterDesktop();
  }

  function updateClock() {
    if (!clock) return;
    clock.textContent = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date());
  }

  skipButton.addEventListener('click', enterDesktop);
  bootScreen.addEventListener('click', event => {
    if (event.target === bootScreen) enterDesktop();
  });
  document.addEventListener('keydown', handleBootKey);

  updateClock();
  window.setInterval(updateClock, 60000);
  bootTimer = window.setTimeout(enterDesktop, 900);

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) enterDesktop();
  if (window.WindowManager) window.WindowManager.init();
})();
