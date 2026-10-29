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
              <p class="about-role">Frontend Developer & UI/UX Enthusiast</p>
            </header>
            
            <section class="about-section">
              <h2 class="section-title">Bio</h2>
              <p>I build intuitive, accessible web experiences that balance form and function. With a focus on clean code and thoughtful design, I create digital products that solve real problems.</p>
            </section>
            
            <section class="about-section">
              <h2 class="section-title">Tech Stack</h2>
              <div class="tech-stack">
                <div class="tech-category">
                  <h3>Frontend</h3>
                  <ul>
                    <li>JavaScript (ES6+)</li>
                    <li>TypeScript</li>
                    <li>React.js/ts</li>
                    <li>Vue.js</li>
                    <li>CSS3 / SASS / Tailwind</li>
                  </ul>
                </div>
                <div class="tech-category">
                  <h3>Tools</h3>
                  <ul>
                    <li>Git & GitHub</li>
                    <li>VS Code / Windsurf / Notepad++</li>
                    <li>Figma</li>
                  </ul>
                </div>
              </div>
            </section>
            
            <section class="about-section">
              <h2 class="section-title">Focus & Interests</h2>
              <ul class="interests-list">
                <li>Design systems and component libraries</li>
                <li>Performance optimization</li>
                <li>Accessible web experiences</li>
                <li>Developer experience</li>
              </ul>
            </section>
          </div>
        `
      },
      projects: {
        title: 'Projects',
        width: '750px',
        height: '600px',
        content: `
          <div class="projects-app">
            <div class="projects-grid">
              <!-- Verified project: Mutabaah CLI -->
              <div class="project-card" data-project="mutabaah-cli">
                <div class="project-header">
                  <h3 class="project-title">Mutabaah CLI</h3>
                  <div class="project-stack">Go, JSON</div>
                </div>
                <p class="project-desc">A local-first command-line app for tracking activities and keeping short notes, with data stored in local JSON files.</p>
                <div class="project-details" id="project-mutabaah-cli">
                  <div class="project-learned">
                    <strong>Project focus:</strong> Go fundamentals, CLI command design, and local data persistence.
                  </div>
                  <div class="project-links">
                    <a href="https://github.com/shimleabyte/mutabaah-cli" class="btn btn-outline btn-sm" target="_blank" rel="noopener noreferrer">
                      <span class="icon">${ICON.github}</span> Source Code
                    </a>
                  </div>
                </div>
              </div>

              <!-- Verified project: Simpul -->
              <div class="project-card" data-project="simpul">
                <div class="project-header">
                  <h3 class="project-title">Simpul</h3>
                  <div class="project-stack">Go</div>
                </div>
                <p class="project-desc">A reliability-first order and payment workflow backend concept for Indonesian small-batch and pre-order sellers.</p>
                <div class="project-details" id="project-simpul">
                  <div class="project-learned">
                    <strong>Project focus:</strong> Explicit order transitions, idempotent payment events, stock reservation invariants, and testable domain rules. Database integration remains a planned milestone.
                  </div>
                  <div class="project-links">
                    <a href="https://github.com/shimleabyte/simpul" class="btn btn-outline btn-sm" target="_blank" rel="noopener noreferrer">
                      <span class="icon">${ICON.github}</span> Source Code
                    </a>
                  </div>
                </div>
              </div>

              <!-- Verified project: Optical Anchor Button -->
              <div class="project-card" data-project="optical-anchor-button">
                <div class="project-header">
                  <h3 class="project-title">Optical Anchor Button</h3>
                  <div class="project-stack">React, HTML, CSS</div>
                </div>
                <p class="project-desc">A focused button component experiment with a custom eye, pointer tracking, and an awake-to-sleep interaction lifecycle.</p>
                <div class="project-details" id="project-optical-anchor-button">
                  <div class="project-learned">
                    <strong>Project focus:</strong> Component states, pointer-driven motion, accessible interaction states, and reduced-motion support.
                  </div>
                  <div class="project-links">
                    <a href="https://github.com/shimleabyte/optical-anchor-button" class="btn btn-outline btn-sm" target="_blank" rel="noopener noreferrer">
                      <span class="icon">${ICON.github}</span> Source Code
                    </a>
                  </div>
                </div>
              </div>        `
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
                <span class="moves">Moves: <span id="move-count">0</span></span>
                <button id="restart-btn" class="btn btn-sm">Restart</button>
              </div>
            </div>
            <div class="game-board" id="game-board">
              <!-- Cards will be generated here -->
            </div>
            <div class="game-message" id="game-message">
              <p>Find all matching pairs of cards</p>
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
                <span class="terminal-text">Welcome to the portfolio terminal</span>
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
              <span class="terminal-cursor">█</span>
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

  // DOM Elements
  let desktopElement;

  // Initialize the window manager
  function init() {
    desktopElement = document.getElementById('desktop-screen');
    if (!desktopElement) {
      console.error('Desktop element not found');
      return;
    }

    // Initialize taskbar buttons
    initTaskbarButtons();

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && activeWindowId) closeWindow(activeWindowId);
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

  // Toggle window open/close
  function toggleWindow(appName) {
    const existingWindow = openWindows.find(w => w.appName === appName);
    
    if (existingWindow) {
      if (existingWindow.id === activeWindowId) {
        // Window is already active, do nothing
        return;
      } else {
        // Window exists but not active, bring to front
        focusWindow(existingWindow.id);
      }
    } else {
      // Window doesn't exist, create it
      createWindow(appName);
    }
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
    const zIndex = CONFIG.zIndex + openWindows.length;
    
    // Calculate position to cascade windows
    const offset = openWindows.length * CONFIG.windowOffset;
    const top = 50 + offset;
    const left = 50 + offset;

    // Create window element
    const windowElement = document.createElement('div');
    windowElement.className = 'window';
    windowElement.id = windowId;
    windowElement.setAttribute('role', 'dialog');
    windowElement.setAttribute('aria-labelledby', `${windowId}-title`);
    windowElement.style.zIndex = zIndex;
    windowElement.style.width = template.width;
    windowElement.style.height = template.height;
    windowElement.style.top = `${top}px`;
    windowElement.style.left = `${left}px`;

    // Window header
    const header = document.createElement('div');
    header.className = 'window-header';
    header.innerHTML = `
      <span class="window-title" id="${windowId}-title">${template.title}</span>
      <button class="window-close" aria-label="Close">×</button>
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
      zIndex
    };
    
    openWindows.push(windowData);
    focusWindow(windowId);

    return windowId;
  }

  // Set up window event listeners
  function setupWindowEvents(windowElement, windowId, appName) {
    const header = windowElement.querySelector('.window-header');
    const closeBtn = windowElement.querySelector('.window-close');
    let isDragging = false;
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

    // Dragging functionality
    header.addEventListener('pointerdown', (e) => {
      if (e.target === header || e.target.closest('.window-title')) {
        isDragging = true;
        offsetX = e.clientX - windowElement.offsetLeft;
        offsetY = e.clientY - windowElement.offsetTop;
        document.addEventListener('pointermove', handleDrag);
        document.addEventListener('pointerup', stopDrag);
        focusWindow(windowId);
      }
    });

    function handleDrag(e) {
      if (isDragging) {
        const x = e.clientX - offsetX;
        const y = e.clientY - offsetY;
        
        // Keep window within viewport
        const maxX = window.innerWidth - windowElement.offsetWidth;
        const maxY = window.innerHeight - windowElement.offsetHeight;
        
        windowElement.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
        windowElement.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
      }
    }

    function stopDrag() {
      isDragging = false;
      document.removeEventListener('pointermove', handleDrag);
      document.removeEventListener('pointerup', stopDrag);
    }

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
      const terminalCursor = windowElement.querySelector('.terminal-cursor');
      
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
          description: 'List my projects',
          execute: () => {
            return `
  <div class="command-output">
    <p>Verified repositories:</p>
            <ul>
              <li class="project-item">
                <a class="project-name" href="https://github.com/shimleabyte/mutabaah-cli" target="_blank" rel="noopener noreferrer">Mutabaah CLI</a>
                <span class="project-desc">- Go CLI for activity tracking and short notes</span>
              </li>
              <li class="project-item">
                <a class="project-name" href="https://github.com/shimleabyte/simpul" target="_blank" rel="noopener noreferrer">Simpul</a>
                <span class="project-desc">- Go order and payment workflow backend starter</span>
              </li>
              <li class="project-item">
                <a class="project-name" href="https://github.com/shimleabyte/optical-anchor-button" target="_blank" rel="noopener noreferrer">Optical Anchor Button</a>
                <span class="project-desc">- Pointer-driven interactive button component experiment</span>
              </li>
            </ul>
  </div>
            `;
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
      
      // Handle cursor position for the fake cursor
      terminalInput.addEventListener('click', (e) => {
        updateCursorPosition();
      });
      
      terminalInput.addEventListener('keyup', (e) => {
        updateCursorPosition();
      });
      
      // Update cursor position based on input width
      const updateCursorPosition = () => {
        const input = terminalInput;
        const text = input.value.substring(0, input.selectionStart);
        const tempSpan = document.createElement('span');
        tempSpan.textContent = text;
        tempSpan.style.visibility = 'hidden';
        tempSpan.style.position = 'absolute';
        tempSpan.style.font = getComputedStyle(input).font;
        tempSpan.style.whiteSpace = 'pre';
        document.body.appendChild(tempSpan);
        const width = tempSpan.offsetWidth;
        document.body.removeChild(tempSpan);
        
        // Position the cursor
        const promptWidth = 10; // Width of the "$" prompt
        terminalCursor.style.transform = `translateX(${promptWidth + width}px)`;
      };
      
      // Initial cursor position
      updateCursorPosition();
      
      // Focus the input when clicking anywhere in the terminal
      windowElement.addEventListener('click', (e) => {
        if (e.target === windowElement || e.target === terminalOutput) {
          terminalInput.focus();
        }
      });
      
      // Initial focus
      terminalInput.focus();
    }
    
    // Memory Match game logic
    if (appName === 'memory') {
      const gameBoard = windowElement.querySelector('#game-board');
      const moveCountElement = windowElement.querySelector('#move-count');
      const restartButton = windowElement.querySelector('#restart-btn');
      const gameMessage = windowElement.querySelector('#game-message');
      
      // Game state
      let cards = [];
      let flippedCards = [];
      let matchedPairs = 0;
      let moves = 0;
      let canFlip = true;
      
      // Emoji pairs for the game (8 pairs = 16 cards)
      const emojis = ['🌟', '🎨', '🛠️', '🚀', '📱', '💡', '🎯', '✨'];
      
      // Initialize the game
      function initGame() {
        // Reset game state
        cards = [];
        flippedCards = [];
        matchedPairs = 0;
        moves = 0;
        canFlip = true;
        
        // Update UI
        moveCountElement.textContent = moves;
        gameMessage.innerHTML = '<p>Find all matching pairs of cards</p>';
        
        // Create card pairs
        const gameCards = [];
        emojis.forEach(emoji => {
          gameCards.push(emoji, emoji);
        });
        
        // Shuffle cards
        const shuffledCards = shuffleArray([...gameCards]);
        
        // Clear and create board
        gameBoard.innerHTML = '';
        
        // Create card elements
        shuffledCards.forEach((emoji, index) => {
          const card = document.createElement('div');
          card.className = 'card';
          card.dataset.index = index;
          card.dataset.emoji = emoji;
          card.textContent = emoji;
          card.addEventListener('click', handleCardClick);
          gameBoard.appendChild(card);
          cards.push(card);
        });
      }
      
      // Handle card click
      function handleCardClick(e) {
        const selectedCard = e.currentTarget;
        
        // Don't do anything if the card is already flipped, matched, or if we're waiting
        if (!canFlip || selectedCard.classList.contains('flipped') || selectedCard.classList.contains('matched')) {
          return;
        }
        
        // Flip the card
        flipCard(selectedCard);
        
        // Add to flipped cards
        flippedCards.push(selectedCard);
        
        // Check for match if two cards are flipped
        if (flippedCards.length === 2) {
          checkForMatch();
        }
      }
      
      // Flip a card
      function flipCard(card) {
        card.classList.add('flipped');
      }
      
      // Check if flipped cards match
      function checkForMatch() {
        canFlip = false;
        moves++;
        moveCountElement.textContent = moves;
        
        const [firstCard, secondCard] = flippedCards;
        
        if (firstCard.dataset.emoji === secondCard.dataset.emoji) {
          // Match found
          firstCard.classList.add('matched');
          secondCard.classList.add('matched');
          matchedPairs++;
          
          // Check for win
          if (matchedPairs === emojis.length) {
            setTimeout(() => {
              gameMessage.innerHTML = `<p class="completion-message">You won in ${moves} moves! 🎉</p>`;
            }, 500);
          } else {
            gameMessage.innerHTML = '<p>Match found! Keep going!</p>';
          }
          
          resetFlippedCards();
        } else {
          // No match
          gameMessage.innerHTML = '<p>No match. Try again!</p>';
          
          // Flip cards back after a delay
          setTimeout(() => {
            firstCard.classList.remove('flipped');
            secondCard.classList.remove('flipped');
            resetFlippedCards();
          }, 1000);
        }
      }
      
      // Reset flipped cards array and allow new moves
      function resetFlippedCards() {
        flippedCards = [];
        canFlip = true;
      }
      
      // Fisher-Yates shuffle algorithm
      function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      }
      
      // Event listeners
      restartButton.addEventListener('click', initGame);
      
      // Initialize the game
      initGame();
    }
  }

  // Bring a window to the front and mark it active
  function focusWindow(windowId) {
    const target = openWindows.find(w => w.id === windowId);
    if (!target) return;
    const top = Math.max(CONFIG.zIndex, ...openWindows.map(w => w.zIndex)) + 1;
    target.zIndex = top;
    target.element.style.zIndex = top;
    openWindows.forEach(w => w.element.classList.toggle('active', w.id === windowId));
    activeWindowId = windowId;
    updateTaskbarState();
  }

  // Close a window
  function closeWindow(windowId) {
    const windowIndex = openWindows.findIndex(w => w.id === windowId);
    if (windowIndex === -1) return;

    // Remove from DOM
    const [closedWindow] = openWindows.splice(windowIndex, 1);
    if (closedWindow.element && closedWindow.element.parentNode) {
      closedWindow.element.remove();
    }

    // Update active window if needed
    if (activeWindowId === windowId) {
      activeWindowId = openWindows.length > 0 ? openWindows[openWindows.length - 1].id : null;
      if (activeWindowId) {
        focusWindow(activeWindowId);
      }
    }

    // Update taskbar state
    updateTaskbarState();
  }

  // Update taskbar button states
  function updateTaskbarState() {
    const taskbarButtons = document.querySelectorAll('.taskbar-btn');
    
    taskbarButtons.forEach(button => {
      const appName = button.dataset.app;
      const isWindowOpen = openWindows.some(w => w.appName === appName);
      const isActive = openWindows.some(w => w.id === activeWindowId && w.appName === appName);
      
      button.classList.toggle('active', isActive);
      button.classList.toggle('open', isWindowOpen);
    });
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
    closeAllWindows: () => {
      // Create a copy of the array to avoid modification during iteration
      const windowsToClose = [...openWindows];
      windowsToClose.forEach(win => closeWindow(win.id));
    }
  };
})();

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => WindowManager.init());
} else {
  WindowManager.init();
}
