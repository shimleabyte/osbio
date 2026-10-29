(function (global) {
  'use strict';
  const KEY = 'osbio.settings.v1';
  const defaults = Object.freeze({ wallpaper: 'flow', accent: 'yellow', motion: 'system', desktopIcons: true });
  let current = { ...defaults };

  function emit(type, detail = {}) {
    global.dispatchEvent(new CustomEvent('osbio:event', { detail: { type, timestamp: new Date().toISOString(), ...detail } }));
  }
  function normalize(input) {
    return {
      wallpaper: ['flow','grid','plain'].includes(input.wallpaper) ? input.wallpaper : defaults.wallpaper,
      accent: ['yellow','green'].includes(input.accent) ? input.accent : defaults.accent,
      motion: ['system','reduced'].includes(input.motion) ? input.motion : defaults.motion,
      desktopIcons: input.desktopIcons !== false
    };
  }
  function apply() {
    const root = document.documentElement;
    root.dataset.accent = current.accent;
    const reduce = current.motion === 'reduced' ||
      (current.motion === 'system' && global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
    root.dataset.motion = reduce ? 'reduced' : 'normal';
    const wallpaper = document.querySelector('.desktop-wallpaper');
    if (wallpaper) wallpaper.dataset.wallpaper = current.wallpaper;
    const shortcuts = document.querySelector('.desktop-icons');
    if (shortcuts) shortcuts.hidden = !current.desktopIcons;
  }
  function persist() {
    try {
      global.localStorage.setItem(KEY, JSON.stringify(current));
      return true;
    } catch (error) {
      emit('settings.persistence-degraded', { reason: 'Browser storage could not save preferences.' });
      return false;
    }
  }
  function update(patch) {
    current = normalize({ ...current, ...patch });
    const persistent = persist();
    apply();
    emit('settings.changed', { settings: { ...current }, persistent });
    return { ...current, persistent };
  }
  function reset() {
    current = { ...defaults };
    const persistent = persist();
    apply();
    emit('settings.reset', { settings: { ...current }, persistent });
    return { ...current, persistent };
  }
  function load() {
    try {
      const stored = global.localStorage.getItem(KEY);
      if (stored) current = normalize(JSON.parse(stored));
    } catch (error) {
      emit('settings.persistence-degraded', { reason: 'Stored preferences could not be read; defaults are active.' });
    }
    apply();
  }
  global.OSBioSettings = { get: () => ({ ...current }), update, reset, apply };
  load();
})(window);
