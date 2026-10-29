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
const visitorGuide = read('js/visitorGuide.js');

test('shell JavaScript parses without syntax errors', () => {
  assert.doesNotThrow(() => new Function(main));
  assert.doesNotThrow(() => new Function(windows));
  assert.doesNotThrow(() => new Function(core));
  assert.doesNotThrow(() => new Function(workspaceApps));
  assert.doesNotThrow(() => new Function(settingsModule));
  assert.doesNotThrow(() => new Function(visitorGuide));
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
  assert.match(windows, /addEventListener\('resize', scheduleConstrainWindows\)/);
  assert.match(windows, /addEventListener\('pointercancel', stopDrag\)/);
  assert.match(windows, /e\.target\.closest\('\.window-title-group'\)/);
  assert.match(windows, /setAttribute\('aria-modal', 'false'\)/);
  assert.match(windows, /ResizeObserver/);
  assert.match(windows, /function scheduleConstrainWindows\(/);
  assert.match(windows, /WINDOW_LAYOUT_KEY = 'osbio\.window-layout\.v1'/);
  assert.match(windows, /function persistWindowLayout\(/);
  assert.match(windows, /getStoredWindowBounds\(appName\)/);
  assert.match(windows, /function snapWindow\(windowId, side, restoreBounds = null\)/);
  assert.match(windows, /function maximizeWindow\(windowId, restoreBounds = null\)/);
  assert.match(windows, /dragStartBounds = getWindowBounds\(target\)/);
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
    assert.ok(core.includes(api), 'missing storage API: ' + api);
  }
  assert.match(core, /indexedDB\.open/);
  assert.match(core, /file-system-notes/);
  assert.match(core, /missingBuiltIns/);
  assert.match(core, /storage\.migrated/);
  assert.match(core, /localStorage/);
  assert.match(core, /storage\.degraded/);
  assert.match(core, /EVENT_LIMIT/);
  assert.match(core, /osbio-workspace-export-v1/);
  assert.match(core, /duplicate item IDs/);
  assert.match(core, /cyclic folder structure/);
  assert.match(core, /MAX_IMPORT_BYTES = 12 \* 1024 \* 1024/);
  assert.match(core, /Workspace export exceeds the 12 MB transfer limit/);
  assert.match(core, /new Blob\(\[serialized\]\)\.size > MAX_IMPORT_BYTES/);
  assert.match(workspaceApps, /file\.size>limit/);
  assert.match(core, /const userIds = new Set\(userEntries\.map\(\(entry\) => entry\.id\)\)/);
  assert.match(core, /parentId: userIds\.has\(entry\.parentId\) \? entry\.parentId : 'root'/);
  assert.match(core, /missing parent folder/);
});


test('Files and Editor have real templates and shared storage integration', () => {
  assert.match(windows, /files: \{/);
  assert.match(windows, /id="files-context-menu"/);
  assert.match(windows, /data-files-action="move"/);
  assert.match(windows, /editor: \{/);
  assert.match(windows, /OSBioWorkspaceApps\.mount/);
  assert.match(workspaceApps, /store\.createFolder/);
  assert.match(workspaceApps, /store\.saveFile/);
  assert.match(workspaceApps, /function showMoveDialog\(/);
  assert.match(workspaceApps, /data-context-action/);
  assert.match(workspaceApps, /event\.detail === 0/);
  assert.match(workspaceApps, /loadRequestId/);
  assert.match(workspaceApps, /saveDocument\(true\)/);
  assert.match(workspaceApps, /data-editor-close-action/);
  assert.match(workspaceApps, /showCloseDialog\(/);
  assert.doesNotMatch(workspaceApps, /confirm\('Discard unsaved changes/);
  assert.match(workspaceApps, /osbio:open-file/);
  assert.match(workspaceApps, /osbio:before-close/);
  assert.match(html, /data-app="files"/);
  assert.match(html, /data-app="editor"/);
});


test('Settings and System Monitor use real local preference and session APIs', () => {
  assert.match(windows, /settings: \{/);
  assert.match(windows, /system: \{/);
  assert.match(windows, /getSnapshot/);
  assert.match(workspaceApps, /settings\.update/);
  assert.match(workspaceApps, /OSBioStorage\.clearUserData/);
  assert.match(workspaceApps, /OSBioEvents\.recent/);
  assert.match(windows, /function resetWindowLayouts\(/);
  assert.match(workspaceApps, /resetWindowLayouts/);
  assert.match(windows, /layout\.reset/);
  assert.match(windows, /id="settings-reset-layout"/);
  assert.match(settingsModule, /localStorage/);
});


test('Flow Monitor exposes bounded event filtering and trace export', () => {
  assert.match(windows, /flow: \{/);
  assert.match(html, /data-app="flow"/);
  assert.match(workspaceApps, /function mountFlow/);
  assert.match(workspaceApps, /OSBioEvents\.recent\(160\)/);
  assert.match(workspaceApps, /osbio-event-trace-v1/);
  assert.match(windows, /game\.completed/);
  assert.match(main, /launcher\.opened/);
});


test('shared project catalogue is loaded and unavailable Resume is not a desktop shortcut', () => {
  const projects = read('js/projectData.js');
  assert.doesNotThrow(() => new Function(projects));
  assert.ok(html.includes('js/projectData.js'));
  assert.ok(projects.includes('https://github.com/shimleabyte/mutabaah-cli'));
  assert.ok(projects.includes('BACKEND / IN PROGRESS'));
  const navStart = html.indexOf('<nav class="desktop-icons"');
  const navEnd = html.indexOf('</nav>', navStart);
  const shortcuts = navStart >= 0 && navEnd > navStart ? html.slice(navStart, navEnd) : '';
  assert.doesNotMatch(shortcuts, /data-app="resume"/);
});


test('window manager is exposed for cross-module storage and monitor integrations', () => {
  assert.match(windows, /window\.WindowManager = WindowManager/);
  assert.match(core, /global\.WindowManager/);
  assert.match(workspaceApps, /global\.WindowManager.*getSnapshot/);
});

test('launcher groups every app into Core, Supporting and Utilities tiers', () => {
  assert.ok(html.includes('<section class="launcher-tier" data-tier="core"'));
  assert.ok(html.includes('<section class="launcher-tier" data-tier="supporting"'));
  assert.ok(html.includes('<section class="launcher-tier" data-tier="utility"'));
  const launcherStart = html.indexOf('<div id="launcher-grid" class="launcher-grid">');
  const launcherEnd = html.indexOf('<p id="launcher-empty"', launcherStart);
  const launcherMarkup = launcherStart >= 0 && launcherEnd > launcherStart ? html.slice(launcherStart, launcherEnd) : '';
  const launcherApps = new Set([...launcherMarkup.matchAll(/data-app="([a-z][a-z0-9-]*)"/g)].map((match) => match[1]));
  const templateBlock = windows.match(/windowTemplates:\s*\{([\s\S]*?)\n\s{4}\},\n\s{4}zIndex/);
  assert.ok(templateBlock, 'window template block can be located');
  const templateNames = new Set([...templateBlock[1].matchAll(/^\s{6}([a-z][a-z0-9-]*):\s*\{/gm)].map((match) => match[1]));
  assert.deepEqual([...launcherApps].sort(), [...templateNames].sort(), 'every app template must remain discoverable through the launcher');
  assert.match(main, /launcher\.querySelectorAll\('\.launcher-tier'\)/, 'search should hide empty tier headings');
});

test('taskbar pins only core apps and adds other apps as session recents', () => {
  const taskbarStart = html.indexOf('<nav class="taskbar"');
  const taskbarEnd = html.indexOf('</nav>', taskbarStart);
  const taskbarMarkup = taskbarStart >= 0 && taskbarEnd > taskbarStart ? html.slice(taskbarStart, taskbarEnd) : '';
  const pinnedApps = [...taskbarMarkup.matchAll(/<button class="taskbar-btn"[^>]*data-pinned="true"[^>]*data-tier="core"[^>]*data-app="([a-z][a-z0-9-]*)"/g)].map((match) => match[1]);
  assert.deepEqual(pinnedApps, ['projects', 'about', 'files', 'editor', 'contact']);
  assert.match(taskbarMarkup, /id="taskbar-recent-divider"/);
  assert.match(windows, /function ensureTaskbarButton\(appName\)/);
  assert.match(windows, /button\.dataset\.pinned = 'false'/);
  assert.match(windows, /recentDivider\.hidden = false/);
  assert.ok(workspaceApps.includes("type.startsWith('file.')"), 'Files must listen for file events');
  assert.ok(workspaceApps.includes("type.startsWith('folder.')"), 'Files must listen for folder events');
  assert.ok(workspaceApps.includes("type.startsWith(prefix)"), 'System Monitor must match dot-delimited event prefixes');
});

test('IBM Plex fonts are bundled locally with no external font runtime dependency', () => {
  assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  assert.ok(html.includes('assets/fonts/IBMPlexSans-Regular.woff2'));
  assert.ok(html.includes('assets/fonts/IBMPlexMono-Regular.woff2'));
  assert.ok(css.includes('font-family: "IBM Plex Sans"'));
  assert.ok(css.includes('font-family: "IBM Plex Mono"'));
  assert.ok(css.includes('IBMPlexSans-SemiBold.woff2'));
  assert.ok(css.includes('IBMPlexMono-SemiBold.woff2'));
  assert.match(read('assets/fonts/OFL.txt'), /SIL OPEN FONT LICENSE Version 1\.1/);
});

test('Projects has a keyboard-operable list and separate project detail surface', () => {
  assert.match(windows, /data-project-select/);
  assert.match(windows, /function buildProjectDetailMarkup\(/);
  assert.match(windows, /id="project-detail"/);
  assert.match(windows, /aria-pressed/);
  assert.ok(css.includes('.projects-workspace') && css.includes('grid-template-columns:minmax(12.5rem,.82fr)'));
  assert.ok(css.includes('.project-detail') && css.includes('border:1px solid var(--color-window-border)'));
});


test('first-visit field guide has real destinations and a persistent, dismissible state', () => {
  for (const id of ['visitor-guide', 'visitor-guide-toggle', 'visitor-guide-hide', 'visitor-guide-progress-label', 'visitor-guide-progress-fill']) {
    assert.equal((html.match(new RegExp('id="' + id + '"', 'g')) || []).length, 1, id);
  }
  assert.match(html, /data-guide-app="projects"/);
  assert.match(html, /data-guide-app="about"/);
  assert.match(html, /data-guide-app="editor"/);
  assert.ok(html.includes('js/visitorGuide.js'));
  assert.match(visitorGuide, /osbio\.wayfinder\.v1/);
  assert.match(visitorGuide, /detail\.type === 'window\.opened'/);
  assert.match(visitorGuide, /global\.WindowManager\.openWindow\(app\)/);
  assert.match(visitorGuide, /state\.dismissed/);
  assert.match(css, /\.visitor-guide[\s\S]*border-top:3px solid #e8d64a/);
  assert.match(css, /\.visitor-guide-route:focus-visible/);
});


test('system navigation and taskbar have a grouped, responsive shell treatment', () => {
  assert.match(html, /<nav class="panel-navigation" aria-label="System navigation">/);
  assert.match(html, /class="panel-context" aria-live="polite"/);
  assert.match(html, /class="panel-nav-button guide-toggle"/);
  assert.equal((html.match(/id="window-overview-toggle"/g) || []).length, 1);
  assert.equal((html.match(/id="visitor-guide-toggle"/g) || []).length, 1);
  assert.match(html, /class="local-status" aria-label="Local session"/);
  assert.match(css, /#desktop-screen > \.system-panel/);
  assert.match(css, /\.panel-nav-button:focus-visible/);
  assert.match(css, /\.taskbar-apps[\s\S]*background: #111813/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.panel-context \{ display: none; \}/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.taskbar-system \{ display: none; \}[\s\S]*overflow-x: auto/);
  assert.match(css, /@media \(max-width: 420px\)[\s\S]*#system-date \{ display: none; \}/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.taskbar-btn:hover/);
});


test('shell presentation uses a floating taskbar dock and responsive chrome', () => {
  assert.match(css, /#desktop-screen > \.taskbar\s*\{[\s\S]*pointer-events: none/);
  assert.match(css, /\.taskbar-apps\s*\{[\s\S]*left: 50%[\s\S]*transform: translateX\(-50%\)/);
  assert.match(css, /\.taskbar-apps[\s\S]*background: #111813/);
  assert.match(css, /\.taskbar-system\s*\{[\s\S]*pointer-events: auto/);
  assert.match(css, /\.app-search-wrap:focus-within/);
  assert.match(css, /\.launcher-tier \.launcher-item:hover/);
  assert.match(css, /\.system-panel::after/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.panel-context \{ display: none; \}/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.taskbar-btn:hover/);
});
