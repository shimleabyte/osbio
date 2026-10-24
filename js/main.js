/**
 * OSBio startup and desktop-level behavior.
 * The boot intro is short and skippable; there is no fake sign-in flow.
 */
(function () {
  'use strict';

  const boot = document.getElementById('boot-screen');
  const desktop = document.getElementById('desktop');
  const skipButton = document.getElementById('skip-boot');
  const clock = document.getElementById('system-clock');
  let bootFinished = false;
  let bootTimer;

  function enterDesktop() {
    if (bootFinished) return;
    bootFinished = true;
    window.clearTimeout(bootTimer);
    boot.classList.add('is-exiting');
    desktop.classList.remove('is-hidden');
    window.setTimeout(() => {
      boot.hidden = true;
    }, 380);
  }

  function updateClock() {
    if (!clock) return;
    clock.textContent = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date());
  }

  skipButton.addEventListener('click', enterDesktop);
  boot.addEventListener('click', event => {
    if (event.target === boot) enterDesktop();
  });
  document.addEventListener('keydown', event => {
    if (!bootFinished && !['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(event.key)) {
      enterDesktop();
      return;
    }
    if (event.key === 'Escape' && bootFinished) {
      const focusedWindow = document.querySelector('.app-window.is-active');
      if (focusedWindow) {
        const close = focusedWindow.querySelector('[data-window-action="close"]');
        if (close) close.click();
      }
    }
  });

  document.querySelectorAll('[data-launch]').forEach(button => {
    button.addEventListener('click', () => {
      if (window.WindowManager) window.WindowManager.openWindow(button.dataset.launch);
    });
  });

  document.getElementById('desktop-home').addEventListener('click', () => {
    if (window.WindowManager) window.WindowManager.showDesktop();
  });

  updateClock();
  window.setInterval(updateClock, 60_000);
  bootTimer = window.setTimeout(enterDesktop, 1100);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) enterDesktop();
})();
