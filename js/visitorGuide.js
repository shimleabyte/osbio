(function (global) {
  'use strict';

  const STORAGE_KEY = 'osbio.wayfinder.v2';
  const ROUTES = Object.freeze([
    Object.freeze({ app: 'projects', key: 'work' }),
    Object.freeze({ app: 'about', key: 'context' }),
    Object.freeze({ app: 'editor', key: 'workspace' })
  ]);
  const DEFAULT_COPY = 'This is a working browser desktop, not a screenshot. Start with one stop; the rest of the workspace is yours to explore.';
  const COMPLETE_COPY = 'You have seen the work, the context, and a tool you can try yourself. Now explore at your own pace. The guide will stay available in the top panel.';
  const guide = document.getElementById('visitor-guide');
  const toggle = document.getElementById('visitor-guide-toggle');
  const hideButton = document.getElementById('visitor-guide-hide');
  if (!guide || !toggle || !hideButton) return;

  function readState() {
    try {
      const raw = global.localStorage.getItem(STORAGE_KEY);
      if (!raw) return { dismissed: true, visited: [] };
      const saved = JSON.parse(raw);
      return {
        dismissed: saved.dismissed === true,
        visited: Array.isArray(saved.visited)
          ? [...new Set(saved.visited.filter((app) => ROUTES.some((route) => route.app === app)))]
          : []
      };
    } catch (error) {
      return { dismissed: true, visited: [] };
    }
  }

  let state = readState();
  const progressLabel = document.getElementById('visitor-guide-progress-label');
  const progressFill = document.getElementById('visitor-guide-progress-fill');
  const toggleCount = document.getElementById('visitor-guide-toggle-count');
  const title = document.getElementById('visitor-guide-title');
  const copy = document.getElementById('visitor-guide-copy');
  const routeButtons = Array.from(guide.querySelectorAll('[data-guide-app]'));

  function persist() {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: 1,
        dismissed: state.dismissed,
        visited: state.visited
      }));
    } catch (error) {
      // Guide controls remain usable when persistence is blocked by the browser.
    }
  }

  function render() {
    const count = state.visited.length;
    const total = ROUTES.length;
    if (progressLabel) progressLabel.textContent = count + ' / ' + total + ' STOPS VISITED';
    if (progressFill) progressFill.style.width = (count / total * 100) + '%';
    if (toggleCount) toggleCount.textContent = count + '/' + total;
    toggle.setAttribute('aria-label', (guide.hidden ? 'Open' : 'Hide') + ' field guide (' + count + ' of ' + total + ' stops visited)');
    toggle.setAttribute('aria-expanded', String(!guide.hidden));
    guide.classList.toggle('is-complete', count === total);
    if (title) title.textContent = count === total ? 'You found your footing.' : 'Make yourself at home.';
    if (copy) copy.textContent = count === total ? COMPLETE_COPY : DEFAULT_COPY;

    routeButtons.forEach((button) => {
      const visited = state.visited.includes(button.dataset.guideApp);
      button.classList.toggle('is-visited', visited);
      const status = button.querySelector('.visitor-guide-route-state');
      if (status) status.textContent = visited ? 'VISITED' : 'OPEN';
    });
  }

  function setOpen(open, dismiss = false) {
    guide.hidden = !open;
    if (open) state.dismissed = false;
    else if (dismiss) state.dismissed = true;
    persist();
    render();
  }

  function markVisited(app) {
    if (!ROUTES.some((route) => route.app === app) || state.visited.includes(app)) return;
    state.visited = state.visited.concat(app);
    persist();
    render();
  }

  guide.hidden = state.dismissed;
  render();

  toggle.addEventListener('click', () => setOpen(guide.hidden, !guide.hidden));
  hideButton.addEventListener('click', () => setOpen(false, true));

  routeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const app = button.dataset.guideApp;
      if (!app || !global.WindowManager) return;
      global.WindowManager.openWindow(app);
      // Give the destination the screen; the GUIDE control and progress remain in the panel.
      setOpen(false, true);
    });
  });

  global.addEventListener('osbio:event', (event) => {
    const detail = event.detail || {};
    if (detail.type === 'window.opened') markVisited(detail.app);
  });

  global.OSBioVisitorGuide = Object.freeze({
    open: () => setOpen(true),
    close: () => setOpen(false, true),
    getSnapshot: () => ({ dismissed: state.dismissed, visited: state.visited.slice(), total: ROUTES.length })
  });
})(window);
