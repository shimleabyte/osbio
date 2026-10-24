/**
 * Workspace entry flow and top-level navigation.
 * The window manager owns application/window state; this file owns only the intro.
 */
(function () {
  'use strict';

  const bootScreen = document.getElementById('boot-screen');
  const welcomeScreen = document.getElementById('welcome-screen');
  const desktopScreen = document.getElementById('desktop-screen');
  const enterButton = document.getElementById('enter-workspace');
  const skipButton = document.getElementById('skip-boot');
  const BOOT_DELAY = 900;
  let bootTimer;
  let introFinished = false;

  function showScreen(screen) {
    [bootScreen, welcomeScreen, desktopScreen].forEach((item) => {
      if (item !== screen) {
        item.classList.add('hidden');
        item.classList.remove('is-visible');
      }
    });
    screen.classList.remove('hidden');
    requestAnimationFrame(() => screen.classList.add('is-visible'));
  }

  function enterWelcome() {
    if (introFinished) return;
    introFinished = true;
    clearTimeout(bootTimer);
    showScreen(welcomeScreen);
  }

  function enterDesktop() {
    clearTimeout(bootTimer);
    introFinished = true;
    showScreen(desktopScreen);
  }

  skipButton.addEventListener('click', enterWelcome);
  bootScreen.addEventListener('click', (event) => {
    if (event.target === bootScreen) enterWelcome();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !bootScreen.classList.contains('hidden')) enterWelcome();
  });
  enterButton.addEventListener('click', enterDesktop);
  document.getElementById('home-link').addEventListener('click', (event) => {
    event.preventDefault();
    if (window.WindowManager) WindowManager.closeAllWindows();
  });

  document.querySelectorAll('[data-launch]').forEach((button) => {
    button.addEventListener('click', () => {
      if (window.WindowManager) WindowManager.openWindow(button.dataset.launch);
    });
  });

  function updateClock() {
    const clock = document.getElementById('system-clock');
    if (!clock) return;
    clock.textContent = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date());
  }
  updateClock();
  setInterval(updateClock, 60000);

  bootTimer = setTimeout(enterWelcome, BOOT_DELAY);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) enterWelcome();
})();
