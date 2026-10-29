/**
 * OSBio shell lifecycle and desktop-level interactions.
 * Static client-side demo: no authentication or server session.
 */
(function () {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const BOOT_DURATION = reducedMotion ? 120 : 920;
  const FADE_DURATION = reducedMotion ? 0 : 180;
  const bootScreen = document.getElementById('boot-screen');
  const bootSkip = document.getElementById('boot-skip');
  const desktopScreen = document.getElementById('desktop-screen');
  const launcherToggle = document.getElementById('launcher-toggle');
  const launcher = document.getElementById('app-launcher');
  const appSearch = document.getElementById('app-search');
  const clock = document.getElementById('system-clock');
  const date = document.getElementById('system-date');
  let bootComplete = false;
  let bootTimer = null;
  let launcherReturnFocus = null;

  function showDesktop() {
    if (bootComplete) return;
    bootComplete = true;
    clearTimeout(bootTimer);
    document.removeEventListener('keydown', skipBootOnKey);
    bootSkip.removeEventListener('click', showDesktop);
    bootScreen.classList.add('fade-out');
    window.setTimeout(function () {
      bootScreen.classList.add('hidden');
      desktopScreen.classList.remove('hidden');
      desktopScreen.setAttribute('aria-hidden', 'false');
      document.body.classList.add('desktop-ready');
      updateClock();
      if (window.OSBioEvents) window.OSBioEvents.emit('desktop.ready', { source: 'boot-sequence' });
    }, FADE_DURATION);
  }

  function skipBootOnKey(event) {
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(event.key)) return;
    showDesktop();
  }

  function setLauncherOpen(open, options = {}) {
    if (open && !launcher.hidden) {
      appSearch.focus({ preventScroll: true });
      return;
    }

    if (open) {
      launcherReturnFocus = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : launcherToggle;
    }

    const wasOpen = !launcher.hidden;
    launcher.hidden = !open;
    launcher.classList.toggle('is-open', open);
    if (wasOpen !== open && window.OSBioEvents) window.OSBioEvents.emit(open ? 'launcher.opened' : 'launcher.closed');
    launcherToggle.setAttribute('aria-expanded', String(open));
    launcherToggle.classList.toggle('is-active', open);

    if (open) {
      appSearch.value = '';
      filterApplications('');
      appSearch.focus({ preventScroll: true });
      return;
    }

    const returnFocus = launcherReturnFocus;
    launcherReturnFocus = null;
    if (options.restoreFocus && returnFocus instanceof HTMLElement && returnFocus.isConnected) {
      returnFocus.focus({ preventScroll: true });
    }
  }

  function filterApplications(query) {
    const needle = query.trim().toLowerCase();
    const buttons = Array.from(launcher.querySelectorAll('.launcher-item'));
    let visibleCount = 0;
    buttons.forEach(function (button) {
      const searchable = (button.textContent + ' ' + (button.dataset.search || '')).toLowerCase();
      button.hidden = needle.length > 0 && !searchable.includes(needle);
      if (!button.hidden) visibleCount += 1;
    });
    const emptyState = document.getElementById('launcher-empty');
    if (emptyState) emptyState.hidden = visibleCount > 0;
  }

  function launchFromButton(event) {
    const button = event.target.closest('[data-app]');
    if (!button) return;
    const appName = button.dataset.app;
    if (!appName) return;
    if (window.OSBioEvents) window.OSBioEvents.emit('app.launch-requested', { app: appName, source: button.className });
    WindowManager.openWindow(appName);
    if (!launcher.hidden) setLauncherOpen(false);
  }

  function updateClock() {
    const now = new Date();
    clock.textContent = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
    date.textContent = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(now).toUpperCase();
  }

  function initShell() {
    launcherToggle.addEventListener('click', function () { setLauncherOpen(launcher.hidden); });
    launcher.addEventListener('click', launchFromButton);
    appSearch.addEventListener('input', function () { filterApplications(appSearch.value); });
    document.querySelectorAll('.desktop-icon[data-app]').forEach(function (button) {
      button.addEventListener('click', launchFromButton);
    });
    document.addEventListener('click', function (event) {
      if (launcher.hidden || launcher.contains(event.target) || launcherToggle.contains(event.target)) return;
      setLauncherOpen(false);
    });
    document.addEventListener('keydown', function (event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setLauncherOpen(launcher.hidden, { restoreFocus: !launcher.hidden });
      } else if (event.key === 'Escape' && !launcher.hidden) {
        event.preventDefault();
        event.stopPropagation();
        setLauncherOpen(false, { restoreFocus: true });
      }
    });
    updateClock();
    window.setInterval(updateClock, 15000);
  }

  function init() {
    initShell();
    bootSkip.addEventListener('click', showDesktop);
    document.addEventListener('keydown', skipBootOnKey);
    bootTimer = window.setTimeout(showDesktop, BOOT_DURATION);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
