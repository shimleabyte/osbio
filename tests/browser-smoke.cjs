const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const BASE_URL = process.env.OSBIO_BASE_URL || 'http://127.0.0.1:4173';
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.route('https://fonts.googleapis.com/**', (route) => route.abort());
  await page.route('https://fonts.gstatic.com/**', (route) => route.abort());

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.body.classList.contains('desktop-ready'), { timeout: 6000 });
    assert.equal(await page.locator('#desktop-screen').getAttribute('aria-hidden'), 'false');

    // Launcher search opens a real app template.
    await page.locator('#launcher-toggle').click();
    await page.locator('#app-search').fill('Flow Monitor');
    await page.locator('.launcher-item[data-app="flow"]').click();
    const flowWindow = page.locator('.window[data-app-name="flow"]');
    await flowWindow.waitFor({ state: 'visible' });
    assert.ok(await flowWindow.evaluate((element) => element.offsetLeft >= 116), 'new windows should not cover the desktop shortcut lane');
    await page.locator('#flow-event-list').waitFor({ state: 'visible' });

    // Window overview shows open windows and can focus one.
    await page.locator('#window-overview-toggle').click();
    const overview = page.locator('.window-overview');
    await overview.waitFor({ state: 'visible' });
    assert.ok(await overview.locator('[data-window-id]').count() >= 1);
    await overview.locator('[data-window-id]').first().click();
    await overview.waitFor({ state: 'hidden' });

    // Project cards render from the shared catalogue.
    await page.locator('.desktop-icon[data-app="projects"]').click();
    const projectWindow = page.locator('.window[data-app-name="projects"]');
    await projectWindow.waitFor({ state: 'visible' });
    assert.equal(await projectWindow.locator('.project-card').count(), 3);
    assert.ok(await projectWindow.locator('.project-status').count() >= 3);

    // Create a file, edit and save it, then reload and confirm it persisted.
    const filesTaskbarButton = page.locator('.taskbar-btn[data-app="files"]');
    const taskbarBounds = await filesTaskbarButton.boundingBox();
    assert.ok(taskbarBounds && taskbarBounds.x >= 0 && taskbarBounds.x + taskbarBounds.width <= 1440,
      'taskbar buttons must stay inside the viewport: ' + JSON.stringify(taskbarBounds));
    await filesTaskbarButton.click();
    const filesWindow = page.locator('.window[data-app-name="files"]');
    await filesWindow.waitFor({ state: 'visible' });
    await filesWindow.locator('[data-files-action="new-file"]').click();
    await filesWindow.locator('#files-name-input').fill('browser-smoke.md');
    await filesWindow.locator('.files-name-form button[type="submit"]').click();
    const editorWindow = page.locator('.window[data-app-name="editor"]');
    await editorWindow.waitFor({ state: 'visible' });
    const expectedText = 'OSBio browser persistence ' + Date.now();
    await editorWindow.locator('#editor-content').fill(expectedText);
    await editorWindow.locator('#editor-save').click();
    await page.waitForFunction((text) => {
      const node = document.querySelector('#editor-status-text');
      return node && node.textContent.includes('Saved locally') &&
        document.querySelector('#editor-content')?.value === text;
    }, expectedText);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.body.classList.contains('desktop-ready'), { timeout: 6000 });
    await page.locator('.taskbar-btn[data-app="files"]').click();
    await page.locator('.window[data-app-name="files"]').waitFor({ state: 'visible' });
    await page.locator('.window[data-app-name="files"] .file-row-name').filter({ hasText: 'browser-smoke.md' }).waitFor({ state: 'visible' });
    await page.locator('.window[data-app-name="files"] .file-row-name').filter({ hasText: 'browser-smoke.md' }).dblclick();
    const reopenedEditorBody = page.locator('.window[data-app-name="editor"] #editor-content');
    await reopenedEditorBody.waitFor({ state: 'visible' });
    // IndexedDB reads are asynchronous; wait for the document load, not just the new window.
    await page.waitForFunction((text) => {
      const editor = document.querySelector('.window[data-app-name="editor"] #editor-content');
      const status = document.querySelector('.window[data-app-name="editor"] #editor-status-text');
      return editor && editor.value === text && status && status.textContent.includes('Saved locally');
    }, expectedText);
    assert.equal(await reopenedEditorBody.inputValue(), expectedText);

    // Settings apply immediately and survive a reload.
    await page.locator('#launcher-toggle').click();
    await page.locator('#app-search').fill('Settings');
    await page.locator('.launcher-item[data-app="settings"]').click();
    const settings = page.locator('.window[data-app-name="settings"]');
    await settings.waitFor({ state: 'visible' });
    await settings.locator('#setting-wallpaper').selectOption('grid');
    await settings.locator('#setting-accent').selectOption('green');
    await page.waitForFunction(() => document.documentElement.dataset.accent === 'green' &&
      document.querySelector('.desktop-wallpaper')?.dataset.wallpaper === 'grid');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.body.classList.contains('desktop-ready'), { timeout: 6000 });
    assert.equal(await page.locator('html').getAttribute('data-accent'), 'green');
    assert.equal(await page.locator('.desktop-wallpaper').getAttribute('data-wallpaper'), 'grid');

    // Memory Match has 16 semantic buttons and a matched pair stays matched.
    await page.locator('#launcher-toggle').click();
    await page.locator('#app-search').fill('Memory Match');
    await page.locator('.launcher-item[data-app="memory"]').click();
    const game = page.locator('.window[data-app-name="memory"]');
    await game.waitFor({ state: 'visible' });
    assert.equal(await game.locator('.card').count(), 16);
    const pairIndices = await game.locator('.card').evaluateAll((cards) => {
      const firstIndexBySymbol = new Map();
      for (let i = 0; i < cards.length; i += 1) {
        const symbol = cards[i].dataset.symbol;
        if (firstIndexBySymbol.has(symbol)) return [firstIndexBySymbol.get(symbol), i];
        firstIndexBySymbol.set(symbol, i);
      }
      return [];
    });
    assert.equal(pairIndices.length, 2);
    await game.locator('.card').nth(pairIndices[0]).click();
    await game.locator('.card').nth(pairIndices[1]).click();
    await game.locator('.card.matched').first().waitFor({ state: 'visible' });
    assert.equal(await game.locator('.card.matched').count(), 2);

    // Narrow view switches to the adaptive single-window layout.
    await page.evaluate(() => window.WindowManager.closeAllWindows());
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.locator('.desktop-icons').evaluate((el) => getComputedStyle(el).display), 'none');
    await page.locator('#launcher-toggle').click();
    await page.locator('#app-search').fill('Files');
    await page.locator('.launcher-item[data-app="files"]').click();
    await page.locator('.window[data-app-name="files"]').waitFor({ state: 'visible' });
    assert.equal(await page.locator('.window[data-app-name="files"]').evaluate((el) => getComputedStyle(el).borderRadius), '0px');

    assert.deepEqual(pageErrors, [], 'no uncaught browser JavaScript errors');
    console.log('Browser smoke passed: launcher, overview, shared projects, file persistence, settings, Memory Match, mobile layout.');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
