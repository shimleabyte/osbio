/**
 * Screen flow: BOOT -> SIGN-IN -> DESKTOP
 * Boot is skippable (click/key). Sign-in is a visual step only, no auth.
 * After the first pass in a tab the intro is skipped (sessionStorage, session only).
 */
(function () {
  'use strict';

  const BOOT_DURATION = 2000;
  const FADE_DURATION = 400;
  const SEEN_KEY = 'osbio:entered';

  let hasExitedBoot = false;
  let hasExitedSignin = false;
  let bootTimer = null;

  const bootScreen = document.getElementById('boot-screen');
  const signinScreen = document.getElementById('signin-screen');
  const desktopScreen = document.getElementById('desktop-screen');
  const enterDesktopBtn = document.getElementById('enter-desktop-btn');
  const usernameInput = document.getElementById('username');

  function hasEntered() {
    try { return sessionStorage.getItem(SEEN_KEY) === '1'; } catch (e) { return false; }
  }

  function markEntered() {
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch (e) { /* storage unavailable */ }
  }

  function showDesktop() {
    desktopScreen.classList.remove('hidden');
    WindowManager.openWindow('about');
  }

  function exitBoot() {
    if (hasExitedBoot) return;
    hasExitedBoot = true;

    clearTimeout(bootTimer);
    document.removeEventListener('click', handleBootSkip);
    document.removeEventListener('keydown', handleBootSkip);

    bootScreen.classList.add('fade-out');
    setTimeout(() => {
      bootScreen.classList.add('hidden');
      signinScreen.classList.remove('hidden');
      if (usernameInput) {
        usernameInput.focus();
        usernameInput.select();
      }
    }, FADE_DURATION);
  }

  function handleBootSkip(event) {
    if (event.type === 'keydown' && ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(event.key)) return;
    exitBoot();
  }

  function exitSignin() {
    if (hasExitedSignin) return;
    hasExitedSignin = true;
    markEntered();

    enterDesktopBtn.removeEventListener('click', exitSignin);
    document.removeEventListener('keydown', handleSigninKeydown);

    signinScreen.classList.add('fade-out');
    setTimeout(() => {
      signinScreen.classList.add('hidden');
      showDesktop();
    }, FADE_DURATION);
  }

  function handleSigninKeydown(event) {
    if (event.key === 'Enter' && hasExitedBoot && !hasExitedSignin) {
      event.preventDefault();
      exitSignin();
    }
  }

  function init() {
    if (hasEntered()) {
      hasExitedBoot = hasExitedSignin = true;
      bootScreen.classList.add('hidden');
      signinScreen.classList.add('hidden');
      showDesktop();
      return;
    }

    bootTimer = setTimeout(exitBoot, BOOT_DURATION);
    document.addEventListener('click', handleBootSkip);
    document.addEventListener('keydown', handleBootSkip);
    enterDesktopBtn.addEventListener('click', exitSignin);
    document.addEventListener('keydown', handleSigninKeydown);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
