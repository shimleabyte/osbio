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
        title: 'Projects',
        width: '750px',
        height: '600px',
        content: `
          <div class="projects-app">
            <div class="projects-grid">
              <!-- Project 1 -->
              <div class="project-card" data-project="project1">
                <div class="project-header">
                  <h3 class="project-title">Portfolio OS</h3>
                  <div class="project-stack">HTML, CSS, JavaScript</div>
                </div>
                <p class="project-desc">An OS-style interactive portfolio website with a focus on clean design and smooth interactions.</p>
                <div class="project-details" id="project1">
                  <div class="project-learned">
                    <strong>What I learned:</strong> Building a window management system from scratch with vanilla JavaScript.
                  </div>
                  <div class="project-links">
                    <a href="#" class="btn btn-outline btn-sm" target="_blank" rel="noopener">
                      <span class="icon">🌐</span> Live Demo
                    </a>
                    <a href="#" class="btn btn-outline btn-sm" target="_blank" rel="noopener">
                      <span class="icon">💻</span> Source Code
                    </a>
                  </div>
                </div>
              </div>

              <!-- Project 2 -->
              <div class="project-card" data-project="project2">
                <div class="project-header">
                  <h3 class="project-title">TaskFlow</h3>
                  <div class="project-stack">React, TypeScript, Tailwind</div>
                </div>
                <p class="project-desc">A minimal task management application with drag-and-drop functionality.</p>
                <div class="project-details" id="project2">
                  <div class="project-learned">
                    <strong>What I learned:</strong> Implementing drag-and-drop interfaces with React DnD and TypeScript type safety.
                  </div>
                  <div class="project-links">
                    <a href="#" class="btn btn-outline btn-sm" target="_blank" rel="noopener">
                      <span class="icon">🌐</span> Live Demo
                    </a>
                    <a href="#" class="btn btn-outline btn-sm" target="_blank" rel="noopener">
                      <span class="icon">💻</span> Source Code
                    </a>
                  </div>
                </div>
              </div>

              <!-- Project 3 -->
              <div class="project-card" data-project="project3">
                <div class="project-header">
                  <h3 class="project-title">WeatherViz</h3>
                  <div class="project-stack">Vue.js, D3.js, OpenWeather API</div>
                </div>
                <p class="project-desc">Weather visualization dashboard showing forecast data with interactive charts.</p>
                <div class="project-details" id="project3">
                  <div class="project-learned">
                    <strong>What I learned:</strong> Data visualization with D3.js and working with external weather APIs.
                  </div>
                  <div class="project-links">
                    <a href="#" class="btn btn-outline btn-sm" target="_blank" rel="noopener">
                      <span class="icon">🌐</span> Live Demo
                    </a>
                    <a href="#" class="btn btn-outline btn-sm" target="_blank" rel="noopener">
                      <span class="icon">💻</span> Source Code
                    </a>
                  </div>
                </div>
              </div>
            </div>
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
              <a href="https://linkedin.com/in/example" class="contact-item" target="_blank" rel="noopener noreferrer">
                <span class="contact-icon">🔗</span>
                <span class="contact-label">LinkedIn</span>
              </a>
              <a href="https://x.com/example" class="contact-item" target="_blank" rel="noopener noreferrer">
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
              <a href="/resume.pdf" class="btn btn-primary" download>
                <span class="icon">⬇️</span> Download PDF
              </a>
              <button class="btn btn-outline view-toggle">
                <span class="icon">👁️</span> Toggle Preview
              </button>
            </div>
            <div class="resume-preview">
              <iframe src="/resume.pdf#view=FitH" class="resume-iframe"></iframe>
            </div>
            <div class="resume-fallback">
              <p>Unable to load PDF preview. <a href="/resume.pdf" download>Download resume</a> instead.</p>
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
          // Open links in a new tab
          const url = link.getAttribute('href');
          if (url && url !== '#') {
            window.open(url, '_blank', 'noopener,noreferrer');
          }
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
            viewToggle.innerHTML = '<span class="icon">👁️</span> Fit Width';
          } else {
            iframe.src = iframe.src.replace('FitV', 'FitH');
            viewToggle.innerHTML = '<span class="icon">👁️</span> Fit Height';
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
          description: 'List my projects',
          execute: () => {
            return `
  <div class="command-output">
    <p>Here are some of my recent projects:</p>
    <ul>
      <li class="project-item">
        <span class="project-name">Portfolio OS</span>
        <span class="project-desc">- An interactive OS-style portfolio website</span>
      </li>
      <li class="project-item">
        <span class="project-name">TaskFlow</span>
        <span class="project-desc">- A task management application</span>
      </li>
      <li class="project-item">
        <span class="project-name">WeatherViz</span>
        <span class="project-desc">- Weather visualization dashboard</span>
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
      <li>LinkedIn: <a href="https://linkedin.com/in/example" target="_blank">linkedin.com/in/example</a></li>
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
        commandLine.innerHTML = `
          <span class="terminal-prompt">$</span>
          <span class="terminal-text">${command}</span>
        `;
        terminalOutput.appendChild(commandLine);
        
        // Process the command
        const cmd = command.trim().toLowerCase();
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
