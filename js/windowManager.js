/* OSBio window manager.
   Custom pixel-flow interface, real project evidence, and no shell execution. */
(function () {
  'use strict';

  const desktop = document.getElementById('desktop-screen');
  const layer = document.getElementById('window-layer');
  const contextLabel = document.getElementById('system-context');
  const appButtons = Array.from(document.querySelectorAll('[data-app]'));
  const windows = new Map();
  let activeId = null;
  let nextZ = 30;
  let cascade = 0;
  let drag = null;
  let initialized = false;

  const projectData = [
    {
      number: '01',
      name: 'Mutabaah CLI',
      symbol: '$_',
      symbolClass: '',
      description: 'A Go command-line tool for managing mutabaah activities with JSON-backed local data.',
      approach: 'Command dispatch in main.go is separated from activity operations and JSON file persistence.',
      tags: ['Go', 'CLI', 'JSON', 'File I/O'],
      repo: 'https://github.com/shimleabyte/mutabaah-cli'
    },
    {
      number: '02',
      name: 'OSBio',
      symbol: 'PX',
      symbolClass: 'flow',
      description: 'A static portfolio presented as an interactive desktop with a dock, application windows, and a simulated terminal.',
      approach: 'A vanilla JavaScript window manager coordinates focus, dragging, minimize, maximize, restore, and app switching.',
      tags: ['HTML', 'CSS', 'JavaScript', 'Static site'],
      repo: 'https://github.com/shimleabyte/osbio',
      live: 'https://shimleabyte.github.io/osbio/'
    }
  ];

  const appTemplates = {
    about: {
      title: 'About this workspace',
      kicker: 'PROFILE / 01',
      width: 660,
      height: 600,
      content: () => `
        <div class="app-content about-app">
          <p class="eyebrow">PROFILE / APPROACH</p>
          <h1 class="app-heading">Learn by <span>building.</span></h1>
          <p class="app-lede">I'm Shimleabyte. This workspace presents real repositories and the implementation decisions behind them. I use small builds to understand how interfaces, state, and data behave together.</p>
          <div class="profile-grid">
            <section class="profile-item"><span class="meta-label">01 / BUILD</span><strong>Inspectable projects</strong><p>Prefer implementations that can be inspected in source instead of claims without evidence.</p></section>
            <section class="profile-item"><span class="meta-label">02 / UNDERSTAND</span><strong>Systems thinking</strong><p>Study how interactions, application state, and persistence fit together.</p></section>
            <section class="profile-item"><span class="meta-label">03 / DESIGN</span><strong>Purposeful interfaces</strong><p>Use hierarchy, typography, and custom pixel geometry to make the structure visible.</p></section>
            <section class="profile-item"><span class="meta-label">04 / ITERATE</span><strong>Keep the evidence</strong><p>Make decisions and limitations visible rather than inventing metrics or project maturity.</p></section>
          </div>
          <section class="window-section">
            <h2 class="section-heading">Current project context</h2>
            <div class="tech-list"><span class="tech-label">Go / CLI</span><span class="tech-label">HTML + CSS</span><span class="tech-label">JavaScript</span><span class="tech-label">Git / GitHub</span></div>
          </section>
        </div>
      `
    },
    projects: {
      title: 'Project index',
      kicker: 'REPOSITORIES / 02',
      width: 900,
      height: 660,
      content: () => `
        <div class="app-content projects-app">
          <p class="eyebrow">WORKSPACE / PROJECT INDEX</p>
          <h1 class="app-heading">Selected <span>work.</span></h1>
          <p class="app-lede">A small index of public repositories. Implementation notes describe choices visible in the projects; no invented performance metrics or placeholder case studies.</p>
          <div class="project-index">
            ${projectData.map(project => `
              <article class="project-row">
                <div class="project-aside">
                  <span class="project-number">PROJECT / ${project.number}</span>
                  <span class="project-symbol ${project.symbolClass}" aria-hidden="true">${project.symbol}</span>
                </div>
                <div class="project-main">
                  <h2 class="project-title">${project.name}</h2>
                  <p class="project-description">${project.description}</p>
                  <ul class="tag-list" aria-label="Technologies">${project.tags.map(tag => `<li>${tag}</li>`).join('')}</ul>
                  <div class="project-links">
                    <a class="text-action" href="${project.repo}" target="_blank" rel="noopener noreferrer">Source repository ↗</a>
                    ${project.live ? `<a class="text-action" href="${project.live}" target="_blank" rel="noopener noreferrer">Live version ↗</a>` : ''}
                  </div>
                </div>
                <div class="project-details">
                  <p class="project-approach"><span class="project-approach-label">Implementation note</span>${project.approach}</p>
                </div>
              </article>
            `).join('')}
          </div>
          <p class="project-note">Only repositories with verifiable source are listed. The index intentionally avoids sample projects, fabricated metrics, and unsupported status claims.</p>
        </div>
      `
    },
    contact: {
      title: 'Contact',
      kicker: 'CONTACT / LINKS',
      width: 500,
      height: 470,
      content: () => `
        <div class="app-content contact-app">
          <p class="eyebrow">OPEN CHANNELS</p>
          <h1 class="app-heading">Keep it <span>direct.</span></h1>
          <p class="app-lede">Reach me through the destinations already associated with this portfolio.</p>
          <div class="contact-list">
            <a class="contact-link" href="https://github.com/shimleabyte" target="_blank" rel="noopener noreferrer">
              <span class="contact-symbol">GH</span><span class="contact-copy"><strong>GitHub</strong><small>github.com/shimleabyte</small></span><span aria-hidden="true">↗</span>
            </a>
            <a class="contact-link" href="mailto:presentshimley@gmail.com">
              <span class="contact-symbol">@</span><span class="contact-copy"><strong>Email</strong><small>presentshimley@gmail.com</small></span><span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      `
    },
    resume: {
      title: 'Resume',
      kicker: 'DOCUMENT / PDF',
      width: 860,
      height: 700,
      content: () => `
        <div class="resume-app">
          <div class="resume-actions">
            <a href="resume.pdf" class="resume-action" download>Download PDF ↓</a>
            <button type="button" class="resume-action view-toggle">Fit width / height</button>
          </div>
          <div class="resume-preview">
            <iframe src="resume.pdf#view=FitH" class="resume-iframe" title="Resume PDF preview"></iframe>
          </div>
          <p class="resume-note">Preview unavailable? <a href="resume.pdf" download>Download the PDF</a>.</p>
        </div>
      `
    },
    terminal: {
      title: 'Terminal',
      kicker: 'SHELL / SIMULATED',
      width: 700,
      height: 520,
      content: () => `
        <div class="terminal-app">
          <div class="terminal-topline"><span>SHIMLEABYTE SHELL</span><span>SIMULATED / READ ONLY</span></div>
          <div class="terminal-output" role="log" aria-live="polite">
            <p class="terminal-line">OSBio terminal. Type <span class="terminal-command">help</span> to list available commands.</p>
          </div>
          <form class="terminal-input-row">
            <label class="terminal-prompt" for="terminal-input"> $ </label>
            <input type="text" class="terminal-input" id="terminal-input" name="command" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Terminal command">
            <span class="terminal-hint">ENTER TO RUN</span>
          </form>
        </div>
      `
    },
    memory: {
      title: 'Memory Match',
      kicker: 'MINI / GAME',
      width: 500,
      height: 590,
      content: () => `
        <div class="memory-app">
          <header class="memory-head">
            <div><p class="eyebrow">PATTERN RECOGNITION</p><h2>Memory Match</h2></div>
            <div class="memory-stats">
              <span class="memory-stat">Moves <strong id="memory-moves">0</strong></span>
              <button class="memory-restart" id="memory-restart" type="button">Restart</button>
            </div>
          </header>
          <div class="memory-board" id="memory-board" role="group" aria-label="Memory match cards"></div>
          <p class="memory-message" id="memory-message" aria-live="polite">Find all six pairs. Select two tiles to reveal their values.</p>
        </div>
      `
    }
  };

  function isMobile() {
    return window.matchMedia('(max-width: 760px)').matches;
  }

  function updateButtons() {
    appButtons.forEach(button => {
      const entry = windows.get(button.dataset.app);
      const isOpen = Boolean(entry);
      const isActive = Boolean(entry && entry.id === activeId && !entry.minimized);
      button.classList.toggle('is-open', isOpen);
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  }

  function updateContext(value) {
    if (contextLabel) contextLabel.textContent = value;
  }

  function focusWindow(id) {
    const entry = windows.get(id);
    if (!entry || entry.minimized) return;
    activeId = id;
    entry.z = ++nextZ;
    entry.element.style.zIndex = String(entry.z);
    windows.forEach(other => other.element.classList.toggle('is-active', other.id === id && !other.minimized));
    updateContext(entry.appName.toUpperCase());
    updateButtons();
  }

  function focusMostRecent(exceptId) {
    const recent = Array.from(windows.values())
      .filter(entry => entry.id !== exceptId && !entry.minimized)
      .sort((a, b) => b.z - a.z)[0];
    if (recent) focusWindow(recent.id);
    else {
      activeId = null;
      updateContext('DESKTOP');
      updateButtons();
    }
  }

  function renderWindow(appName) {
    const template = appTemplates[appName];
    if (!template) return null;
    const id = 'window-' + appName;
    const element = document.createElement('section');
    element.className = 'app-window';
    element.dataset.app = appName;
    element.dataset.windowId = id;
    element.setAttribute('role', 'dialog');
    element.setAttribute('aria-labelledby', id + '-title');

    const layerWidth = layer.clientWidth;
    const layerHeight = layer.clientHeight;
    const width = Math.min(template.width, Math.max(300, layerWidth - 24));
    const height = Math.min(template.height, Math.max(220, layerHeight - 20));
    const offset = (cascade++ % 5) * 24;
    element.style.width = width + 'px';
    element.style.height = height + 'px';
    element.style.left = Math.max(12, Math.min((layerWidth - width) / 2 + offset, layerWidth - width - 12)) + 'px';
    element.style.top = Math.max(12, Math.min((layerHeight - height) / 2 + offset, layerHeight - height - 12)) + 'px';

    element.innerHTML = `
      <header class="window-header">
        <div class="window-controls" aria-label="Window controls">
          <button class="window-control" type="button" data-window-action="close" aria-label="Close window">×</button>
          <button class="window-control" type="button" data-window-action="minimize" aria-label="Minimize window">−</button>
          <button class="window-control" type="button" data-window-action="maximize" aria-label="Maximize or restore window">□</button>
        </div>
        <span class="window-title" id="${id}-title">${template.title}</span>
        <span class="window-kicker">${template.kicker}</span>
      </header>
      <div class="window-content">${template.content()}</div>
    `;
    layer.appendChild(element);

    const entry = { id, appName, element, title: template.title, z: ++nextZ, minimized: false, maximized: false, restoreRect: null };
    windows.set(appName, entry);
    setupWindow(entry);
    return entry;
  }

  function openWindow(appName) {
    if (!appTemplates[appName]) return null;

    if (isMobile()) {
      windows.forEach(other => {
        if (other.appName !== appName) {
          other.minimized = true;
          other.element.classList.add('is-minimized');
        }
      });
    }

    let entry = windows.get(appName);
    if (entry) {
      entry.minimized = false;
      entry.element.classList.remove('is-minimized');
    } else {
      entry = renderWindow(appName);
    }
    focusWindow(entry.id);
    return entry;
  }

  function toggleWindow(appName) {
    const entry = windows.get(appName);
    if (!entry) {
      openWindow(appName);
    } else if (entry.minimized) {
      openWindow(appName);
    } else if (activeId === entry.id) {
      minimizeWindow(entry.id);
    } else {
      focusWindow(entry.id);
    }
  }

  function setupWindow(entry) {
    const { element, id, appName } = entry;
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

    const header = element.querySelector('.window-header');
    header.addEventListener('pointerdown', event => {
      if (isMobile() || event.target.closest('button') || entry.maximized) return;
      focusWindow(id);
      const rect = element.getBoundingClientRect();
      const layerRect = layer.getBoundingClientRect();
      drag = {
        id, pointerId: event.pointerId,
        startX: event.clientX, startY: event.clientY,
        left: rect.left - layerRect.left, top: rect.top - layerRect.top
      };
      header.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    header.addEventListener('pointermove', event => {
      if (!drag || drag.id !== id || drag.pointerId !== event.pointerId) return;
      const bounds = layer.getBoundingClientRect();
      const maxLeft = Math.max(0, bounds.width - element.offsetWidth);
      const maxTop = Math.max(0, bounds.height - element.offsetHeight);
      element.style.left = Math.max(0, Math.min(maxLeft, drag.left + event.clientX - drag.startX)) + 'px';
      element.style.top = Math.max(0, Math.min(maxTop, drag.top + event.clientY - drag.startY)) + 'px';
    });
    const stopDrag = event => {
      if (drag && drag.id === id && drag.pointerId === event.pointerId) drag = null;
    };
    header.addEventListener('pointerup', stopDrag);
    header.addEventListener('pointercancel', stopDrag);

    if (appName === 'terminal') setupTerminal(element);
    if (appName === 'resume') setupResume(element);
    if (appName === 'memory') setupMemory(element);
  }

  function closeWindow(id) {
    const entry = Array.from(windows.values()).find(item => item.id === id);
    if (!entry) return;
    entry.element.remove();
    windows.delete(entry.appName);
    if (activeId === id) {
      activeId = null;
      focusMostRecent(id);
    }
    updateButtons();
  }

  function minimizeWindow(id) {
    const entry = Array.from(windows.values()).find(item => item.id === id);
    if (!entry) return;
    entry.minimized = true;
    entry.element.classList.add('is-minimized');
    if (activeId === id) {
      activeId = null;
      focusMostRecent(id);
    }
    updateButtons();
  }

  function toggleMaximize(id) {
    const entry = Array.from(windows.values()).find(item => item.id === id);
    if (!entry) return;
    if (!entry.maximized) {
      const style = entry.element.style;
      entry.restoreRect = { left: style.left, top: style.top, width: style.width, height: style.height };
      entry.maximized = true;
      entry.element.classList.add('is-maximized');
    } else {
      entry.maximized = false;
      entry.element.classList.remove('is-maximized');
      if (entry.restoreRect) Object.assign(entry.element.style, entry.restoreRect);
    }
    focusWindow(id);
  }

  function showDesktop() {
    windows.forEach(entry => {
      entry.minimized = true;
      entry.element.classList.add('is-minimized');
    });
    activeId = null;
    updateContext('DESKTOP');
    updateButtons();
  }

  function writeTerminalLine(output, text, className = 'terminal-line') {
    const line = document.createElement('p');
    line.className = className;
    line.textContent = text;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
  }

  function setupTerminal(element) {
    const form = element.querySelector('.terminal-input-row');
    const input = element.querySelector('.terminal-input');
    const output = element.querySelector('.terminal-output');
    if (!form || !input || !output) return;

    form.addEventListener('submit', event => {
      event.preventDefault();
      const raw = input.value.trim();
      input.value = '';
      writeTerminalLine(output, '$ ' + raw, 'terminal-line');
      if (!raw) return;

      const [command, ...args] = raw.toLowerCase().split(/\s+/);
      const arg = args[0];
      if (command === 'help') {
        [
          'help                 List available commands',
          'about                Open the profile',
          'projects             List verified repositories',
          'contact              Show contact destinations',
          'resume               Open the resume PDF',
          'memory               Open Memory Match',
          'open <app>           Open an app by name',
          'clear                Clear terminal output'
        ].forEach(line => writeTerminalLine(output, line, 'terminal-result'));
      } else if (command === 'about') {
        writeTerminalLine(output, 'Shimleabyte — a developer workspace focused on real projects.');
        openWindow('about');
      } else if (command === 'projects') {
        projectData.forEach(project => writeTerminalLine(output, project.name + ' — ' + project.repo, 'terminal-result'));
      } else if (command === 'contact') {
        writeTerminalLine(output, 'GitHub: https://github.com/shimleabyte', 'terminal-result');
        writeTerminalLine(output, 'Email: presentshimley@gmail.com', 'terminal-result');
        openWindow('contact');
      } else if (command === 'resume') {
        writeTerminalLine(output, 'Opening resume.pdf', 'terminal-result');
        openWindow('resume');
      } else if (command === 'memory') {
        writeTerminalLine(output, 'Opening Memory Match', 'terminal-result');
        openWindow('memory');
      } else if (command === 'open' && appTemplates[arg]) {
        writeTerminalLine(output, 'Opening ' + arg, 'terminal-result');
        openWindow(arg);
      } else if (command === 'clear') {
        output.replaceChildren();
      } else {
        writeTerminalLine(output, 'Unknown command. Type "help" for available commands.', 'terminal-result');
      }
      output.scrollTop = output.scrollHeight;
    });
  }

  function setupResume(element) {
    const toggle = element.querySelector('.view-toggle');
    const frame = element.querySelector('.resume-iframe');
    if (!toggle || !frame) return;
    toggle.addEventListener('click', () => {
      const fitHeight = frame.src.includes('FitH');
      frame.src = fitHeight ? 'resume.pdf#view=FitV' : 'resume.pdf#view=FitH';
      toggle.textContent = fitHeight ? 'Fit height' : 'Fit width';
    });
  }

  function setupMemory(element) {
    const board = element.querySelector('#memory-board');
    const moveCounter = element.querySelector('#memory-moves');
    const message = element.querySelector('#memory-message');
    const restart = element.querySelector('#memory-restart');
    if (!board || !moveCounter || !message || !restart) return;

    const symbols = ['PX', '01', 'GO', 'JS', 'UI', 'DB'];
    let first = null;
    let locked = false;
    let moves = 0;
    let matched = 0;
    let timeoutId = null;

    function startGame() {
      if (timeoutId) window.clearTimeout(timeoutId);
      first = null;
      locked = false;
      moves = 0;
      matched = 0;
      moveCounter.textContent = '0';
      message.textContent = 'Find all six pairs. Select two tiles to reveal their values.';
      const deck = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
      board.replaceChildren();
      deck.forEach((symbol, index) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'memory-card';
        card.dataset.value = symbol;
        card.dataset.index = String(index);
        card.textContent = 'PX';
        card.setAttribute('aria-label', 'Hidden tile ' + String(index + 1));
        card.addEventListener('click', () => flipCard(card));
        board.appendChild(card);
      });
    }

    function flipCard(card) {
      if (locked || card.classList.contains('is-matched') || card === first || card.classList.contains('is-revealed')) return;
      card.classList.add('is-revealed');
      card.textContent = card.dataset.value;
      card.setAttribute('aria-label', 'Revealed tile ' + card.dataset.value);
      if (!first) {
        first = card;
        return;
      }

      moves += 1;
      moveCounter.textContent = String(moves);
      const previous = first;
      first = null;
      if (previous.dataset.value === card.dataset.value) {
        previous.classList.add('is-matched');
        card.classList.add('is-matched');
        previous.setAttribute('aria-disabled', 'true');
        card.setAttribute('aria-disabled', 'true');
        matched += 1;
        if (matched === symbols.length) message.textContent = 'All pairs found in ' + moves + ' moves.';
        return;
      }

      locked = true;
      timeoutId = window.setTimeout(() => {
        [previous, card].forEach(tile => {
          tile.classList.remove('is-revealed');
          tile.textContent = 'PX';
          tile.setAttribute('aria-label', 'Hidden tile ' + (Number(tile.dataset.index) + 1));
        });
        locked = false;
      }, 650);
    }

    restart.addEventListener('click', startGame);
    startGame();
  }

  function init() {
    if (initialized) return;
    initialized = true;
    if (!desktop || !layer) return;

    appButtons.forEach(button => button.addEventListener('click', event => {
      event.stopPropagation();
      toggleWindow(button.dataset.app);
    }));
    document.querySelectorAll('[data-action="show-desktop"]').forEach(button => {
      button.addEventListener('click', showDesktop);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && activeId) closeWindow(activeId);
    });
    window.addEventListener('resize', () => {
      if (!isMobile()) return;
      windows.forEach(entry => {
        entry.element.style.left = '8px';
        entry.element.style.top = '8px';
      });
    });
  }

  window.WindowManager = { init, openWindow, closeWindow, toggleWindow, showDesktop };
})();
