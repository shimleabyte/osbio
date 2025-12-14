/**
 * OS-Style Portfolio — Screen Transitions
 * 
 * State machine: BOOT → SIGNIN → DESKTOP
 * Boot: ~2 seconds (skippable via click/keypress)
 * Sign-in: Click button or press Enter → Desktop
 */

(function () {
  'use strict';

  // Configuration
  const BOOT_DURATION = 2000;      // 2 seconds
  const FADE_DURATION = 400;       // Match CSS transition

  // State
  let hasExitedBoot = false;
  let hasExitedSignin = false;
  let bootTimer = null;

  // Elements
  const bootScreen = document.getElementById('boot-screen');
  const signinScreen = document.getElementById('signin-screen');
  const desktopScreen = document.getElementById('desktop-screen');
  const enterDesktopBtn = document.getElementById('enter-desktop-btn');
  const usernameInput = document.getElementById('username');

  // ========================================
  // Boot Screen Logic
  // ========================================

  function exitBoot() {
    if (hasExitedBoot) return;
    hasExitedBoot = true;

    if (bootTimer) {
      clearTimeout(bootTimer);
      bootTimer = null;
    }

    document.removeEventListener('click', handleBootSkip);
    document.removeEventListener('keydown', handleBootSkip);

    bootScreen.classList.add('fade-out');

    setTimeout(() => {
      bootScreen.classList.add('hidden');
      signinScreen.classList.remove('hidden');

      // Focus the username input for accessibility
      if (usernameInput) {
        usernameInput.focus();
        usernameInput.select();
      }
    }, FADE_DURATION);
  }

  function handleBootSkip(event) {
    if (event.type === 'keydown') {
      const ignoredKeys = ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'];
      if (ignoredKeys.includes(event.key)) return;
    }
    exitBoot();
  }

  // ========================================
  // Sign-in Screen Logic
  // ========================================

  function exitSignin() {
    if (hasExitedSignin) return;
    hasExitedSignin = true;

    // Remove sign-in listeners
    if (enterDesktopBtn) {
      enterDesktopBtn.removeEventListener('click', exitSignin);
    }
    document.removeEventListener('keydown', handleSigninKeydown);

    signinScreen.classList.add('fade-out');

    setTimeout(() => {
      signinScreen.classList.add('hidden');
      desktopScreen.classList.remove('hidden');
    }, FADE_DURATION);
  }

  function handleSigninKeydown(event) {
    // Only handle Enter key on sign-in screen
    if (event.key === 'Enter' && !hasExitedSignin && hasExitedBoot) {
      event.preventDefault();
      exitSignin();
    }
  }

  // ========================================
  // Taskbar Logic
  // ========================================

  let activeApp = null;

  function setActiveApp(appName) {
    // Remove active class from all buttons
    const allBtns = document.querySelectorAll('.taskbar-btn');
    allBtns.forEach(btn => btn.classList.remove('active'));

    // Set new active app
    if (appName && appName !== activeApp) {
      const targetBtn = document.querySelector(`.taskbar-btn[data-app="${appName}"]`);
      if (targetBtn) {
        targetBtn.classList.add('active');
        activeApp = appName;

        // TODO: Open/focus corresponding window (next phase)
        console.log(`App opened: ${appName}`);
      }
    } else if (appName === activeApp) {
      // Clicking same app - could toggle or just focus
      // For now, keep it active
      const targetBtn = document.querySelector(`.taskbar-btn[data-app="${appName}"]`);
      if (targetBtn) {
        targetBtn.classList.add('active');
      }
    }
  }

  function initTaskbar() {
    const taskbarBtns = document.querySelectorAll('.taskbar-btn');

    taskbarBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const appName = btn.dataset.app;
        setActiveApp(appName);
      });
    });
  }

  // ========================================
  // Initialization
  // ========================================

  function init() {
    // Boot screen auto-exit timer
    bootTimer = setTimeout(exitBoot, BOOT_DURATION);

    // Boot screen skip listeners
    document.addEventListener('click', handleBootSkip);
    document.addEventListener('keydown', handleBootSkip);

    // Sign-in screen listeners (attached early, but only active after boot exits)
    if (enterDesktopBtn) {
      enterDesktopBtn.addEventListener('click', exitSignin);
    }
    document.addEventListener('keydown', handleSigninKeydown);

    // Taskbar initialization
    initTaskbar();
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
