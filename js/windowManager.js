/**
 * OSBio desktop window manager.
 * Keeps application state in one place: open, focus, minimize, maximize, and drag.
 * All project destinations are real repositories; no fabricated portfolio entries.
 */
(function () {
  'use strict';

  const layer = document.getElementById('window-layer');
  const desktop = document.getElementById('desktop');
  const dockButtons = Array.from(document.querySelectorAll('.dock-app[data-app]'));
  const openWindows = new Map();
  let zIndex = 20;
  let activeId = null;
  let cascade = 0;
  let dragState = null;

  const projects = [
    {
      number: '01',
      name: 'Mutabaah CLI',
      symbol: '$_',
      symbolClass: '',
      description: 'A Go command-line project for managing mutabaah activities with JSON-backed local data.',
      tags: ['Go', 'CLI', 'JSON', 'File I/O'],
      url: 'https://github.com/shimleabyte/mutabaah-cli'
    },
    {
      number: '02',
      name: 'OSBio',
      symbol: 'px',
      symbolClass: 'blue',
      description: 'An interactive OS-inspired portfolio exploring window management, desktop interaction, and visual identity.',
      tags: ['HTML', 'CSS', 'JavaScript', 'UI'],
      url: 'https://github.com/shimleabyte/osbio'
    }
  ];

  const apps = {
    projects: {
      title: 'Selected work',
      kicker: 'REPOSITORIES / 02',
      width: 790,
      height: 610,
      content: () => `
        <div class="app-content">
          <p class="eyebrow">WORKSPACE / PROJECT INDEX</p>
          <h2 class="app-heading">Work in <span>progress.</span></h2>
          <p class="app-lede">A short list of real repositories. Each project is a record of what I am building and what I am learning by doing it.</p>
          <div class="projects-grid">
            ${projects.map(project => `
              <article class="project-card">
                <div class="project-card-top">
                  <span class="project-number">PROJECT / ${project.number}</span>
                  <span class="project-symbol ${project.symbolClass}" aria-hidden="true">${project.symbol}</span>
                </div>
                <h3 class="project-title">${project.name}</h3>
                <p class="project-description">${project.description}</p>
                <ul class="tag-list" aria-label="Technologies">${project.tags.map(tag => `<li>${tag}</li>`).join('')}</ul>
                <a class="card-link" href="${project.url}" target="_blank" rel="noopener noreferrer">View repository <span aria-hidden="true">↗</span></a>
              </article>
            `).join('')}
          </div>
          <p class="project-note">This list intentionally stays small. Only projects with a verifiable repository are shown; no demo metrics or fictional case studies.</p>
        </div>
      `
    },
    about: {
      title: 'About this workspace',
      kicker: 'PROFILE / 01',
      width: 650,
      height: 570,
      content: () => `
        <div class="app-content">
          <p class="eyebrow">PROFILE / APPROACH</p>
          <h2 class="app-heading">Learn by <span>building.</span></h2>
          <p class="app-lede">I'm Shimleabyte. This portfolio is a working interface for the projects I build, the systems I explore, and the design decisions I want to make visible.</p>
          <div class="profile-grid">
            <section class="info-tile"><span class="meta-label">01 / BUILD</span><strong>Small, real projects</strong><p>Prefer concrete implementations that can be inspected in source code over polished claims without evidence.</p></section>
            <section class="info-tile"><span class="meta-label">02 / UNDERSTAND</span><strong>Systems thinking</strong><p>Explore how state, interaction, data, and interface behavior fit together.</p></section>
            <section class="info-tile"><span class="meta-label">03 / DESIGN</span><strong>Interface as a system</strong><p>Use motion, type, color, and custom visual details to make behavior easier to understand.</p></section>
            <section class="info-tile"><span class="meta-label">04 / ITERATE</span><strong>Keep improving</strong><p>Treat each repository as a record of progress, decisions, and lessons learned.</p></section>
          </div>
          <section class="window-section">
            <h3 class="section-heading">Current project context</h3>
            <div class="skill-row"><span class="skill-chip">Go / CLI</span><span class="skill-chip">HTML + CSS</span><span class="skill-chip">JavaScript</span><span class="skill-chip">Git / GitHub</span></div>
          </section>
        </div>
      `
    },
    contact: {
      title: 'Connect',
      kicker: 'CONTACT / LINKS',
      width: 500,
      height: 460,
      content: () => `
        <div class="app-content">
          <p class="eyebrow">OPEN CHANNELS</p>
          <h2 class="app-heading">Let's keep it <span>direct.</span></h2>
          <p class="app-lede">The links below are intended destinations, not decorative placeholders.</p>
          <div class="contact-list">
            <a class="contact-link" href="https://github.com/shimleabyte" target="_blank" rel="noopener noreferrer"><span class="contact-symbol">GH</span><span class="contact-copy"><strong>GitHub</strong><small>github.com/shimleabyte</small></span><span class="contact-arrow" aria-hidden="true">↗</span></a>
            <a class="contact-link" href="mailto:presentshimley@gmail.com"><span class="contact-symbol">@</span><span class="contact-copy"><strong>Email</strong><small>presentshimley@gmail.com</small></span><span class="contact-arrow" aria-hidden="true">↗</span></a>
          </div>
          <p class="project-note">Only contact destinations already present in the repository are included. No placeholder social profiles.</p>
        </div>
      `
    },
    terminal: {
      title: 'Terminal',
      kicker: 'SHELL / SIMULATED',
      width: 650,
      height: 470,
      content: () => `
        <div class="terminal-app">
          <div class="terminal-topline"><span>SHIMLEABYTE SHELL</span><span>SIMULATED · READ ONLY</span></div>
          <div class="terminal-output" role="log" aria-live="polite">
            <p class="terminal-line">Welcome to the OSBio shell. Type <span class="terminal-command">help</span> to see available commands.</p>
          </div>
          <form class="terminal-input-row">
            <label class="terminal-prompt" for="terminal-command-input">$</label>
            <input class="terminal-input" id="terminal-command-input" name="command" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Terminal command">
            <span class="terminal-hint">ENTER TO RUN</span>
          </form>
        </div>
      `
    }
  };

  function isMobile() {
    return window.matchMedia('(max-width: 760px)').matches;
  }

  function syncDock() {
    dockButtons.forEach(button => {
      const appName = button.dataset.app;
      const entry = Array.from(openWindows.values()).find(item => item.appName === appName);
      button.classList.toggle('is-open', Boolean(entry));
      button.classList.toggle('is-active', Boolean(entry && entry.id === activeId && !entry.minimized));
      button.setAttribute('aria-pressed', String(Boolean(entry && entry.id === activeId && !entry.minimized)));
    });
  }

  function setContext(text) {
    const context = document.getElementById('system-context');
    if (context) context.textContent = text;
  }

  function focusWindow(id) {
    const entry = openWindows.get(id);
    if (!entry || entry.minimized) return;
    activeId = id;
    zIndex += 1;
    entry.element.style.zIndex = String(zIndex);
    openWindows.forEach(other => other.element.classList.toggle('is-active', other.id === id && !other.minimized));
    setContext(entry.appName.toUpperCase());
    syncDock();
  }

  function focusMostRecent(exceptId) {
    const candidates = Array.from(openWindows.values())
      .filter(item => item.id !== exceptId && !item.minimized)
      .sort((a, b) => Number(b.element.style.zIndex || 0) - Number(a.element.style.zIndex || 0));
    if (candidates.length) focusWindow(candidates[0].id);
    else {
      activeId = null;
      setContext('DESKTOP');
      syncDock();
    }
  }

  function createWindow(appName) {
    const app = apps[appName];
    if (!app) return null;
    const id = 'window-' + appName;
    if (openWindows.has(id)) {
      const existing = openWindows.get(id);
      existing.minimized = false;
      existing.element.classList.remove('is-minimized');
      focusWindow(id);
      return existing;
    }

    const element = document.createElement('section');
    element.className = 'app-window';
    element.dataset.windowId = id;
    element.dataset.app = appName;
    element.setAttribute('role', 'dialog');
    element.setAttribute('aria-label', app.title);
    const width = app.width;
    const height = app.height;
    const offset = (cascade++ % 5) * 26;
    const layerRect = layer.getBoundingClientRect();
    const left = isMobile() ? 8 : Math.max(16, Math.min((layerRect.width - width) / 2 + offset, layerRect.width - width - 16));
    const top = isMobile() ? 8 : Math.max(16, Math.min((layerRect.height - height) / 2 + offset, layerRect.height - height - 16));
    element.style.width = Math.min(width, Math.max(300, layerRect.width - 24)) + 'px';
    element.style.height = Math.min(height, Math.max(220, layerRect.height - 20)) + 'px';
    element.style.left = left + 'px';
    element.style.top = top + 'px';
    element.innerHTML = `
      <header class="window-titlebar">
        <div class="window-lights" aria-label="Window controls">
          <button type="button" class="window-control close" data-window-action="close" aria-label="Close window">×</button>
          <button type="button" class="window-control minimize" data-window-action="minimize" aria-label="Minimize window">−</button>
          <button type="button" class="window-control maximize" data-window-action="maximize" aria-label="Maximize or restore window">+</button>
        </div>
        <span class="window-title">${app.title}</span>
        <span class="window-kicker">${app.kicker}</span>
      </header>
      <div class="window-body">${app.content()}</div>
    `;
    layer.appendChild(element);
    const entry = { id, appName, element, minimized: false, maximized: false, restoreRect: null };
    openWindows.set(id, entry);
    setupWindow(entry);
    focusWindow(id);
    return entry;
  }

  function setupWindow(entry) {
    const { element, id } = entry;
    element.addEventListener('pointerdown', () => focusWindow(id));
    element.querySelectorAll('[data-window-action]').forEach(button => {
      button.addEventListener('click', event => {
        event.stopPropagation();
        const action = button.dataset.windowAction;
        if (action === 'close') closeWindow(id);
        if (action === 'minimize') minimizeWindow(id);
        if (action === 'maximize') toggleMaximize(id);
      });
    });

    const titlebar = element.querySelector('.window-titlebar');
    titlebar.addEventListener('pointerdown', event => {
      if (isMobile() || event.target.closest('button')) return;
      focusWindow(id);
      if (entry.maximized) return;
      const rect = element.getBoundingClientRect();
      const layerRect = layer.getBoundingClientRect();
      dragState = { id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, left: rect.left - layerRect.left, top: rect.top - layerRect.top };
      titlebar.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    titlebar.addEventListener('pointermove', event => {
      if (!dragState || dragState.id !== id || dragState.pointerId !== event.pointerId) return;
      const layerRect = layer.getBoundingClientRect();
      const maxLeft = Math.max(0, layerRect.width - element.offsetWidth);
      const maxTop = Math.max(0, layerRect.height - element.offsetHeight);
      element.style.left = Math.max(0, Math.min(maxLeft, dragState.left + event.clientX - dragState.startX)) + 'px';
      element.style.top = Math.max(0, Math.min(maxTop, dragState.top + event.clientY - dragState.startY)) + 'px';
    });
    const stopDrag = event => {
      if (dragState && dragState.id === id && dragState.pointerId === event.pointerId) dragState = null;
    };
    titlebar.addEventListener('pointerup', stopDrag);
    titlebar.addEventListener('pointercancel', stopDrag);

    if (entry.appName === 'terminal') setupTerminal(element);
  }

  function closeWindow(id) {
    const entry = openWindows.get(id);
    if (!entry) return;
    entry.element.remove();
    openWindows.delete(id);
    if (activeId === id) focusMostRecent(id);
    syncDock();
  }

  function minimizeWindow(id) {
    const entry = openWindows.get(id);
    if (!entry) return;
    entry.minimized = true;
    entry.element.classList.add('is-minimized');
    if (activeId === id) focusMostRecent(id);
    syncDock();
  }

  function toggleMaximize(id) {
    const entry = openWindows.get(id);
    if (!entry) return;
    const element = entry.element;
    if (!entry.maximized) {
      entry.restoreRect = { left: element.style.left, top: element.style.top, width: element.style.width, height: element.style.height };
      entry.maximized = true;
      element.classList.add('is-maximized');
    } else {
      entry.maximized = false;
      element.classList.remove('is-maximized');
      if (entry.restoreRect) Object.assign(element.style, entry.restoreRect);
    }
    focusWindow(id);
  }

  function openWindow(appName) {
    const entry = createWindow(appName);
    if (!entry) return;
    entry.minimized = false;
    entry.element.classList.remove('is-minimized');
    focusWindow(entry.id);
    return entry;
  }

  function toggleApp(appName) {
    const entry = openWindows.get('window-' + appName);
    if (!entry) {
      openWindow(appName);
    } else if (entry.minimized) {
      entry.minimized = false;
      entry.element.classList.remove('is-minimized');
      focusWindow(entry.id);
    } else if (activeId === entry.id) {
      minimizeWindow(entry.id);
    } else {
      focusWindow(entry.id);
    }
  }

  function showDesktop() {
    const anyVisible = Array.from(openWindows.values()).some(entry => !entry.minimized);
    if (anyVisible) {
      openWindows.forEach(entry => {
        entry.minimized = true;
        entry.element.classList.add('is-minimized');
      });
      activeId = null;
      setContext('DESKTOP');
      syncDock();
    } else {
      focusMostRecent(null);
    }
  }

  function setupTerminal(element) {
    const form = element.querySelector('.terminal-input-row');
    const input = element.querySelector('.terminal-input');
    const output = element.querySelector('.terminal-output');
    if (!form || !input || !output) return;

    const writeLine = (text, className = 'terminal-result') => {
      const line = document.createElement('p');
      line.className = className;
      line.textContent = text;
      output.appendChild(line);
      output.scrollTop = output.scrollHeight;
    };
    const runCommand = raw => {
      const command = raw.trim();
      const line = document.createElement('p');
      line.className = 'terminal-line';
      const prompt = document.createElement('span');
      prompt.className = 'terminal-prompt';
      prompt.textContent = '$ ';
      const echo = document.createElement('span');
      echo.className = 'terminal-command';
      echo.textContent = command;
      line.append(prompt, echo);
      output.appendChild(line);
      if (!command) return;
      const parts = command.toLowerCase().split(/\s+/);
      const cmd = parts[0];
      const arg = parts[1];
      if (cmd === 'help') {
        writeLine('help                 Show available commands');
        writeLine('about                Open the profile window');
        writeLine('projects             List verified repositories');
        writeLine('contact              Open contact links');
        writeLine('open <app>           Open about, projects, terminal, or contact');
        writeLine('clear                Clear the terminal output');
      } else if (cmd === 'about') {
        writeLine('Shimleabyte — developer workspace focused on real projects and learning by building.');
        openWindow('about');
      } else if (cmd === 'projects') {
        projects.forEach(project => writeLine(project.name + ' — ' + project.url));
      } else if (cmd === 'contact') {
        writeLine('GitHub: https://github.com/shimleabyte');
        writeLine('Email: presentshimley@gmail.com');
        openWindow('contact');
      } else if (cmd === 'open' && apps[arg]) {
        writeLine('Opening ' + arg + '…');
        openWindow(arg);
      } else if (cmd === 'clear') {
        output.replaceChildren();
      } else {
        writeLine('Unknown command. Type "help" for available commands.');
      }
      output.scrollTop = output.scrollHeight;
    };
    form.addEventListener('submit', event => {
      event.preventDefault();
      const command = input.value;
      input.value = '';
      runCommand(command);
    });
    element.addEventListener('pointerdown', event => {
      if (event.target === output || event.target.classList.contains('terminal-app')) {
        if (!isMobile()) input.focus({ preventScroll: true });
      }
    });
  }

  document.querySelectorAll('.dock-app[data-app]').forEach(button => {
    button.addEventListener('click', () => toggleApp(button.dataset.app));
  });
  document.querySelectorAll('[data-action="show-desktop"]').forEach(button => button.addEventListener('click', showDesktop));
  window.addEventListener('resize', () => {
    if (!isMobile()) return;
    openWindows.forEach(entry => {
      entry.element.style.left = '8px';
      entry.element.style.top = '8px';
    });
  });

  window.WindowManager = { openWindow, closeWindow, showDesktop, toggleApp };
})();
