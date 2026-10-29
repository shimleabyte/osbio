import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const html = read('index.html');
const main = read('js/main.js');
const windows = read('js/windowManager.js');
const css = read('css/main.css');

test('shell JavaScript parses without syntax errors', () => {
  assert.doesNotThrow(() => new Function(main));
  assert.doesNotThrow(() => new Function(windows));
});

test('desktop landmarks and launcher controls exist exactly once', () => {
  for (const id of ['boot-screen', 'desktop-screen', 'desktop-surface', 'window-layer', 'launcher-toggle', 'app-launcher', 'app-search', 'active-app-label']) {
    assert.equal((html.match(new RegExp('id="' + id + '"', 'g')) || []).length, 1, id);
  }
  assert.match(html, /aria-controls="app-launcher"/);
  assert.match(html, /id="launcher-empty"/);
});

test('shell app entries have corresponding window templates', () => {
  const templateBlock = windows.match(/windowTemplates:\s*\{([\s\S]*?)\n\s{4}\},\n\s{4}zIndex/);
  assert.ok(templateBlock, 'window template block can be located');
  const templateNames = new Set([...templateBlock[1].matchAll(/^\s{6}([a-z][a-z0-9-]*):\s*\{/gm)].map((m) => m[1]));
  const shellNames = new Set([...html.matchAll(/data-app="([a-z][a-z0-9-]*)"/g)].map((m) => m[1]));
  for (const appName of shellNames) assert.ok(templateNames.has(appName), 'missing template for ' + appName);
});

test('window lifecycle safeguards remain present', () => {
  assert.match(windows, /osbio:dispose/);
  assert.match(windows, /function focusWindow\(/);
  assert.match(windows, /function minimizeWindow\(/);
  assert.match(windows, /function maximizeWindow\(/);
  assert.match(windows, /function closeWindow\(/);
  assert.match(windows, /addEventListener\('resize', constrainWindows\)/);
});

test('Memory Match has restart, mismatch-timer cleanup and stale-round guard', () => {
  assert.match(windows, /function clearPendingTurn\(/);
  assert.match(windows, /clearPendingTurn\(\);/);
  assert.match(windows, /thisRound !== roundId/);
  assert.match(windows, /setAttribute\('aria-pressed'/);
  assert.match(windows, /pairCountElement/);
});

test('shell has visible keyboard focus and reduced-motion handling', () => {
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
