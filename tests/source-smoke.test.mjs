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
const core = read('js/osbioCore.js');
const workspaceApps = read('js/workspaceApps.js');
const settingsModule = read('js/osbioSettings.js');

test('shell JavaScript parses without syntax errors', () => {
  assert.doesNotThrow(() => new Function(main));
  assert.doesNotThrow(() => new Function(windows));
  assert.doesNotThrow(() => new Function(core));
  assert.doesNotThrow(() => new Function(workspaceApps));
  assert.doesNotThrow(() => new Function(settingsModule));
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


test('launcher focus restoration is deliberate and window overview is available', () => {
  assert.match(main, /launcherReturnFocus/);
  assert.match(main, /options\.restoreFocus/);
  assert.match(windows, /window-overview-toggle/);
  assert.match(windows, /toggleWindowOverview/);
  assert.match(windows, /function snapWindow/);
  assert.match(windows, /osbio:event/);
});


test('local workspace storage exposes safe file operations and bounded event history', () => {
  for (const api of ['ready', 'list', 'listAll', 'createFolder', 'saveFile', 'rename', 'move', 'remove', 'stats', 'exportData', 'importData', 'clearUserData']) {
    assert.match(core, new RegExp('\\\\b' + api + '\\\\b'));
  }
  assert.match(core, /indexedDB\.open/);
  assert.match(core, /localStorage/);
  assert.match(core, /storage\.degraded/);
  assert.match(core, /EVENT_LIMIT/);
  assert.match(core, /osbio-workspace-export-v1/);
});


test('Files and Editor have real templates and shared storage integration', () => {
  assert.match(windows, /files: \{/);
  assert.match(windows, /editor: \{/);
  assert.match(windows, /OSBioWorkspaceApps\.mount/);
  assert.match(workspaceApps, /OSBioStorage\.createFolder/);
  assert.match(workspaceApps, /OSBioStorage\.saveFile/);
  assert.match(workspaceApps, /osbio:open-file/);
  assert.match(workspaceApps, /osbio:before-close/);
  assert.match(html, /data-app="files"/);
  assert.match(html, /data-app="editor"/);
});


test('Settings and System Monitor use real local preference and session APIs', () => {
  assert.match(windows, /settings: \{/);
  assert.match(windows, /system: \{/);
  assert.match(windows, /getSnapshot/);
  assert.match(workspaceApps, /OSBioSettings\.update/);
  assert.match(workspaceApps, /OSBioStorage\.clearUserData/);
  assert.match(workspaceApps, /OSBioEvents\.recent/);
  assert.match(settingsModule, /localStorage/);
});


test('Flow Monitor exposes bounded event filtering and trace export', () => {
  assert.match(windows, /flow: \{/);
  assert.match(html, /data-app="flow"/);
  assert.match(workspaceApps, /function mountFlow/);
  assert.match(workspaceApps, /OSBioEvents\.recent\(160\)/);
  assert.match(workspaceApps, /osbio-event-trace-v1/);
  assert.match(wm, /game\.completed/);
  assert.match(main, /launcher\.opened/);
});


test('shared project catalogue is loaded and unavailable Resume is not a desktop shortcut', () => {
  const projects = read('js/projectData.js');
  assert.doesNotThrow(() => new Function(projects));
  assert.match(html, /js\\/projectData\\.js/);
  assert.match(projects, /https:\\/\\/github\\.com\\/shimleabyte\\/mutabaah-cli/);
  assert.match(projects, /BACKEND \/ IN PROGRESS/);
  const shortcuts = html.match(/<nav class="desktop-icons"[\\s\\S]*?<\\/nav>/)?.[0] || '';
  assert.doesNotMatch(shortcuts, /data-app="resume"/);
});
