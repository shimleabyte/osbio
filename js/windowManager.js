/**
 * Window Management System for OS-Style Portfolio
 * 
 * Features:
 * - Open/close windows
 * - Focus management
 * - Taskbar integration
 * - Optional dragging
 */

const WindowManager = (() => {
  'use strict';

  // Icons (inline SVG, inherit currentColor)
  const ICON = {
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg>',
    github: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>',
    external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
  };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function buildProjectsMarkup() {
    const projects = Array.isArray(window.OSBioProjects) ? window.OSBioProjects : [];
    const cards = projects.map((project) => {
      const technologies = project.technologies.map(esc).join(', ');
      return '<article class="project-card" data-project="' + esc(project.id) + '">' +
        '<div class="project-header"><h3 class="project-title">' + esc(project.name) + '</h3><div class="project-stack">' + technologies + '</div></div>' +
        '<p class="project-desc">' + esc(project.summary) + '</p>' +
        '<div class="project-details"><div class="project-status">' + esc(project.statusLabel) + '</div>' +
        '<div class="project-learned"><strong>Focus:</strong> ' + esc(project.focus) + '</div>' +
        '<div class="project-links"><a href="' + esc(project.url) + '" class="btn btn-outline btn-sm" target="_blank" rel="noopener noreferrer"><span class="icon">' + ICON.github + '</span> Source Code</a></div>' +
        '</div></article>';
    }).join('');
    return '<div class="projects-app"><div class="projects-grid">' + cards + '</div></div>';
  }

  const emitOSBioEvent = (type, detail = {}) => {
    window.dispatchEvent(new CustomEvent('osbio:event', {
      detail: { type, timestamp: new Date().toISOString(), ...detail }
    }));
  };

  // Configuration
  const CONFIG = {
    windowTemplates: {
      about: {
        title: 'About Me',
        width: '600px',
        height: '500px',
        content: `
          <div class="about-app">
            <header class="about-header">
              <h1 class="about-name">Shimleabyte</h1>
              <p class="about-role">Frontend Developer / UI Systems</p>
            </header>
            
            <section class="about-section">
              <h2 class="section-title">Bio</h2>
              <p>I work on small, inspectable software systems: interface states, local data persistence, and the behavior between a user's action and a system's response.</p>
            </section>
            
            <section class="about-section">
              <h2 class="section-title">Tech Stack</h2>
              <div class="tech-stack">
                <div class="tech-category">
                  <h3>Frontend</h3>
                  <ul>
                    <li>JavaScript (ES6+)</li>
                    <li>React components</li>
                    <li>CSS and layout systems</li>
                  </ul>
                </div>
                <div class="tech-category">
                  <h3>Tools</h3>
                  <ul>
                    <li>Git & GitHub</li>
                    <li>Command-line workflows</li>
                    <li>JSON persistence</li>
                  </ul>
                </div>
              </div>
            </section>
            
            <section class="about-section">
              <h2 class="section-title">Focus & Interests</h2>
              <ul class="interests-list">
                <li>Window and interaction states</li>
                <li>Local-first data handling</li>
                <li>Component behavior and feedback</li>
                <li>Small tools with clear constraints</li>
              </ul>
            </section>
          </div>
        `
      },
      projects: {
        title: 'Projects',
        width: '750px',
        height: '600px',
        content: buildProjectsMarkup()
      },
      files: {
        title: 'Files', width: '760px', height: '560px',
        content: `
          <div class="files-app">
            <div class="files-toolbar" role="toolbar" aria-label="File actions">
              <button type="button" data-files-action="up">Up</button><button type="button" data-files-action="new-file">New file</button><button type="button" data-files-action="new-folder">New folder</button><button type="button" data-files-action="open" disabled>Open</button><button type="button" data-files-action="rename" disabled>Rename</button><button type="button" data-files-action="move-root" disabled>Move to root</button><button type="button" data-files-action="delete" disabled>Delete</button><span class="files-toolbar-spacer"></span><button type="button" data-files-action="import">Import</button><button type="button" data-files-action="export">Export</button>
              <input class="files-import-input" type="file" accept=".json,application/json" hidden aria-label="Import OSBio workspace export">
            </div>
            <nav class="files-breadcrumbs" aria-label="Current folder"></nav><div class="files-list-head"><span>TYPE</span><span>NAME</span><span>STATUS</span></div>
            <div class="files-list" role="group" aria-label="Workspace entries"></div><p class="files-empty" hidden>This folder is empty. Create a file or folder to begin.</p>
            <div class="files-status" role="status" aria-live="polite">Initializing local workspace…</div>
            <div class="files-name-dialog" role="dialog" aria-modal="false" aria-label="Name workspace item" hidden><form class="files-name-form"><label for="files-name-input">Name</label><input id="files-name-input" name="name" type="text" maxlength="120" required autocomplete="off"><p class="files-dialog-error" aria-live="polite"></p><div><button type="button" data-files-action="cancel-name">Cancel</button><button type="submit">Create</button></div></form></div>
          </div>
        `
      },
      editor: {
        title: 'Editor', width: '760px', height: '560px',
        content: `
          <div class="editor-app"><div class="editor-toolbar"><label for="editor-name">Document</label><input id="editor-name" type="text" maxlength="120" value="untitled.md" autocomplete="off"><span id="editor-dirty-state" class="editor-dirty-state">NEW DOCUMENT</span><button id="editor-save" type="button">Save</button><button id="editor-save-copy" type="button">Save copy</button></div><textarea id="editor-content" spellcheck="false" aria-label="Document contents" placeholder="Start writing…"></textarea><footer class="editor-status"><span id="editor-status-text" role="status" aria-live="polite">New document · not saved</span><span id="editor-character-count">0 chars</span></footer></div>
        `
      },
      settings: {
        title: 'Settings', width: '620px', height: '540px',
        content: `
          <div class="settings-app">
            <header class="settings-heading"><p class="settings-kicker">OSBIO / LOCAL WORKSPACE</p><h2>Settings</h2><p>Changes apply to this browser workspace and are stored locally when browser storage allows.</p></header>
            <section class="settings-section"><h3>Appearance</h3><label>Wallpaper <select id="setting-wallpaper"><option value="flow">Pixel-Flow</option><option value="grid">Grid only</option><option value="plain">Plain field</option></select></label><label>Accent signal <select id="setting-accent"><option value="yellow">Signal yellow</option><option value="green">Flow green</option></select></label><label>Motion <select id="setting-motion"><option value="system">Follow system</option><option value="reduced">Reduced motion</option></select></label><label class="settings-check"><input id="setting-desktop-icons" type="checkbox" checked> Show desktop shortcuts</label></section>
            <section class="settings-section"><h3>Workspace data</h3><p>Files are local to this browser. Export user files from Files before clearing them.</p><div class="settings-actions"><button id="settings-reset" type="button">Reset preferences</button><button id="settings-clear-data" type="button" class="settings-danger">Clear user files</button></div></section>
            <p id="settings-status" class="settings-status" role="status" aria-live="polite">Loading preferences…</p>
          </div>
        `
      },
      system: {
        title: 'System Monitor', width: '680px', height: '570px',
        content: `
          <div class="system-monitor-app">
            <header class="monitor-heading"><p class="monitor-kicker">OSBIO / SESSION</p><h2>System Monitor</h2><p>Actual browser-workspace state. Host CPU, memory and device telemetry are not available here.</p></header>
            <div class="monitor-metrics"><section><span>ACTIVE APP</span><strong id="monitor-active-app">Desktop</strong></section><section><span>OPEN WINDOWS</span><strong id="monitor-window-count">0</strong></section><section><span>VIRTUAL FILES</span><strong id="monitor-file-count">—</strong></section><section><span>VIRTUAL FOLDERS</span><strong id="monitor-folder-count">—</strong></section><section><span>TEXT CHARACTERS</span><strong id="monitor-character-count">—</strong></section><section><span>STORAGE MODE</span><strong id="monitor-storage-mode">—</strong></section></div>
            <div class="monitor-log-head"><h3>Recent events</h3><button id="monitor-clear-events" type="button">Clear history</button></div>
            <ol id="monitor-events" class="monitor-events" aria-label="Recent OSBio events"></ol>
            <p id="monitor-status" class="monitor-status" role="status" aria-live="polite">Reading workspace state…</p>
          </div>
        `
      },
      flow: {
        title: 'Flow Monitor', width: '780px', height: '620px',
        content: `
          <div class="flow-monitor-app">
            <header class="flow-heading"><div><p class="flow-kicker">OSBIO / EVENT TRACE</p><h2>Flow Monitor</h2><p>Recent state changes from this workspace. The trace stays in this browser tab and is not uploaded.</p></div><div class="flow-buffer"><span>BUFFER</span><strong>160 EVENTS</strong></div></header>
            <div class="flow-toolbar"><label for="flow-filter">Scope <select id="flow-filter"><option value="all">All events</option><option value="window">Windows</option><option value="file">Files and storage</option><option value="settings">Settings</option><option value="game">Games</option><option value="launcher">Launcher and navigation</option></select></label><label for="flow-search">Filter <input id="flow-search" type="search" placeholder="Type, app, or event detail"></label><button id="flow-export" type="button">Export trace</button><button id="flow-clear" type="button">Clear</button></div>
            <div class="flow-layout"><section class="flow-stream-section" aria-label="Event stream"><div class="flow-stream-count"><strong id="flow-event-count">0</strong><span>events</span></div><ol id="flow-event-list" class="flow-event-list"></ol><p id="flow-empty" class="flow-empty" hidden>No events match this filter.</p></section><aside class="flow-inspector" aria-label="Selected event details"><p class="flow-inspector-label">EVENT INSPECTOR</p><h3 id="flow-selected-type">Select an event</h3><p id="flow-selected-time" class="flow-selected-time">—</p><pre id="flow-event-detail">Choose an item from the stream to inspect its exact recorded fields.</pre></aside></div>
            <footer id="flow-status" class="flow-status" role="status" aria-live="polite">Waiting for workspace events.</footer>
          </div>
        `
      },
      contact: {
        title: 'Contact',
        width: '400px',
        height: 'auto',
        content: `
          <div class="contact-app">
            <div class="contact-list">
              <a href="mailto:presentshimley@gmail.com" class="contact-item" target="_blank" rel="noopener noreferrer">
                <span class="contact-icon">${ICON.mail}</span>
                <span class="contact-label">Email</span>
              </a>
              <a href="https://github.com/shimleabyte" class="contact-item" target="_blank" rel="noopener noreferrer">
                <span class="contact-icon">${ICON.github}</span>
                <span class="contact-label">GitHub</span>
              </a>
            </div>
          </div>
        `
      },
      resume: {
        title: 'Resume',
        width: '800px',
        height: '90vh',
        content: `
          <div class="resume-app">
            <section class="resume-unavailable" aria-labelledby="resume-status-title">
              <p class="resume-status-code">DOCUMENT / NOT PUBLISHED</p>
              <h2 id="resume-status-title">Resume PDF unavailable</h2>
              <p>The resume document has not been published in this repository yet. No download or preview is offered until the file is available.</p>
              <div class="project-links">
                <a href="mailto:presentshimley@gmail.com" class="btn btn-primary">Request a copy</a>
                <a href="https://github.com/shimleabyte" class="btn btn-outline" target="_blank" rel="noopener noreferrer">View GitHub</a>
              </div>
            </section>
          </div>
        `
      },
      memory: {
        title: 'Memory Match',
        width: '500px',
        height: '600px',
        content: `
          <div class="memory-game">
            <div class="game-header">
              <h3>Memory Match</h3>
              <div class="game-stats">
                <span class="moves">Turns: <span id="move-count">0</span></span>
                <span class="pairs-found"><span id="pair-count">0</span> / 8 pairs</span>
                <button id="restart-btn" class="btn btn-sm" type="button">New game</button>
              </div>
            </div>
            <div class="game-board" id="game-board" role="group" aria-label="Memory Match cards">
              <!-- Cards will be generated here -->
            </div>
            <div class="game-message" id="game-message">
              <p>Select two cards to reveal their symbols.</p>
            </div>
          </div>
        `
      },
      terminal: {
        title: 'Terminal',
        width: '700px',
        height: '500px',
        content: `
          <div class="terminal-app">
            <div class="terminal-output">
              <div class="terminal-line">
                <span class="terminal-prompt">$</span>
                <span class="terminal-text">OSBio / simulated terminal</span>
              </div>
              <div class="terminal-line">
                <span class="terminal-prompt">$</span>
                <span class="terminal-text">Type <span class="terminal-command">help</span> to see available commands</span>
              </div>
              <div class="terminal-line">
                <span class="terminal-prompt">$</span>
                <span class="terminal-text"></span>
              </div>
            </div>
            <div class="terminal-input-line">
              <span class="terminal-prompt">$</span>
              <input type="text" class="terminal-input" autofocus>
            </div>
          </div>
        `
      }
    },
    zIndex: 1000, // Starting z-index for windows
    windowOffset: 30 // Pixel offset for cascading windows
  };

  // State
  let openWindows = [];
  let activeWindowId = null;
  let windowCounter = 0;
  let windowOverview;
  let windowOverviewList;
  let windowOverviewEmpty;
  let overviewReturnFocus = null;

  // DOM Elements
  let desktopElement;
  let resizeFrame = null;
  let desktopResizeObserver = null;

  // Initialize the window manager
  function init() {
    desktopElement = document.getElementById('window-layer');
    if (!desktopElement) {
      console.error('Desktop element not found');
      return;
    }

    // Initialize shell controls and their initial state.
    initTaskbarButtons();
    initWindowOverview();
    updateTaskbarState();

    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        toggleWindowOverview(windowOverview.hidden);
        return;
      }
      if (e.key === 'Escape' && windowOverview && !windowOverview.hidden) {
        e.preventDefault();
        e.stopPropagation();
        toggleWindowOverview(false, true);
        return;
      }
      if (e.altKey && e.key === 'F4' && activeWindowId) {
        e.preventDefault();
        closeWindow(activeWindowId);
      }
    });

    document.addEventListener('click', (event) => {
      if (!windowOverview || windowOverview.hidden) return;
      const overviewToggle = document.getElementById('window-overview-toggle');
      if (windowOverview.contains(event.target) || overviewToggle?.contains(event.target)) return;
      toggleWindowOverview(false, false);
    });
    window.addEventListener('resize', scheduleConstrainWindows);
    if (typeof ResizeObserver === 'function') {
      desktopResizeObserver = new ResizeObserver(scheduleConstrainWindows);
      desktopResizeObserver.observe(desktopElement);
    }
  }

  // Keep non-maximized windows inside the available shell after a viewport change.
  // CSS media queries can change the layer after the resize event.
  // Wait two animation frames so bounds are measured from the settled layout.
  function scheduleConstrainWindows() {
    if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(() => {
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = null;
        constrainWindows();
      });
    });
  }

  function constrainWindows() {
    if (!desktopElement) return;
    const layerWidth = desktopElement.clientWidth;
    const layerHeight = desktopElement.clientHeight;

    openWindows.forEach((win) => {
      const element = win.element;
      win.maximized = element.classList.contains('maximized');
      win.snapped = element.classList.contains('snapped-left')
        ? 'left'
        : element.classList.contains('snapped-right') ? 'right' : null;
      if (win.maximized) return;

      const maxLeft = Math.max(0, layerWidth - element.offsetWidth);
      const maxTop = Math.max(0, layerHeight - element.offsetHeight);
      const nextLeft = Math.max(0, Math.min(element.offsetLeft, maxLeft));
      const nextTop = Math.max(0, Math.min(element.offsetTop, maxTop));
      element.style.left = `${nextLeft}px`;
      element.style.top = `${nextTop}px`;
    });
  }

  // Initialize taskbar button event listeners
  function initTaskbarButtons() {
    const taskbarButtons = document.querySelectorAll('.taskbar-btn');
    
    taskbarButtons.forEach(button => {
      const appName = button.dataset.app;
      if (appName) {
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleWindow(appName);
        });
      }
    });
  }

  function initWindowOverview() {
    const overviewToggle = document.getElementById('window-overview-toggle');
    if (!overviewToggle) return;

    windowOverview = document.createElement('aside');
    windowOverview.className = 'window-overview';
    windowOverview.id = 'window-overview';
    windowOverview.hidden = true;
    windowOverview.setAttribute('role', 'dialog');
    windowOverview.setAttribute('aria-label', 'Open windows');
    windowOverview.innerHTML = `
      <header class="window-overview-header">
        <span>OPEN WINDOWS</span>
        <button class="window-overview-close" type="button" aria-label="Close window overview">×</button>
      </header>
      <div class="window-overview-list" id="window-overview-list"></div>
      <p class="window-overview-empty" id="window-overview-empty">No windows are open.</p>
    `;
    windowOverviewList = windowOverview.querySelector('#window-overview-list');
    windowOverviewEmpty = windowOverview.querySelector('#window-overview-empty');
    // Keep the overview in the shell's top stacking layer so app windows cannot intercept its controls.
    document.getElementById('desktop-screen').appendChild(windowOverview);

    overviewToggle.addEventListener('click', () => toggleWindowOverview(windowOverview.hidden));
    windowOverview.querySelector('.window-overview-close').addEventListener('click', () => {
      toggleWindowOverview(false, true);
    });
    windowOverviewList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-window-id]');
      if (!button) return;
      focusWindow(button.dataset.windowId);
      toggleWindowOverview(false, false);
    });
  }

  function renderWindowOverview() {
    if (!windowOverviewList) return;
    windowOverviewList.replaceChildren();
    const ordered = [...openWindows].sort((a, b) => b.zIndex - a.zIndex);
    ordered.forEach((item) => {
      const template = CONFIG.windowTemplates[item.appName];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'window-overview-item';
      button.dataset.windowId = item.id;
      if (item.id === activeWindowId) button.classList.add('is-active');

      const name = document.createElement('span');
      name.className = 'window-overview-name';
      name.textContent = template.title;
      const status = document.createElement('small');
      status.textContent = item.minimized ? 'MINIMIZED' : item.id === activeWindowId ? 'ACTIVE' : 'OPEN';
      button.setAttribute('aria-label', template.title + ', ' + status.textContent.toLowerCase());
      button.append(name, status);
      windowOverviewList.appendChild(button);
    });
    if (windowOverviewEmpty) windowOverviewEmpty.hidden = ordered.length > 0;
  }

  function toggleWindowOverview(open, restoreFocus = false) {
    if (!windowOverview) return;
    if (open) overviewReturnFocus = document.activeElement;
    windowOverview.hidden = !open;
    if (open) {
      renderWindowOverview();
      const first = windowOverviewList.querySelector('button');
      (first || windowOverview.querySelector('.window-overview-close')).focus({ preventScroll: true });
      emitOSBioEvent('overview.opened', { windowCount: openWindows.length });
      return;
    }

    if (restoreFocus) {
      const previous = overviewReturnFocus;
      if (previous instanceof HTMLElement && previous.isConnected && !windowOverview.contains(previous)) {
        previous.focus({ preventScroll: true });
      } else {
        const active = openWindows.find((item) => item.id === activeWindowId);
        if (active) active.element.focus({ preventScroll: true });
        else document.getElementById('window-overview-toggle')?.focus({ preventScroll: true });
      }
    }
    overviewReturnFocus = null;
  }

  // Toggle window open/close
  function toggleWindow(appName) {
    const existingWindow = openWindows.find((w) => w.appName === appName);

    if (!existingWindow) {
      createWindow(appName);
      return;
    }

    if (existingWindow.id === activeWindowId && !existingWindow.minimized) {
      minimizeWindow(existingWindow.id);
      return;
    }

    focusWindow(existingWindow.id);
  }

  // Create a new window
  function createWindow(appName) {
    const template = CONFIG.windowTemplates[appName];
    if (!template) {
      console.error(`No template found for app: ${appName}`);
      return null;
    }

    windowCounter++;
    const windowId = `${appName}-${windowCounter}`;
    const zIndex = Math.max(CONFIG.zIndex, ...openWindows.map((w) => w.zIndex)) + 1;
    const offset = (openWindows.length % 6) * CONFIG.windowOffset;
    const preferredWidth = Number.parseFloat(template.width) || 480;
    const desktopSized = desktopElement.clientWidth >= 701;
    // Keep newly opened windows out of the desktop shortcut lane where space allows.
    const shortcutLane = desktopSized
      ? Math.min(124, Math.max(0, desktopElement.clientWidth - 320))
      : 0;
    const availableWidth = desktopSized
      ? Math.max(320, desktopElement.clientWidth - shortcutLane - 12)
      : desktopElement.clientWidth;
    const windowWidth = desktopSized ? Math.min(preferredWidth, availableWidth) : preferredWidth;
    const maxLeft = Math.max(0, desktopElement.clientWidth - Math.min(windowWidth, desktopElement.clientWidth));
    const maxTop = Math.max(0, desktopElement.clientHeight - 96);
    const top = Math.min(24 + offset, maxTop);
    const left = Math.min((desktopSized ? shortcutLane : 12) + offset, maxLeft);

    // Create window element
    const windowElement = document.createElement('div');
    windowElement.className = 'window';
    windowElement.id = windowId;
    windowElement.dataset.appName = appName;
    windowElement.setAttribute('role', 'dialog');
    windowElement.setAttribute('aria-labelledby', `${windowId}-title`);
    windowElement.setAttribute('aria-modal', 'false');
    windowElement.tabIndex = -1;
    windowElement.style.zIndex = zIndex;
    windowElement.style.width = desktopSized ? windowWidth + 'px' : template.width;
    windowElement.style.height = template.height;
    windowElement.style.top = `${top}px`;
    windowElement.style.left = `${left}px`;
    windowElement.style.maxWidth = '100%';
    windowElement.style.maxHeight = '100%';

    // Window header
    const header = document.createElement('div');
    header.className = 'window-header';
    header.innerHTML = `
      <div class="window-title-group">
        <span class="window-app-marker" aria-hidden="true"></span>
        <span class="window-title" id="${windowId}-title">${template.title}</span>
      </div>
      <div class="window-controls" role="group" aria-label="${esc(template.title)} window controls">
        <button class="window-control window-minimize" data-window-action="minimize" aria-label="Minimize ${esc(template.title)}" title="Minimize" type="button">_</button>
        <button class="window-control window-maximize" data-window-action="maximize" aria-label="Maximize ${esc(template.title)}" title="Maximize / restore" type="button">□</button>
        <button class="window-control window-close" data-window-action="close" aria-label="Close ${esc(template.title)}" title="Close" type="button">×</button>
      </div>
    `;

    // Window content
    const content = document.createElement('div');
    content.className = 'window-content';
    content.innerHTML = template.content;

    // Assemble window
    windowElement.appendChild(header);
    windowElement.appendChild(content);
    
    // Add to DOM
    desktopElement.appendChild(windowElement);

    // Set up event listeners
    setupWindowEvents(windowElement, windowId, appName);

    // Add to open windows
    const windowData = {
      id: windowId,
      appName,
      element: windowElement,
      zIndex,
      minimized: false,
      maximized: false,
      restoreBounds: null,
      snapped: null
    };

    openWindows.push(windowData);
    emitOSBioEvent('window.opened', { app: appName, windowId });
    focusWindow(windowId);

    return windowId;
  }

  // Set up window event listeners
  function setupWindowEvents(windowElement, windowId, appName) {
    const header = windowElement.querySelector('.window-header');
    const closeBtn = windowElement.querySelector('.window-close');
    const minimizeBtn = windowElement.querySelector('.window-minimize');
    const maximizeBtn = windowElement.querySelector('.window-maximize');
    let isDragging = false;
    let didMove = false;
    let offsetX, offsetY;

    // Focus window when clicked
    windowElement.addEventListener('pointerdown', (e) => {
      if (!isDragging) {
        focusWindow(windowId);
      }
    });

    // Close button
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeWindow(windowId);
    });
    minimizeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      minimizeWindow(windowId);
    });
    maximizeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      maximizeWindow(windowId);
    });
    header.addEventListener('dblclick', (e) => {
      if (e.target.closest('.window-controls')) return;
      maximizeWindow(windowId);
    });

    // Dragging functionality
    header.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || !(e.target === header || e.target.closest('.window-title-group'))) return;

      const target = openWindows.find((item) => item.id === windowId);
      if (!target) return;

      // Pull maximized/snapped windows back into a normal, draggable size.
      if (target.maximized || target.snapped) {
        const restore = target.restoreBounds || { left: '24px', top: '24px', width: '600px', height: '420px' };
        target.maximized = false;
        target.snapped = null;
        windowElement.classList.remove('maximized', 'snapped-left', 'snapped-right');
        windowElement.style.width = restore.width;
        windowElement.style.height = restore.height;
        const restoredWidth = windowElement.offsetWidth;
        const left = Math.max(0, Math.min(e.clientX - Math.min(restoredWidth / 2, 150), desktopElement.clientWidth - restoredWidth));
        const top = Math.max(0, Math.min(e.clientY - header.offsetHeight / 2, desktopElement.clientHeight - header.offsetHeight));
        windowElement.style.left = left + 'px';
        windowElement.style.top = top + 'px';
        target.restoreBounds = null;
        emitOSBioEvent('window.restored-for-drag', { app: target.appName, windowId });
      }

      isDragging = true;
      didMove = false;
      offsetX = e.clientX - windowElement.offsetLeft;
      offsetY = e.clientY - windowElement.offsetTop;
      header.setPointerCapture?.(e.pointerId);
      document.addEventListener('pointermove', handleDrag);
      document.addEventListener('pointerup', stopDrag);
      document.addEventListener('pointercancel', stopDrag);
      focusWindow(windowId);
    });

    function handleDrag(e) {
      if (isDragging) {
        const x = e.clientX - offsetX;
        const y = e.clientY - offsetY;
        
        // Keep window within viewport
        const maxX = Math.max(0, desktopElement.clientWidth - windowElement.offsetWidth);
        const maxY = Math.max(0, desktopElement.clientHeight - windowElement.offsetHeight);

        const nextX = Math.max(0, Math.min(x, maxX));
        const nextY = Math.max(0, Math.min(y, maxY));
        if (Math.abs(nextX - windowElement.offsetLeft) > 1 || Math.abs(nextY - windowElement.offsetTop) > 1) didMove = true;
        windowElement.style.left = `${nextX}px`;
        windowElement.style.top = `${nextY}px`;
      }
    }

    function stopDrag(event) {
      isDragging = false;
      document.removeEventListener('pointermove', handleDrag);
      document.removeEventListener('pointerup', stopDrag);
      document.removeEventListener('pointercancel', stopDrag);

      if (!didMove || event?.type !== 'pointerup' || desktopElement.clientWidth < 701) return;
      if (event.clientY <= 8) {
        maximizeWindow(windowId);
      } else if (event.clientX <= 8) {
        snapWindow(windowId, 'left');
      } else if (desktopElement.clientWidth - event.clientX <= 8) {
        snapWindow(windowId, 'right');
      }
    }

    if (window.OSBioWorkspaceApps) window.OSBioWorkspaceApps.mount(windowElement, appName);

    // Projects app specific functionality
    if (appName === 'projects') {
      const projectCards = windowElement.querySelectorAll('.project-card');
      
      projectCards.forEach(card => {
        card.addEventListener('click', (e) => {
          // Don't toggle if clicking on a link or button
          if (e.target.tagName === 'A' || e.target.closest('a, button, .btn')) {
            return;
          }
          
          const wasActive = card.classList.contains('active');
          
          // Close all other project cards
          projectCards.forEach(c => c.classList.remove('active'));
          
          // Toggle the clicked card if it wasn't active
          if (!wasActive) {
            card.classList.add('active');
            
            // Scroll the card into view if it's near the bottom of the window
            const rect = card.getBoundingClientRect();
            const isInViewport = (
              rect.top >= 0 &&
              rect.left >= 0 &&
              rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
              rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
            
            if (!isInViewport) {
              card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }
        });
      });
      
      // Handle clicks on project links (prevent event bubbling)
      const projectLinks = windowElement.querySelectorAll('.project-links a');
      projectLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.stopPropagation();
        });
      });
    }
    
    // Resume app specific functionality
    if (appName === 'resume') {
      const viewToggle = windowElement.querySelector('.view-toggle');
      const iframe = windowElement.querySelector('.resume-iframe');
      
      if (viewToggle && iframe) {
        viewToggle.addEventListener('click', () => {
          const isFitH = iframe.src.includes('FitH');
          if (isFitH) {
            iframe.src = iframe.src.replace('FitH', 'FitV');
            viewToggle.innerHTML = '<span class="icon">' + ICON.eye + '</span> Fit width';
          } else {
            iframe.src = iframe.src.replace('FitV', 'FitH');
            viewToggle.innerHTML = '<span class="icon">' + ICON.eye + '</span> Fit height';
          }
        });
      }
    }
    
    // Terminal app specific functionality
    if (appName === 'terminal') {
      const terminalOutput = windowElement.querySelector('.terminal-output');
      const terminalInput = windowElement.querySelector('.terminal-input');
      
      // Command history and navigation
      let commandHistory = [];
      let historyIndex = -1;
      let currentCommand = '';
      
      // Available commands
      const commands = {
        help: {
          description: 'Display this help message',
          execute: () => {
            const helpText = `
  Available commands:
  ------------------
  <div class="command-output">
    <p><span class="help-command">help</span> <span class="help-description">- Display this help message</span></p>
    <p><span class="help-command">about</span> <span class="help-description">- Show information about me</span></p>
    <p><span class="help-command">projects</span> <span class="help-description">- List my projects</span></p>
    <p><span class="help-command">contact</span> <span class="help-description">- Show contact information</span></p>
    <p><span class="help-command">open &lt;app&gt;</span> <span class="help-description">- Open an app window</span></p>
    <p><span class="help-command">clear</span> <span class="help-description">- Clear the terminal</span></p>
  </div>
            `;
            return helpText;
          }
        },
        about: {
          description: 'Show information about me',
          execute: () => {
            return `
  <div class="command-output">
    <p>I build software by working through concrete problems in interface behavior, data handling, and system reliability.</p>
    <p>Current work includes Go command-line tools, an order-workflow backend concept, and a pointer-driven UI component.</p>
    <p>Type <span class="terminal-command">projects</span> to inspect verified repositories or <span class="terminal-command">contact</span> to get in touch.</p>
  </div>
            `;
          }
        },
        projects: {
          description: 'List project repositories',
          execute: () => {
            const projects = Array.isArray(window.OSBioProjects) ? window.OSBioProjects : [];
            const rows = projects.map((project) => '<li class="project-item"><a class="project-name" href="' +
              esc(project.url) + '" target="_blank" rel="noopener noreferrer">' + esc(project.name) +
              '</a><span class="project-desc"> — ' + esc(project.summary) + '</span><small class="project-status">' +
              esc(project.statusLabel) + '</small></li>').join('');
            return '<div class="command-output"><p>Project repositories:</p><ul>' + rows + '</ul></div>';
          }
        },
        contact: {
          description: 'Show contact information',
          execute: () => {
            return `
  <div class="command-output">
    <p>You can reach me at:</p>
    <ul>
      <li>Email: <a href="mailto:presentshimley@gmail.com" target="_blank">presentshimley@gmail.com</a></li>
      <li>GitHub: <a href="https://github.com/shimleabyte" target="_blank">github.com/shimleabyte</a></li>
    </ul>
  </div>
            `;
          }
        },
        open: {
          description: 'Open an app window',
          execute: (_out, arg) => {
            const apps = Object.keys(CONFIG.windowTemplates);
            if (!arg || !apps.includes(arg)) {
              return `<div class="command-output"><p>Usage: <span class="terminal-command">open &lt;app&gt;</span> (${apps.join(', ')})</p></div>`;
            }
            toggleWindow(arg);
            return '';
          }
        },
        clear: {
          description: 'Clear the terminal',
          execute: (output) => {
            output.innerHTML = '';
            return '';
          }
        }
      };
      
      // Handle command execution
      const executeCommand = (command) => {
        // Add command to history if not empty
        if (command.trim()) {
          commandHistory.push(command);
          historyIndex = commandHistory.length;
        }
        
        // Display the command
        const commandLine = document.createElement('div');
        commandLine.className = 'terminal-line';
        commandLine.innerHTML = `
          <span class="terminal-prompt">$</span>
          <span class="terminal-text">${esc(command)}</span>
        `;
        terminalOutput.appendChild(commandLine);
        
        // Process the command
        const cmd = command.trim().toLowerCase();
        const [name, arg] = cmd.split(/\s+/);
        let output = '';
        
        if (cmd === '') {
          // Do nothing for empty command
        } else if (Object.prototype.hasOwnProperty.call(commands, name)) {
          output = commands[name].execute(terminalOutput, arg);
        } else {
          output = `
  <div class="command-output">
    <p class="error-message">Command not found: ${esc(cmd)}</p>
    <p>Type <span class="terminal-command">help</span> to see available commands.</p>
  </div>
          `;
        }
        
        // Display the output if any
        if (output) {
          const outputElement = document.createElement('div');
          outputElement.innerHTML = output;
          terminalOutput.appendChild(outputElement);
        }
        
        // Scroll to bottom
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
        
        // Add a new prompt
        const newPrompt = document.createElement('div');
        newPrompt.className = 'terminal-line';
        newPrompt.innerHTML = `
          <span class="terminal-prompt">$</span>
          <span class="terminal-text"></span>
        `;
        terminalOutput.appendChild(newPrompt);
        
        // Focus the input
        terminalInput.value = '';
        terminalInput.focus();
      };
      
      // Handle input events
      terminalInput.addEventListener('keydown', (e) => {
        // Handle Enter key
        if (e.key === 'Enter') {
          e.preventDefault();
          const command = terminalInput.value.trim();
          executeCommand(command);
          return;
        }
        
        // Handle up/down arrow keys for command history
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (commandHistory.length > 0 && historyIndex > 0) {
            historyIndex--;
            terminalInput.value = commandHistory[historyIndex];
          }
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (historyIndex < commandHistory.length - 1) {
            historyIndex++;
            terminalInput.value = commandHistory[historyIndex] || '';
          } else {
            historyIndex = commandHistory.length;
            terminalInput.value = currentCommand;
          }
        } else if (e.key === 'Tab') {
          e.preventDefault();
          // Tab completion could be implemented here
        }
      });
      
      // Store current command when typing
      terminalInput.addEventListener('input', (e) => {
        currentCommand = terminalInput.value;
      });
      
      // The browser's native caret is used; the input remains keyboard-accessible.
      // Focus the input when clicking anywhere in the terminal
      windowElement.addEventListener('click', (e) => {
        if (e.target === windowElement || e.target === terminalOutput) {
          terminalInput.focus();
        }
      });
      
      // Initial focus
      terminalInput.focus();
    }
    
    // Memory Match app logic.
    if (appName === 'memory') {
      const gameBoard = windowElement.querySelector('#game-board');
      const moveCountElement = windowElement.querySelector('#move-count');
      const pairCountElement = windowElement.querySelector('#pair-count');
      const restartButton = windowElement.querySelector('#restart-btn');
      const gameMessage = windowElement.querySelector('#game-message');

      let flippedCards = [];
      let matchedPairs = 0;
      let turns = 0;
      let canFlip = true;
      let mismatchTimer = null;
      let roundId = 0;
      const symbols = ['//', '##', '[]', '<>', '::', '++', '..', '=='];

      function clearPendingTurn() {
        if (mismatchTimer !== null) {
          window.clearTimeout(mismatchTimer);
          mismatchTimer = null;
        }
      }

      function initGame() {
        roundId += 1;
        clearPendingTurn();
        flippedCards = [];
        matchedPairs = 0;
        turns = 0;
        canFlip = true;

        moveCountElement.textContent = '0';
        if (pairCountElement) pairCountElement.textContent = '0';
        gameMessage.textContent = 'Select two cards to reveal their symbols.';
        gameMessage.classList.remove('is-complete');
        emitOSBioEvent('game.restarted', { app: 'Memory Match' });

        const values = [];
        symbols.forEach((symbol) => values.push(symbol, symbol));
        shuffleArray(values);
        gameBoard.replaceChildren();

        values.forEach((symbol, index) => {
          const card = document.createElement('button');
          card.type = 'button';
          card.className = 'card';
          card.dataset.index = String(index);
          card.dataset.symbol = symbol;
          card.textContent = symbol;
          card.setAttribute('aria-label', `Card ${index + 1}, face down`);
          card.setAttribute('aria-pressed', 'false');
          card.addEventListener('click', handleCardClick);
          gameBoard.appendChild(card);
        });
      }

      function handleCardClick(event) {
        const selectedCard = event.currentTarget;
        if (!canFlip || selectedCard.classList.contains('flipped') || selectedCard.classList.contains('matched')) return;

        revealCard(selectedCard);
        flippedCards.push(selectedCard);
        if (flippedCards.length === 2) checkForMatch();
      }

      function revealCard(card) {
        card.classList.add('flipped');
        card.setAttribute('aria-pressed', 'true');
        card.setAttribute('aria-label', `Card ${Number(card.dataset.index) + 1}: ${card.dataset.symbol}`);
      }

      function concealCard(card) {
        card.classList.remove('flipped');
        card.setAttribute('aria-pressed', 'false');
        card.setAttribute('aria-label', `Card ${Number(card.dataset.index) + 1}, face down`);
      }

      function checkForMatch() {
        canFlip = false;
        turns += 1;
        moveCountElement.textContent = String(turns);
        emitOSBioEvent('game.turn', { app: 'Memory Match', turns, matchedPairs });
        const [firstCard, secondCard] = flippedCards;

        if (firstCard.dataset.symbol === secondCard.dataset.symbol) {
          firstCard.classList.add('matched');
          secondCard.classList.add('matched');
          firstCard.setAttribute('aria-label', `Card ${Number(firstCard.dataset.index) + 1}, matched ${firstCard.dataset.symbol}`);
          secondCard.setAttribute('aria-label', `Card ${Number(secondCard.dataset.index) + 1}, matched ${secondCard.dataset.symbol}`);
          matchedPairs += 1;
          if (pairCountElement) pairCountElement.textContent = String(matchedPairs);
          emitOSBioEvent('game.pair-matched', { app: 'Memory Match', matchedPairs, totalPairs: symbols.length });

          if (matchedPairs === symbols.length) {
            gameMessage.textContent = `All ${symbols.length} pairs matched in ${turns} turns.`;
            gameMessage.classList.add('is-complete');
            emitOSBioEvent('game.completed', { app: 'Memory Match', turns, pairs: matchedPairs });
          } else {
            gameMessage.textContent = `Pair found. ${matchedPairs} of ${symbols.length} pairs matched.`;
          }
          resetFlippedCards();
          return;
        }

        gameMessage.textContent = 'No match. Cards will turn back shortly.';
        emitOSBioEvent('game.mismatch', { app: 'Memory Match', turns, matchedPairs });
        const thisRound = roundId;
        mismatchTimer = window.setTimeout(() => {
          mismatchTimer = null;
          if (thisRound !== roundId || !windowElement.isConnected) return;
          concealCard(firstCard);
          concealCard(secondCard);
          resetFlippedCards();
          gameMessage.textContent = `${matchedPairs} of ${symbols.length} pairs matched.`;
        }, 800);
      }

      function resetFlippedCards() {
        flippedCards = [];
        canFlip = true;
      }

      function shuffleArray(values) {
        for (let i = values.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [values[i], values[j]] = [values[j], values[i]];
        }
        return values;
      }

      restartButton.addEventListener('click', initGame);
      windowElement.addEventListener('osbio:dispose', () => {
        roundId += 1;
        clearPendingTurn();
      }, { once: true });
      initGame();
    }
  }

  function getWindowBounds(target) {
    return {
      left: target.element.offsetLeft + 'px',
      top: target.element.offsetTop + 'px',
      width: target.element.offsetWidth + 'px',
      height: target.element.offsetHeight + 'px'
    };
  }

  function snapWindow(windowId, side) {
    const target = openWindows.find((item) => item.id === windowId);
    if (!target || (side !== 'left' && side !== 'right') || desktopElement.clientWidth < 701) return;
    if (!target.maximized && !target.snapped) target.restoreBounds = getWindowBounds(target);
    target.maximized = false;
    target.snapped = side;
    target.element.classList.remove('maximized', 'snapped-left', 'snapped-right');
    target.element.classList.add(side === 'left' ? 'snapped-left' : 'snapped-right');
    focusWindow(windowId);
    emitOSBioEvent('window.snapped', { app: target.appName, windowId, side });
    updateTaskbarState();
  }

  // Bring a window to the front and align browser focus with shell focus.
  function focusWindow(windowId) {
    const target = openWindows.find((w) => w.id === windowId);
    if (!target) return;
    const wasActive = activeWindowId === windowId && !target.minimized;
    target.minimized = false;
    target.element.classList.remove('minimized');

    if (!wasActive) {
      const top = Math.max(CONFIG.zIndex, ...openWindows.map((w) => w.zIndex)) + 1;
      target.zIndex = top;
      target.element.style.zIndex = String(top);
      activeWindowId = windowId;
      openWindows.forEach((w) => w.element.classList.toggle('active', w.id === windowId));
      emitOSBioEvent('window.focused', { app: target.appName, windowId });
    } else {
      openWindows.forEach((w) => w.element.classList.toggle('active', w.id === windowId));
    }

    if (!target.element.contains(document.activeElement)) {
      target.element.focus({ preventScroll: true });
    }
    updateTaskbarState();
  }

  function focusTaskbarButton(appName) {
    const button = document.querySelector('.taskbar-btn[data-app="' + appName + '"]');
    if (button) button.focus({ preventScroll: true });
    else document.getElementById('desktop-surface')?.focus({ preventScroll: true });
  }

  function minimizeWindow(windowId) {
    const target = openWindows.find((w) => w.id === windowId);
    if (!target) return;
    target.minimized = true;
    target.element.classList.remove('active');
    target.element.classList.add('minimized');
    const nextWindow = [...openWindows]
      .filter((w) => w.id !== windowId && !w.minimized)
      .sort((a, b) => b.zIndex - a.zIndex)[0];
    activeWindowId = nextWindow ? nextWindow.id : null;
    openWindows.forEach((w) => w.element.classList.toggle('active', w.id === activeWindowId));
    if (nextWindow) focusWindow(nextWindow.id);
    else focusTaskbarButton(target.appName);
    emitOSBioEvent('window.minimized', { app: target.appName, windowId });
    updateTaskbarState();
  }

  function maximizeWindow(windowId) {
    const target = openWindows.find((w) => w.id === windowId);
    if (!target) return;
    focusWindow(windowId);
    if (!target.maximized) {
      if (!target.snapped) target.restoreBounds = getWindowBounds(target);
      target.maximized = true;
      target.snapped = null;
      target.element.classList.remove('snapped-left', 'snapped-right');
      target.element.classList.add('maximized');
      emitOSBioEvent('window.maximized', { app: target.appName, windowId });
    } else {
      target.maximized = false;
      target.element.classList.remove('maximized');
      if (target.restoreBounds) {
        target.element.style.left = target.restoreBounds.left;
        target.element.style.top = target.restoreBounds.top;
        target.element.style.width = target.restoreBounds.width;
        target.element.style.height = target.restoreBounds.height;
      }
      target.restoreBounds = null;
      emitOSBioEvent('window.restored', { app: target.appName, windowId });
      constrainWindows();
    }
    updateTaskbarState();
  }

  // Close a window
  function closeWindow(windowId) {
    const windowIndex = openWindows.findIndex(w => w.id === windowId);
    if (windowIndex === -1) return;

    const closingWindow = openWindows[windowIndex];
    const closeRequest = new CustomEvent('osbio:before-close', { cancelable: true, detail: { app: closingWindow.appName, windowId } });
    closingWindow.element.dispatchEvent(closeRequest);
    if (closeRequest.defaultPrevented) return false;

    // Remove from DOM
    const [closedWindow] = openWindows.splice(windowIndex, 1);
    if (closedWindow.element && closedWindow.element.parentNode) {
      closedWindow.element.dispatchEvent(new Event('osbio:dispose'));
      closedWindow.element.remove();
    }

    emitOSBioEvent('window.closed', { app: closedWindow.appName, windowId });

    // If the active window was closed, focus the highest visible window.
    if (activeWindowId === windowId) {
      const nextWindow = [...openWindows]
        .filter((w) => !w.minimized)
        .sort((a, b) => b.zIndex - a.zIndex)[0];
      activeWindowId = nextWindow ? nextWindow.id : null;
      if (nextWindow) focusWindow(nextWindow.id);
      else focusTaskbarButton(closedWindow.appName);
    }

    // Update taskbar state
    updateTaskbarState();
  }

  // Update taskbar button states
  function updateTaskbarState() {
    const taskbarButtons = document.querySelectorAll('.taskbar-btn');
    taskbarButtons.forEach((button) => {
      const appName = button.dataset.app;
      const isWindowOpen = openWindows.some((w) => w.appName === appName);
      const isActive = openWindows.some((w) => w.id === activeWindowId && w.appName === appName);
      button.classList.toggle('active', isActive);
      button.classList.toggle('open', isWindowOpen);
      button.setAttribute('aria-pressed', String(isActive));
    });
    const activeLabel = document.getElementById('active-app-label');
    const activeWindow = openWindows.find((w) => w.id === activeWindowId);
    if (activeLabel) {
      activeLabel.textContent = activeWindow ? 'RUNNING / ' + CONFIG.windowTemplates[activeWindow.appName].title.toUpperCase() : 'WORKSPACE / DESKTOP';
    }
    if (windowOverview && !windowOverview.hidden) renderWindowOverview();
  }

  // Public API
  return {
    init,
    openWindow: (appName) => {
      if (!openWindows.some(w => w.appName === appName)) {
        createWindow(appName);
      } else {
        const window = openWindows.find(w => w.appName === appName);
        if (window) focusWindow(window.id);
      }
    },
    closeWindow,
    getSnapshot: () => ({
      activeWindowId,
      windows: openWindows.map((item) => ({
        id: item.id,
        appName: item.appName,
        title: CONFIG.windowTemplates[item.appName].title,
        active: item.id === activeWindowId,
        minimized: item.minimized,
        maximized: item.maximized,
        snapped: item.snapped || null,
        zIndex: item.zIndex
      }))
    }),
    closeAllWindows: () => {
      // Create a copy of the array to avoid modification during iteration
      const windowsToClose = [...openWindows];
      windowsToClose.forEach(win => closeWindow(win.id));
    }
  };
})();

// Expose the manager explicitly for cross-module APIs and diagnostics.
// Top-level const declarations are not properties on window.
window.WindowManager = WindowManager;

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => WindowManager.init());
} else {
  WindowManager.init();
}
