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
        title: 'Selected Projects',
        width: '760px',
        height: '620px',
        content: `
          <div class="projects-app">
            <header class="projects-heading">
              <p class="eyebrow">SELECTED WORK / 02 REPOSITORIES</p>
              <h2 class="case-title">Projects with a point of view.</h2>
              <p class="case-summary">A focused selection of real work, with the engineering problem and source close at hand.</p>
            </header>
            <div class="projects-grid">
              <article class="project-card" tabindex="0" role="button" aria-expanded="false" data-project="mutabaah-cli">
                <div class="project-header"><div><p class="project-kicker">GO / COMMAND-LINE</p><h3 class="project-title">Mutabaah CLI</h3></div><span class="project-stack">Go · JSON</span></div>
                <p class="project-desc">A CLI for managing mutabaah activities. The project explores command handling, domain operations, and local JSON persistence.</p>
                <div class="project-details" id="mutabaah-cli"><p><strong>Engineering focus</strong></p><p>Input parsing and validation, separating domain logic from CLI interaction, and reading/writing structured data locally.</p><div class="project-links"><a class="btn btn-outline btn-sm" href="https://github.com/shimleabyte/mutabaah-cli" target="_blank" rel="noopener noreferrer">Source code ↗</a></div></div>
              </article>
              <article class="project-card" tabindex="0" role="button" aria-expanded="false" data-project="osbio">
                <div class="project-header"><div><p class="project-kicker">VANILLA WEB / INTERACTION</p><h3 class="project-title">OSBio</h3></div><span class="project-stack">HTML · CSS · JavaScript</span></div>
                <p class="project-desc">An interactive developer workspace exploring window lifecycle, navigation state, and the pixel-flow visual identity.</p>
                <div class="project-details" id="osbio"><p><strong>Engineering focus</strong></p><p>Window lifecycle and focus, taskbar synchronization, keyboard access, and adaptive layouts.</p><div class="project-links"><a class="btn btn-outline btn-sm" href="https://github.com/shimleabyte/osbio" target="_blank" rel="noopener noreferrer">Source code ↗</a></div></div>
              </article>
            </div>
            <p class="projects-footnote">Only real projects are featured here. New entries should include working source and explainable engineering decisions.</p>
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
                <span class="contact-icon">✉️</span>
                <span class="contact-label">Email</span>
              </a>
              <a href="https://github.com/shimleabyte" class="contact-item" target="_blank" rel="noopener noreferrer">
                <span class="contact-icon">💻</span>
                <span class="contact-label">GitHub</span>
              </a>
              <a href="https://github.com/shimleabyte" class="contact-item" target="_blank" rel="noopener noreferrer">
                <span class="contact-icon">🔗</span>
                <span class="contact-label">LinkedIn</span>
              </a>
              <a href="https://github.com/shimleabyte" class="contact-item" target="_blank" rel="noopener noreferrer">
                <span class="contact-icon">🐦</span>
                <span class="contact-label">Twitter(X)</span>
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
            <div class="resume-actions">
              <a href="https://github.com/shimleabyte" class="btn btn-primary" target="_blank" rel="noopener noreferrer">
                <span class="icon">⬇️</span> View GitHub profile
              </a>
              <button class="btn btn-outline view-toggle">
                <span class="icon">👁️</span> Toggle Preview
              </button>
            </div>
            <div class="resume-preview">
              <iframe src="about:blank" class="resume-iframe" title="Resume preview unavailable"></iframe>
            </div>
            <div class="resume-fallback">
              <p>A resume PDF has not been published in this repository yet. <a href="https://github.com/shimleabyte" target="_blank" rel="noopener noreferrer">Visit GitHub profile</a>.</p>
            </div>
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

  // Keep active window, stacking order, and taskbar state synchronized.
  function focusWindow(windowId) {
    const record = openWindows.find((item) => item.id === windowId);
    if (!record || record.minimized) return;
    activeWindowId = windowId;
    openWindows.forEach((item) => {
      const active = item.id === windowId;
      item.element.classList.toggle('active', active);
      if (active) item.element.style.zIndex = String(CONFIG.zIndex + windowCounter + 1);
    });
    if (record.element && typeof record.element.focus === 'function') record.element.focus({ preventScroll: true });
    updateTaskbarState();
  }

  // Initialize the window manager
  function init() {
    desktopElement = document.getElementById('desktop-screen');
    if (!desktopElement) {
      console.error('Desktop element not found');
      return;
    }

    // Initialize taskbar buttons
    initTaskbarButtons();
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
    windowElement.style.zIndex = zIndex;
    windowElement.style.width = template.width;
    windowElement.style.height = template.height;
    windowElement.style.top = `${top}px`;
    windowElement.style.left = `${left}px`;

    // Window header
    const header = document.createElement('div');
    header.className = 'window-header';
    header.innerHTML = `
      <span class="window-title">${template.title}</span>
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
    windowElement.addEventListener('mousedown', (e) => {
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
    header.addEventListener('mousedown', (e) => {
      if (e.target === header || e.target.closest('.window-title')) {
        isDragging = true;
        offsetX = e.clientX - windowElement.offsetLeft;
        offsetY = e.clientY - windowElement.offsetTop;
        document.addEventListener('mousemove', handleDrag);
        document.addEventListener('mouseup', stopDrag);
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
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', stopDrag);
    }

    // Project cards behave as accessible disclosure controls.
    if (appName === 'projects') {
      const projectCards = windowElement.querySelectorAll('.project-card');
      projectCards.forEach((card) => {
        const toggleCard = () => {
          const shouldOpen = !card.classList.contains('active');
          projectCards.forEach((item) => { item.classList.remove('active'); item.setAttribute('aria-expanded', 'false'); });
          if (shouldOpen) {
            card.classList.add('active');
            card.setAttribute('aria-expanded', 'true');
            card.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
          }
        };
        card.addEventListener('click', (event) => { if (!event.target.closest('a, button')) toggleCard(); });
        card.addEventListener('keydown', (event) => {
          if (event.target !== card || (event.key !== 'Enter' && event.key !== ' ')) return;
          event.preventDefault();
          toggleCard();
        });
      });
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
    <p><span class="help-command">projects</span> <span class="help-description">- List featured repositories</span></p>
    <p><span class="help-command">open projects|about|contact|terminal</span> <span class="help-description">- Open a workspace app</span></p>
    <p><span class="help-command">contact</span> <span class="help-description">- Show contact information</span></p>
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
    <p>Hello! I'm a passionate developer with expertise in building web applications.</p>
    <p>I love creating clean, efficient, and user-friendly experiences.</p>
    <p>Type <span class="terminal-command">projects</span> to see some of my work or <span class="terminal-command">contact</span> to get in touch!</p>
  </div>
            `;
          }
        },
        projects: {
          description: 'List featured repositories',
          execute: () => `
            <div class="command-output">
              <p>Featured repositories:</p>
              <ul>
                <li><a href="https://github.com/shimleabyte/mutabaah-cli" target="_blank" rel="noopener noreferrer">mutabaah-cli</a> — Go CLI and local JSON persistence</li>
                <li><a href="https://github.com/shimleabyte/osbio" target="_blank" rel="noopener noreferrer">osbio</a> — interactive HTML/CSS/JavaScript workspace</li>
              </ul>
              <p>Try <span class="terminal-command">open projects</span> to open the project explorer.</p>
            </div>`
        },
        open: {
          description: 'Open an app: open projects|about|contact|terminal',
          execute: (_output, args) => {
            const appName = args[0];
            if (!['projects', 'about', 'contact', 'terminal'].includes(appName)) {
              return '<div class="command-output"><p>Usage: open projects|about|contact|terminal</p></div>';
            }
            window.setTimeout(() => window.WindowManager && window.WindowManager.openWindow(appName), 0);
            return '<div class="command-output"><p>Opening ' + appName + '…</p></div>';
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
        const commandPrompt = document.createElement('span');
        commandPrompt.className = 'terminal-prompt';
        commandPrompt.textContent = '
        terminalOutput.appendChild(commandLine);
        
        // Process the command
        const parts = command.trim().split(/\s+/).filter(Boolean);
        const cmd = (parts.shift() || '').toLowerCase();
        let output = '';
        
        if (cmd === '') {
          // Do nothing for empty command
        } else if (commands[cmd]) {
          output = commands[cmd].execute(terminalOutput, parts);
        } else {
          output = `
  <div class="command-output">
    <p class="error-message">Command not found: ${cmd.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]))}</p>
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
        tempSpan.style.fontFamily = 'Courier New, monospace';
        tempSpan.style.fontSize = '14px';
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
      button.setAttribute('aria-pressed', String(isActive));
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
;
        const commandText = document.createElement('span');
        commandText.className = 'terminal-text';
        commandText.textContent = command;
        commandLine.append(commandPrompt, commandText);
        terminalOutput.appendChild(commandLine);
        
        // Process the command
        const parts = command.trim().split(/\s+/).filter(Boolean);
        const cmd = (parts.shift() || '').toLowerCase();
        let output = '';
        
        if (cmd === '') {
          // Do nothing for empty command
        } else if (commands[cmd]) {
          output = commands[cmd].execute(terminalOutput);
        } else {
          output = `
  <div class="command-output">
    <p class="error-message">Command not found: ${cmd}</p>
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
        tempSpan.style.fontFamily = 'Courier New, monospace';
        tempSpan.style.fontSize = '14px';
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
