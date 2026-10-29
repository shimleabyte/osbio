const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');

fs.mkdirSync('artifacts', { recursive: true });

const BASE_URL = process.env.OSBIO_BASE_URL || 'http://127.0.0.1:4173';
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  const pageErrors = [];
  const externalFontRequests = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('request', (request) => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(request.url())) externalFontRequests.push(request.url());
  });
  await page.route('https://fonts.googleapis.com/**', (route) => route.abort());
  await page.route('https://fonts.gstatic.com/**', (route) => route.abort());

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.body.classList.contains('desktop-ready'), { timeout: 6000 });
    assert.equal(await page.locator('#desktop-screen').getAttribute('aria-hidden'), 'false');
    assert.equal(await page.title(), 'osbio', 'the browser tab title should use the product name only');
    const logoFrame = await page.locator('.osbio-logo-frame').evaluate((element) => ({
      backgroundImage: getComputedStyle(element).backgroundImage,
      symbol: element.querySelector('use')?.getAttribute('href'),
      symbolParts: document.querySelector('#pf-logo-mark')?.querySelectorAll('path,rect').length
    }));
    assert.ok(logoFrame.backgroundImage.includes('linear-gradient'),
      'the logo surround should use the split-corner outline rails');
    assert.equal(logoFrame.symbol, '#pf-logo-mark');
    assert.ok(logoFrame.symbolParts >= 12, 'the pixel-flow mark should retain its layered outlined geometry');
    const firstIconOutline = await page.locator('.desktop-icon .app-icon').first()
      .evaluate((element) => getComputedStyle(element).backgroundImage);
    assert.ok(firstIconOutline.includes('linear-gradient'),
      'desktop app icons should inherit the segmented outline style');
    const topbarAudit = await page.evaluate(() => ({
      panel: getComputedStyle(document.querySelector('.system-panel')).backgroundImage,
      navButton: getComputedStyle(document.querySelector('#visitor-guide-toggle')).backgroundImage,
      clock: getComputedStyle(document.querySelector('.panel-clock')).backgroundImage,
      status: getComputedStyle(document.querySelector('.local-status')).backgroundImage,
      height: document.querySelector('.system-panel').getBoundingClientRect().height
    }));
    assert.ok(topbarAudit.panel.includes('linear-gradient'), 'topbar rail should use layered linework');
    assert.ok(topbarAudit.navButton.includes('linear-gradient'), 'topbar buttons should use segmented corners');
    assert.ok(topbarAudit.clock.includes('linear-gradient'), 'clock should use the same outline language');
    assert.ok(topbarAudit.status.includes('linear-gradient'), 'session mark should use the same outline language');
    assert.ok(Math.abs(topbarAudit.height - 55.2) < 1.5, 'desktop topbar should keep its intended height');
    const shellOutlineAudit = await page.evaluate(() => ({
      launcher: getComputedStyle(document.querySelector('#app-launcher')).backgroundImage,
      dock: getComputedStyle(document.querySelector('.taskbar-apps')).backgroundImage,
      nav: getComputedStyle(document.querySelector('#visitor-guide-toggle')).backgroundImage
    }));
    assert.ok(shellOutlineAudit.launcher.includes('linear-gradient'), 'launcher should use segmented edges');
    assert.ok(shellOutlineAudit.dock.includes('linear-gradient'), 'dock should use segmented edges');
    assert.ok(shellOutlineAudit.nav.includes('linear-gradient'), 'top navigation should use segmented edges');
    const visitorGuide = page.locator('#visitor-guide');
    assert.equal(await visitorGuide.isVisible(), false, 'the default desktop should open without a copy-heavy guide');
    const visibleShellText = await page.evaluate(() => {
      const selectors = [
        '.launcher-brand-copy', '.panel-nav-copy', '.panel-count', '.panel-context',
        '.local-status-label', '.desktop-icon > span:last-child', '.taskbar-system',
        '.launcher-heading', '.app-search-wrap', '.launcher-tier-heading',
        '.launcher-item-copy', '.launcher-item-index', '.launcher-footer'
      ];
      return selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector))
        .filter((element) => {
          const style = getComputedStyle(element);
          return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
        }).map((element) => selector + ': ' + element.textContent.trim()));
    });
    assert.deepEqual(visibleShellText, [], 'idle shell chrome should show icons and the clock, not labels');
    assert.match(await page.locator('#system-clock').textContent(), /\d{2}:\d{2}/);
    // Capture real shell states for the repository documentation artifact.
    await page.screenshot({ path: 'artifacts/osbio-desktop.png', animations: 'disabled' });
    await page.locator('#launcher-toggle').click();
    await page.locator('#app-launcher').waitFor({ state: 'visible' });
    await page.screenshot({ path: 'artifacts/osbio-launcher.png', animations: 'disabled' });
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#app-launcher').isVisible(), false,
      'capturing the launcher screenshot should leave the shell closed for the rest of the suite');
    assert.equal(await visitorGuide.locator('[data-guide-app]').count(), 3, 'the optional guide should retain three concrete destinations');
    await page.locator('#visitor-guide-toggle').click();
    assert.equal(await visitorGuide.isVisible(), true, 'the icon should open the optional field guide');
    assert.match(await page.locator('#visitor-guide-progress-label').textContent(), /0 \/ 3 STOPS VISITED/);
    await visitorGuide.locator('[data-guide-app="projects"]').click();
    const guideProjects = page.locator('.window[data-app-name="projects"]');
    await guideProjects.waitFor({ state: 'visible' });
    await page.waitForFunction(() => document.querySelector('#visitor-guide-progress-label')?.textContent.includes('1 / 3'));
    assert.equal(await visitorGuide.evaluate((element) => element.hidden), true, 'choosing a route should get the guide out of the way');
    await guideProjects.locator('.window-close').click();
    await guideProjects.waitFor({ state: 'detached' });
    await page.locator('#visitor-guide-toggle').click();
    assert.equal(await visitorGuide.isVisible(), true, 'the guide should be reopenable from the system panel');
    assert.match(await page.locator('#visitor-guide-toggle-count').textContent(), /1\/3/);
    await page.locator('#visitor-guide-hide').click();
    assert.equal(await visitorGuide.isVisible(), false, 'visitors can dismiss the guide without opening an app');
    assert.equal(await page.locator('#visitor-guide-toggle').getAttribute('aria-expanded'), 'false');

    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.evaluate(() => document.fonts.check('16px "IBM Plex Sans"')), true,
      'self-hosted IBM Plex Sans should be available');
    assert.equal(await page.evaluate(() => document.fonts.check('16px "IBM Plex Mono"')), true,
      'self-hosted IBM Plex Mono should be available');
    assert.deepEqual(externalFontRequests, [], 'the shell must not request Google Fonts at runtime');

    // Inspect the navigation and floating dock at desktop, tablet, and narrow mobile widths.
    for (const width of [1440, 1024, 900, 768, 760, 700, 681, 680, 390, 320]) {
      await page.setViewportSize({ width, height: width <= 420 ? 720 : 820 });
      const chrome = await page.evaluate(() => {
        const measure = (selector) => {
          const element = document.querySelector(selector);
          if (!element) return null;
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return {
            left: rect.left, right: rect.right, width: rect.width,
            display: style.display, overflowX: style.overflowX,
            scrollWidth: element.scrollWidth, clientWidth: element.clientWidth
          };
        };
        return {
          viewport: innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          panelLeft: measure('.system-panel .panel-left'),
          panelRight: measure('.system-panel .panel-right'),
          launcher: measure('#launcher-toggle'),
          panelNavigation: measure('.panel-navigation'),
          panelContext: measure('.panel-context'),
          dock: measure('.taskbar-apps'),
          dockSystem: measure('.taskbar-system'),
          date: measure('#system-date')
        };
      });
      assert.ok(chrome.documentWidth <= width,
        'shell must not create horizontal page overflow at ' + width + 'px: ' + JSON.stringify(chrome));
      assert.ok(chrome.panelLeft && chrome.panelRight && chrome.panelLeft.right <= chrome.panelRight.left + 1,
        'topbar groups must not overlap at ' + width + 'px: ' + JSON.stringify(chrome));
      assert.ok(chrome.launcher && chrome.panelNavigation &&
        chrome.launcher.right <= chrome.panelNavigation.left + 1,
        'launcher must remain distinct from system navigation at ' + width + 'px: ' + JSON.stringify(chrome));
      assert.ok(chrome.dock && chrome.dock.left >= -1 && chrome.dock.right <= width + 1,
        'floating dock must stay inside the viewport at ' + width + 'px: ' + JSON.stringify(chrome));
      if (width <= 760) {
        assert.equal(chrome.dockSystem.display, 'none',
          'dock metadata must yield space to app navigation at ' + width + 'px');
        assert.equal(chrome.dock.overflowX, 'auto',
          'the dock should remain horizontally scrollable when recent apps grow at ' + width + 'px');
      } else if (chrome.dockSystem.display !== 'none') {
        const separated = chrome.dock.right <= chrome.dockSystem.left - 4 ||
          chrome.dockSystem.right <= chrome.dock.left - 4;
        assert.ok(separated, 'dock and workspace label must not collide at ' + width + 'px: ' + JSON.stringify(chrome));
      }
      if (width <= 420) assert.equal(chrome.date.display, 'none',
        'the date should collapse before it crowds the smallest topbar widths');
    }
    await page.setViewportSize({ width: 1440, height: 960 });
    assert.deepEqual(await page.locator('.taskbar-btn[data-pinned="true"]').evaluateAll((buttons) =>
      buttons.map((button) => button.dataset.app)), ['projects', 'about', 'files', 'editor', 'contact']);
    assert.equal(await page.locator('#taskbar-recent-divider').evaluate((element) => element.hidden), true,
      'the recent-app separator starts hidden until a supporting app launches');
    assert.deepEqual(await page.locator('.launcher-tier').evaluateAll((tiers) => tiers.map((tier) => tier.dataset.tier)),
      ['core', 'supporting', 'utility']);
    assert.equal(await page.evaluate(() => window.WindowManager.getSnapshot().windows.length), 0,
      'a fresh page load must begin with the empty desktop');
    await page.evaluate(() => localStorage.setItem('osbio.window-layout.v1', '{ malformed layout'));

    // Icon grid launches a real app template.
    await page.locator('#launcher-toggle').click();
    await page.locator('.launcher-item[data-app="flow"]').click();
    const flowWindow = page.locator('.window[data-app-name="flow"]');
    await flowWindow.waitFor({ state: 'visible' });
    assert.equal(await flowWindow.locator('.window-app-marker use').getAttribute('href'), '#pf-icon-flow',
      'window title should use the matching custom app glyph');
    assert.equal(await page.locator('.window.active').count(), 1, 'exactly one window should be active after launch');
    assert.ok(await flowWindow.evaluate((element) => element.offsetLeft >= 116), 'new windows should not cover the desktop shortcut lane');
    await page.locator('#flow-event-list').waitFor({ state: 'visible' });
    const flowTaskbarButton = page.locator('.taskbar-btn[data-app="flow"]');
    await flowTaskbarButton.waitFor({ state: 'visible' });
    assert.equal(await flowTaskbarButton.locator('.app-icon use').getAttribute('href'), '#pf-icon-flow',
      'recent taskbar buttons should clone the custom app glyph, not fall back to a generic marker');
    const iconAudit = await page.locator('.app-icon use').evaluateAll((uses) => ({
      count: uses.length,
      allResolve: uses.every((use) => {
        const href = use.getAttribute('href');
        return href && document.getElementById(href.slice(1))?.tagName.toLowerCase() === 'symbol';
      })
    }));
    assert.ok(iconAudit.count >= 20, 'desktop, launcher, taskbar and recent apps should all render custom glyphs');
    assert.equal(iconAudit.allResolve, true, 'every visible icon reference should resolve to an SVG symbol');

    // The launcher shortcut returns focus to the prior control when dismissed with Escape.
    await page.keyboard.press('Control+k');
    await page.locator('#app-launcher').waitFor({ state: 'visible' });
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#app-launcher').isVisible(), false);
    assert.equal(await flowWindow.evaluate((element) => document.activeElement === element), true);

    // Exercise real pointer snap, maximize/restore, and viewport constraint behavior.
    const titleGroup = flowWindow.locator('.window-title-group');
    const titleBounds = await titleGroup.boundingBox();
    assert.ok(titleBounds, 'window title group should have visible geometry');
    await page.mouse.move(titleBounds.x + 40, titleBounds.y + titleBounds.height / 2);
    await page.mouse.down();
    await page.mouse.move(3, titleBounds.y + titleBounds.height / 2, { steps: 10 });
    await page.mouse.up();
    await page.waitForFunction(() => document.querySelector('.window[data-app-name="flow"]')?.classList.contains('snapped-left'));
    await flowWindow.locator('.window-maximize').click();
    await page.waitForFunction(() => document.querySelector('.window[data-app-name="flow"]')?.classList.contains('maximized'));
    await flowWindow.locator('.window-maximize').click();
    await page.waitForFunction(() => {
      const element = document.querySelector('.window[data-app-name="flow"]');
      return element && !element.classList.contains('maximized') && !element.classList.contains('snapped-left');
    });
    const restoredFlowBounds = await flowWindow.boundingBox();
    const projectShortcutBounds = await page.locator('.desktop-icon[data-app="projects"]').boundingBox();
    assert.ok(restoredFlowBounds && projectShortcutBounds &&
      restoredFlowBounds.x >= projectShortcutBounds.x + projectShortcutBounds.width - 1,
      'restoring a snapped window should not leave it covering desktop shortcuts: ' +
        JSON.stringify({ restoredFlowBounds, projectShortcutBounds }));

    const maximizeControlBounds = await flowWindow.locator('.window-maximize').boundingBox();
    assert.ok(maximizeControlBounds, 'maximize control should be visible');
    await page.mouse.move(maximizeControlBounds.x + maximizeControlBounds.width / 2, maximizeControlBounds.y + maximizeControlBounds.height / 2);
    await page.mouse.down();
    await page.mouse.move(3, maximizeControlBounds.y + maximizeControlBounds.height / 2, { steps: 8 });
    await page.mouse.up();
    await pause(80);
    assert.equal(await flowWindow.evaluate((element) => element.classList.contains('snapped-left') || element.classList.contains('maximized')), false,
      'dragging from a titlebar control must not move or snap the window');

    // Simulate pointer cancellation and ensure the document-level drag listeners are removed.
    const cancelledDrag = await flowWindow.evaluate((element) => {
      const header = element.querySelector('.window-header');
      const originalCapture = header.setPointerCapture;
      const originalLeft = element.style.left;
      const originalTop = element.style.top;
      header.setPointerCapture = () => {};
      const startX = element.offsetLeft + 220;
      const startY = element.offsetTop + header.offsetHeight / 2;
      const pointer = (type, x) => new PointerEvent(type, {
        bubbles: true, cancelable: true, pointerId: 771, pointerType: 'mouse',
        button: 0, clientX: x, clientY: startY
      });
      header.dispatchEvent(pointer('pointerdown', startX));
      document.dispatchEvent(pointer('pointermove', startX + 2));
      const afterMove = element.style.left;
      document.dispatchEvent(pointer('pointercancel', startX + 2));
      const afterCancel = element.style.left;
      document.dispatchEvent(pointer('pointermove', startX + 120));
      const afterLaterMove = element.style.left;
      if (originalCapture) header.setPointerCapture = originalCapture;
      else delete header.setPointerCapture;
      element.style.left = originalLeft;
      element.style.top = originalTop;
      return { moved: afterMove !== originalLeft, stayedAfterCancel: afterLaterMove === afterCancel };
    });
    assert.equal(cancelledDrag.moved, true, 'synthetic pointer drag should exercise the move handler');
    assert.equal(cancelledDrag.stayedAfterCancel, true, 'pointercancel must remove active drag listeners');

    await page.setViewportSize({ width: 900, height: 700 });
    await page.waitForFunction(() => {
      const windowElement = document.querySelector('.window[data-app-name="flow"]');
      const desktopElement = document.querySelector('#desktop-surface');
      if (!windowElement || !desktopElement) return false;
      const windowRect = windowElement.getBoundingClientRect();
      const desktopRect = desktopElement.getBoundingClientRect();
      return windowRect.left >= desktopRect.left - 1 &&
        windowRect.top >= desktopRect.top - 1 &&
        windowRect.right <= desktopRect.right + 1 &&
        windowRect.bottom <= desktopRect.bottom + 1;
    });
    const resizedBounds = await flowWindow.boundingBox();
    const desktopBounds = await page.locator('#desktop-surface').boundingBox();
    assert.ok(resizedBounds && desktopBounds && resizedBounds.x >= desktopBounds.x - 1 &&
      resizedBounds.x + resizedBounds.width <= desktopBounds.x + desktopBounds.width + 1 &&
      resizedBounds.y >= desktopBounds.y - 1 &&
      resizedBounds.y + resizedBounds.height <= desktopBounds.y + desktopBounds.height + 1,
      'window should remain constrained after viewport resize: ' + JSON.stringify({ resizedBounds, desktopBounds }));
    await page.setViewportSize({ width: 1440, height: 960 });
    await pause(80);
    const flowBoundsAfterResizeCycle = await flowWindow.boundingBox();
    const shortcutBoundsAfterResizeCycle = await page.locator('.desktop-icon[data-app="projects"]').boundingBox();
    assert.ok(flowBoundsAfterResizeCycle && shortcutBoundsAfterResizeCycle &&
      flowBoundsAfterResizeCycle.x >= shortcutBoundsAfterResizeCycle.x + shortcutBoundsAfterResizeCycle.width - 1,
      'window should remain outside the desktop shortcut lane after shrinking and restoring the viewport: ' +
        JSON.stringify({ flowBoundsAfterResizeCycle, shortcutBoundsAfterResizeCycle }));

    // Taskbar clicks should minimize an active app and restore it on the next click.
    await flowTaskbarButton.click();
    await page.waitForFunction(() => document.querySelector('.window[data-app-name="flow"]')?.classList.contains('minimized'));
    await flowTaskbarButton.click();
    await page.waitForFunction(() => {
      const element = document.querySelector('.window[data-app-name="flow"]');
      return element && !element.classList.contains('minimized') && element.classList.contains('active');
    });

    // Minimized windows remain discoverable in the overview and restore when selected.
    await flowWindow.locator('.window-minimize').click();
    await page.waitForFunction(() => document.querySelector('.window[data-app-name="flow"]')?.classList.contains('minimized'));
    await page.locator('#window-overview-toggle').click();
    const overview = page.locator('.window-overview');
    await overview.waitFor({ state: 'visible' });
    const flowOverviewItem = overview.locator('[data-window-id]').filter({ hasText: 'Flow Monitor' });
    await flowOverviewItem.waitFor({ state: 'visible' });
    await flowOverviewItem.click();
    await flowWindow.waitFor({ state: 'visible' });
    assert.equal(await flowWindow.evaluate((element) => element.classList.contains('active')), true);
    await overview.waitFor({ state: 'hidden' });

    // Keyboard shortcut opens the window overview; Escape returns focus to the active window.
    await page.keyboard.press('Control+Alt+w');
    await overview.waitFor({ state: 'visible' });
    assert.ok(await overview.evaluate((element) => element.contains(document.activeElement)), 'overview should receive keyboard focus');
    await page.keyboard.press('Escape');
    await overview.waitFor({ state: 'hidden' });
    assert.equal(await flowWindow.evaluate((element) => document.activeElement === element), true);
    assert.equal(await page.locator('.window.active').count(), 1, 'overview dismissal must preserve the active-window invariant');

    // Project cards render from the shared catalogue, and closing the foreground window restores focus.
    let savedProjectBounds = null;
    await page.locator('.desktop-icon[data-app="projects"]').click();
    const projectWindow = page.locator('.window[data-app-name="projects"]');
    await projectWindow.waitFor({ state: 'visible' });
    assert.equal(await projectWindow.locator('.project-card').count(), 3);
    assert.equal(await projectWindow.locator('.project-detail-status').count(), 1);
    assert.equal(await projectWindow.evaluate((element) => element.classList.contains('active')), true);
    assert.equal(await page.locator('.window.active').count(), 1, 'opening another app must not leave two active windows');
    assert.equal(await projectWindow.locator('#project-detail-title').textContent(), 'Mutabaah CLI',
      'the detail pane should open on the first project');
    await projectWindow.locator('.project-card[data-project-select="simpul"]').click();
    await page.waitForFunction(() => document.querySelector('#project-detail-title')?.textContent === 'Simpul');
    assert.equal(await projectWindow.locator('.project-card[data-project-select="simpul"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await projectWindow.locator('.project-card[data-project-select="mutabaah-cli"]').getAttribute('aria-pressed'), 'false');
    assert.equal(await projectWindow.locator('#project-detail a.project-source-link').getAttribute('href'),
      'https://github.com/shimleabyte/simpul');

    const initialProjectBounds = await projectWindow.boundingBox();
    const projectTitleGroup = projectWindow.locator('.window-title-group');
    const projectTitleBounds = await projectTitleGroup.boundingBox();
    assert.ok(initialProjectBounds && projectTitleBounds, 'project window should have measurable bounds');
    await page.mouse.move(projectTitleBounds.x + 42, projectTitleBounds.y + projectTitleBounds.height / 2);
    await page.mouse.down();
    await page.mouse.move(projectTitleBounds.x + 182, projectTitleBounds.y + projectTitleBounds.height / 2 + 46, { steps: 8 });
    await page.mouse.up();
    await page.waitForFunction(({ beforeX, beforeY }) => {
      const element = document.querySelector('.window[data-app-name="projects"]');
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      return rect.left > beforeX + 60 && rect.top > beforeY + 20;
    }, { beforeX: initialProjectBounds.x, beforeY: initialProjectBounds.y });
    savedProjectBounds = await projectWindow.evaluate((element) => ({
      left: element.offsetLeft, top: element.offsetTop,
      width: element.offsetWidth, height: element.offsetHeight
    }));

    await projectWindow.locator('.window-close').click();
    await projectWindow.waitFor({ state: 'detached' });
    await page.locator('.taskbar-btn[data-app="projects"]').click();
    await projectWindow.waitFor({ state: 'visible' });
    const reopenedProjectBounds = await projectWindow.evaluate((element) => ({
      left: element.offsetLeft, top: element.offsetTop,
      width: element.offsetWidth, height: element.offsetHeight
    }));
    assert.ok(savedProjectBounds && reopenedProjectBounds &&
      ['left', 'top', 'width', 'height'].every((key) =>
        Math.abs(reopenedProjectBounds[key] - savedProjectBounds[key]) <= 1),
      'closing and reopening Projects should restore its saved geometry: ' +
        JSON.stringify({ savedProjectBounds, reopenedProjectBounds }));
    await projectWindow.locator('.window-close').click();
    await projectWindow.waitFor({ state: 'detached' });
    assert.equal(await flowWindow.evaluate((element) => element.classList.contains('active')), true);

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

    // Context menu is keyboard-reachable; selecting a file should keep focus on its row.
    await editorWindow.locator('.window-close').click();
    await editorWindow.waitFor({ state: 'detached' });
    const originalFileRow = filesWindow.locator('.file-row').filter({ hasText: 'browser-smoke.md' });
    await originalFileRow.click();
    assert.equal(await originalFileRow.evaluate((row) => document.activeElement === row), true,
      'single-click selection should keep focus on the selected row');
    await originalFileRow.press('Shift+F10');
    const filesContextMenu = filesWindow.locator('#files-context-menu');
    await filesContextMenu.waitFor({ state: 'visible' });
    assert.ok(await filesContextMenu.evaluate((menu) => menu.contains(document.activeElement)),
      'Shift+F10 should open the Files context menu and move focus into it');
    assert.equal(await filesContextMenu.locator('[data-context-action="rename"]').isDisabled(), false);
    await filesContextMenu.locator('[data-context-action="rename"]').click();
    await filesWindow.locator('#files-name-input').fill('browser-smoke-renamed.md');
    await filesWindow.locator('.files-name-form button[type="submit"]').click();
    const renamedFileRow = filesWindow.locator('.file-row').filter({ hasText: 'browser-smoke-renamed.md' });
    await renamedFileRow.waitFor({ state: 'visible' });

    // Move between root and Documents through the destination picker.
    await renamedFileRow.click();
    await renamedFileRow.press('Control+Shift+M');
    const moveDialog = filesWindow.locator('.files-move-dialog');
    await moveDialog.waitFor({ state: 'visible' });
    await moveDialog.locator('#files-move-destination').selectOption('folder-documents');
    await moveDialog.locator('.files-move-form button[type="submit"]').click();
    await page.waitForFunction(async () => {
      const all = await window.OSBioStorage.listAll();
      const item = all.find((entry) => entry.name === 'browser-smoke-renamed.md');
      return item && item.parentId === 'folder-documents';
    });
    await filesWindow.locator('.file-row').filter({ hasText: 'Documents' }).dblclick();
    const movedFileRow = filesWindow.locator('.file-row').filter({ hasText: 'browser-smoke-renamed.md' });
    await movedFileRow.waitFor({ state: 'visible' });
    await movedFileRow.click();
    await movedFileRow.press('Control+Shift+M');
    await moveDialog.locator('#files-move-destination').selectOption('root');
    await moveDialog.locator('.files-move-form button[type="submit"]').click();
    await filesWindow.locator('[data-files-parent="root"]').click();
    const rootFileRow = filesWindow.locator('.file-row').filter({ hasText: 'browser-smoke-renamed.md' });
    await rootFileRow.waitFor({ state: 'visible' });

    // A folder cannot be moved into itself or one of its descendants.
    const moveGuardFixture = await page.evaluate(async () => {
      const parent = await window.OSBioStorage.createFolder('move-guard-parent');
      const child = await window.OSBioStorage.createFolder('move-guard-child', parent.id);
      return { parentId: parent.id, childId: child.id };
    });
    const guardParentRow = filesWindow.locator('.file-row').filter({ hasText: 'move-guard-parent' });
    await guardParentRow.waitFor({ state: 'visible' });
    await guardParentRow.click();
    await guardParentRow.press('Control+Shift+M');
    await moveDialog.waitFor({ state: 'visible' });
    assert.equal(await moveDialog.locator('option[value="' + moveGuardFixture.parentId + '"]').count(), 0,
      'a folder cannot be moved into itself');
    assert.equal(await moveDialog.locator('option[value="' + moveGuardFixture.childId + '"]').count(), 0,
      'a folder cannot be moved into its descendant');
    await moveDialog.locator('[data-files-action="cancel-move"]').click();
    await page.evaluate(async ({ parentId, childId }) => {
      await window.OSBioStorage.remove(childId);
      await window.OSBioStorage.remove(parentId);
    }, moveGuardFixture);

    await rootFileRow.press('Enter');
    await editorWindow.waitFor({ state: 'visible' });
    await page.waitForFunction(() =>
      document.querySelector('.window[data-app-name="editor"] #editor-name')?.value === 'browser-smoke-renamed.md');

    const expectedText = 'OSBio browser persistence ' + Date.now();
    await editorWindow.locator('#editor-content').fill(expectedText);
    await editorWindow.locator('#editor-save').click();
    await page.waitForFunction((text) => {
      const node = document.querySelector('#editor-status-text');
      return node && node.textContent.includes('Saved locally') &&
        document.querySelector('#editor-content')?.value === text;
    }, expectedText);
    const legacyWorkspacePrepared = await page.evaluate(async () => {
      if (window.OSBioStorage.getMode() !== 'indexeddb') return false;
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('osbio-workspace', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction('entries', 'readwrite');
          transaction.objectStore('entries').delete('file-system-notes');
          transaction.oncomplete = () => { db.close(); resolve(true); };
          transaction.onerror = () => { db.close(); reject(transaction.error); };
          transaction.onabort = () => { db.close(); reject(transaction.error); };
        };
      });
    });
    assert.equal(legacyWorkspacePrepared, true, 'test requires the normal IndexedDB-backed workspace');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.body.classList.contains('desktop-ready'), { timeout: 6000 });
    assert.equal(await page.evaluate(() => window.WindowManager.getSnapshot().windows.length), 0,
      'saved geometry must not auto-open windows after reload');
    const migratedWorkspace = await page.evaluate(async () => {
      await window.OSBioStorage.ready();
      const all = await window.OSBioStorage.listAll();
      const notes = all.find((entry) => entry.id === 'file-system-notes');
      const userFile = all.find((entry) => entry.name === 'browser-smoke-renamed.md');
      return {
        notesPresent: Boolean(notes && notes.system && notes.readOnly && notes.parentId === 'folder-documents'),
        userContentPreserved: Boolean(userFile && userFile.content.includes('OSBio browser persistence'))
      };
    });
    assert.equal(migratedWorkspace.notesPresent, true, 'System Notes should be added to an existing workspace');
    assert.equal(migratedWorkspace.userContentPreserved, true, 'seed migration must preserve the existing user file');
    await page.locator('.taskbar-btn[data-app="projects"]').click();
    const persistedProjectWindow = page.locator('.window[data-app-name="projects"]');
    await persistedProjectWindow.waitFor({ state: 'visible' });
    const persistedProjectBounds = await persistedProjectWindow.evaluate((element) => ({
      left: element.offsetLeft, top: element.offsetTop,
      width: element.offsetWidth, height: element.offsetHeight
    }));
    assert.ok(savedProjectBounds && persistedProjectBounds &&
      ['left', 'top', 'width', 'height'].every((key) =>
        Math.abs(persistedProjectBounds[key] - savedProjectBounds[key]) <= 1),
      'saved geometry should survive page reload: ' + JSON.stringify({ savedProjectBounds, persistedProjectBounds }));
    await persistedProjectWindow.locator('.window-close').click();
    await persistedProjectWindow.waitFor({ state: 'detached' });
    await page.locator('.taskbar-btn[data-app="files"]').click();
    await page.locator('.window[data-app-name="files"]').waitFor({ state: 'visible' });
    await page.locator('.window[data-app-name="files"] .file-row-name').filter({ hasText: 'browser-smoke-renamed.md' }).waitFor({ state: 'visible' });
    await page.locator('.window[data-app-name="files"] .file-row-name').filter({ hasText: 'browser-smoke-renamed.md' }).dblclick();
    const reopenedEditorBody = page.locator('.window[data-app-name="editor"] #editor-content');
    await reopenedEditorBody.waitFor({ state: 'visible' });
    // IndexedDB reads are asynchronous; wait for the document load, not just the new window.
    await page.waitForFunction((text) => {
      const editor = document.querySelector('.window[data-app-name="editor"] #editor-content');
      const status = document.querySelector('.window[data-app-name="editor"] #editor-status-text');
      return editor && editor.value === text && status && status.textContent.includes('Saved locally');
    }, expectedText);
    assert.equal(await reopenedEditorBody.inputValue(), expectedText);

    // Dirty close offers Save, Discard and Keep editing without a native browser modal.
    const closePrompt = page.locator('#editor-close-dialog');
    await reopenedEditorBody.fill(expectedText + ' draft saved on close');
    await page.locator('.window[data-app-name="editor"] .window-close').click();
    await closePrompt.waitFor({ state: 'visible' });
    assert.equal(await closePrompt.locator('[data-editor-close-action]').count(), 3);
    await closePrompt.locator('[data-editor-close-action="cancel"]').click();
    await closePrompt.waitFor({ state: 'hidden' });
    assert.equal(await reopenedEditorBody.isVisible(), true, 'Keep editing must leave the editor open');
    assert.equal(await reopenedEditorBody.inputValue(), expectedText + ' draft saved on close');

    await page.locator('.window[data-app-name="editor"] .window-close').click();
    await closePrompt.waitFor({ state: 'visible' });
    await closePrompt.locator('[data-editor-close-action="save"]').click();
    await page.locator('.window[data-app-name="editor"]').waitFor({ state: 'detached' });
    const savedOnCloseText = expectedText + ' draft saved on close';
    await page.locator('.window[data-app-name="files"] .file-row-name').filter({ hasText: 'browser-smoke-renamed.md' }).dblclick();
    await page.waitForFunction((text) =>
      document.querySelector('.window[data-app-name="editor"] #editor-content')?.value === text, savedOnCloseText);

    const unsavedToDiscard = savedOnCloseText + ' draft to discard';
    await page.locator('.window[data-app-name="editor"] #editor-content').fill(unsavedToDiscard);
    await page.locator('.window[data-app-name="editor"] .window-close').click();
    await closePrompt.waitFor({ state: 'visible' });
    await closePrompt.locator('[data-editor-close-action="discard"]').click();
    await page.locator('.window[data-app-name="editor"]').waitFor({ state: 'detached' });
    await page.locator('.window[data-app-name="files"] .file-row-name').filter({ hasText: 'browser-smoke-renamed.md' }).dblclick();
    await page.waitForFunction((text) =>
      document.querySelector('.window[data-app-name="editor"] #editor-content')?.value === text, savedOnCloseText);

    const keyboardSavedText = savedOnCloseText + ' saved with Ctrl+S';
    await page.locator('.window[data-app-name="editor"] #editor-content').fill(keyboardSavedText);
    await page.locator('.window[data-app-name="editor"] #editor-content').press('Control+s');
    await page.waitForFunction((text) => {
      const editor = document.querySelector('.window[data-app-name="editor"] #editor-content');
      const status = document.querySelector('#editor-status-text');
      return editor && editor.value === text && status && status.textContent.includes('Saved locally');
    }, keyboardSavedText);
    await page.locator('.window[data-app-name="editor"] .window-close').click();
    await page.locator('.window[data-app-name="editor"]').waitFor({ state: 'detached' });
    await page.locator('.window[data-app-name="files"] .file-row-name').filter({ hasText: 'browser-smoke-renamed.md' }).dblclick();
    await page.waitForFunction((text) =>
      document.querySelector('.window[data-app-name="editor"] #editor-content')?.value === text, keyboardSavedText);


    // Import validation rejects malformed structures before mutating browser storage.
    const importValidation = await page.evaluate(async () => {
      const store = window.OSBioStorage;
      await store.ready();
      const baseline = await store.listAll();
      const invalidPayloads = [
        [
          { id: 'duplicate', type: 'folder', name: 'Duplicate A', parentId: 'root' },
          { id: 'duplicate', type: 'file', name: 'Duplicate B.md', parentId: 'root', content: '' }
        ],
        [
          { id: 'cycle-a', type: 'folder', name: 'Cycle A', parentId: 'cycle-b' },
          { id: 'cycle-b', type: 'folder', name: 'Cycle B', parentId: 'cycle-a' }
        ],
        [{ id: 'missing-child', type: 'file', name: 'Missing.md', parentId: 'not-in-export', content: '' }],
        [
          { id: 'file-parent', type: 'file', name: 'Parent.md', parentId: 'root', content: '' },
          { id: 'bad-child', type: 'file', name: 'Child.md', parentId: 'file-parent', content: '' }
        ],
        [{ id: 'bad-content', type: 'file', name: 'Object.md', parentId: 'root', content: { not: 'text' } }]
      ];
      const rejected = [];
      for (const entries of invalidPayloads) {
        try {
          await store.importData(JSON.stringify({ format: 'osbio-workspace-export-v1', entries }));
          rejected.push(false);
        } catch {
          rejected.push(true);
        }
      }
      let oversizedRejected = false;
      try { await store.importData(' '.repeat(store.getLimits().maxImportBytes + 1)); }
      catch (error) { oversizedRejected = /12 MB transfer limit/.test(error.message); }
      let oversizedUnicodeRejected = false;
      try { await store.importData('é'.repeat(Math.floor(store.getLimits().maxImportBytes / 2) + 16)); }
      catch (error) { oversizedUnicodeRejected = /12 MB transfer limit/.test(error.message); }
      const afterInvalid = await store.listAll();
      const validResult = await store.importData(JSON.stringify({
        format: 'osbio-workspace-export-v1',
        entries: [
          { id: 'bundle', type: 'folder', name: 'Imported Bundle', parentId: 'root' },
          { id: 'nested', type: 'folder', name: 'Nested', parentId: 'bundle' },
          { id: 'note', type: 'file', name: 'Imported Note.md', parentId: 'nested', content: 'import-ok' }
        ]
      }));
      const imported = await store.listAll();
      const root = imported.find((entry) => entry.name === 'Imported Bundle');
      const nested = imported.find((entry) => entry.name === 'Nested');
      const note = imported.find((entry) => entry.name === 'Imported Note.md');
      const hierarchyValid = Boolean(root && nested && note &&
        nested.parentId === root.id && note.parentId === nested.id && note.content === 'import-ok');
      if (note) await store.remove(note.id);
      if (nested) await store.remove(nested.id);
      if (root) await store.remove(root.id);
      // A user folder nested inside a built-in Documents folder must export
      // portably even though built-in/system folders are omitted from the file.
      const portableParent = await store.createFolder('Portable Parent', 'folder-documents');
      const portableChild = await store.saveFile({
        name: 'Portable Child.md',
        parentId: portableParent.id,
        content: 'portable-export-marker'
      });
      const portableDocument = JSON.parse(await store.exportData());
      const exportedParent = portableDocument.entries.find((entry) => entry.id === portableParent.id);
      const exportedChild = portableDocument.entries.find((entry) => entry.id === portableChild.id);
      const exportParentNormalized = Boolean(exportedParent && exportedParent.parentId === 'root' &&
        exportedChild && exportedChild.parentId === portableParent.id);
      await store.importData(JSON.stringify(portableDocument));
      const afterPortableImport = await store.listAll();
      const importedChild = afterPortableImport.find((entry) =>
        entry.content === 'portable-export-marker' && entry.id !== portableChild.id);
      const importedParent = importedChild && afterPortableImport.find((entry) => entry.id === importedChild.parentId);
      const portableHierarchyValid = Boolean(importedChild && importedParent &&
        importedParent.id !== portableParent.id && importedParent.parentId === 'root');

      if (importedChild) await store.remove(importedChild.id);
      if (importedParent) await store.remove(importedParent.id);
      await store.remove(portableChild.id);
      await store.remove(portableParent.id);

      return {
        rejected,
        oversizedRejected,
        oversizedUnicodeRejected,
        baselineCount: baseline.length,
        afterInvalidCount: afterInvalid.length,
        validImportCount: validResult.imported,
        hierarchyValid,
        exportParentNormalized,
        portableHierarchyValid
      };
    });
    assert.equal(importValidation.oversizedRejected, true, 'oversized imports must reject before JSON parsing');
    assert.equal(importValidation.oversizedUnicodeRejected, true, 'UTF-8 byte size, not UTF-16 character count, must enforce the transfer ceiling');
    assert.deepEqual(importValidation.rejected, [true, true, true, true, true],
      'malformed imports should reject duplicates, cycles, missing/non-folder parents and non-text contents');
    assert.equal(importValidation.afterInvalidCount, importValidation.baselineCount,
      'invalid imports must not partially mutate storage');
    assert.equal(importValidation.validImportCount, 3);
    assert.equal(importValidation.hierarchyValid, true, 'valid nested folder relationships should survive ID remapping');
    assert.equal(importValidation.exportParentNormalized, true, 'export should rebase children of excluded built-in folders to its root');
    assert.equal(importValidation.portableHierarchyValid, true, 'export/import should preserve the user-created folder hierarchy');

    // Settings persist appearance; preference, layout, and user-data resets stay separate.
    await page.locator('#launcher-toggle').click();
    await page.locator('.launcher-item[data-app="settings"]').click();
    const settings = page.locator('.window[data-app-name="settings"]');
    await settings.waitFor({ state: 'visible' });
    const wallpaperArt = page.locator('.desktop-wallpaper .wallpaper-art');
    assert.equal(await wallpaperArt.evaluate((image) => image.complete && image.naturalWidth > 0), true,
      'the bundled Pixel-Flow wallpaper SVG should load locally');
    await settings.locator('#setting-wallpaper').selectOption('grid');
    await settings.locator('#setting-accent').selectOption('green');
    await settings.locator('#setting-motion').selectOption('reduced');
    await settings.locator('#setting-desktop-icons').uncheck();
    await page.waitForFunction(() => document.documentElement.dataset.accent === 'green' &&
      document.querySelector('.desktop-wallpaper')?.dataset.wallpaper === 'grid' &&
      document.documentElement.dataset.motion === 'reduced' &&
      document.querySelector('.desktop-icons')?.hidden === true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.body.classList.contains('desktop-ready'), { timeout: 6000 });
    assert.equal(await page.locator('html').getAttribute('data-accent'), 'green');
    assert.equal(await page.locator('.desktop-wallpaper').getAttribute('data-wallpaper'), 'grid');
    assert.equal(await wallpaperArt.evaluate((image) => getComputedStyle(image).display), 'none',
      'the SVG artwork should be hidden when Grid only is selected');
    assert.equal(await page.locator('html').getAttribute('data-motion'), 'reduced');
    assert.equal(await page.locator('.desktop-icons').evaluate((element) => element.hidden), true);

    // Reset preferences must not reset the separately persisted window geometry.
    await page.locator('#launcher-toggle').click();
    await page.locator('.launcher-item[data-app="settings"]').click();
    await settings.waitFor({ state: 'visible' });
    assert.equal(await settings.locator('#settings-wallpaper-preview').getAttribute('data-wallpaper'), 'grid',
      'Settings should reflect the persisted wallpaper after reload');
    await settings.locator('#settings-reset').click();
    await page.waitForFunction(() =>
      document.querySelector('.desktop-wallpaper')?.dataset.wallpaper === 'flow' &&
      document.querySelector('#settings-wallpaper-preview')?.dataset.wallpaper === 'flow');
    assert.notEqual(await wallpaperArt.evaluate((image) => getComputedStyle(image).display), 'none',
      'the SVG artwork should return when Pixel-Flow is restored');
    await page.waitForFunction(() => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      return document.documentElement.dataset.accent === 'yellow' &&
        document.querySelector('.desktop-wallpaper')?.dataset.wallpaper === 'flow' &&
        window.OSBioSettings.get().motion === 'system' &&
        document.documentElement.dataset.motion === (reduced ? 'reduced' : 'normal') &&
        document.querySelector('.desktop-icons')?.hidden === false;
    });
    assert.equal(await page.evaluate(() => window.OSBioSettings.get().desktopIcons), true);

    const layoutProjectWindow = page.locator('.window[data-app-name="projects"]');
    await page.locator('.taskbar-btn[data-app="projects"]').click();
    await layoutProjectWindow.waitFor({ state: 'visible' });
    const projectBeforeReset = await layoutProjectWindow.evaluate((element) => ({
      left: element.offsetLeft, top: element.offsetTop
    }));
    assert.ok(projectBeforeReset.left > 180 && projectBeforeReset.top > 80,
      'saved project geometry should survive resetting preferences: ' + JSON.stringify(projectBeforeReset));
    assert.ok(await page.evaluate(() => localStorage.getItem('osbio.window-layout.v1')) !== null,
      'reset preferences must not clear saved window geometry');

    await page.locator('.taskbar-btn[data-app="settings"]').click();
    await settings.locator('#settings-reset-layout').click();
    await page.waitForFunction((beforeLeft) => {
      const element = document.querySelector('.window[data-app-name="projects"]');
      return element && element.offsetLeft < beforeLeft - 50;
    }, projectBeforeReset.left);
    const projectAfterReset = await layoutProjectWindow.evaluate((element) => ({
      left: element.offsetLeft, top: element.offsetTop
    }));
    assert.ok(projectAfterReset.left < projectBeforeReset.left - 50 &&
      projectAfterReset.top < projectBeforeReset.top - 20,
      'reset layout should return open windows to the default cascade: ' +
        JSON.stringify({ projectBeforeReset, projectAfterReset }));
    assert.equal(await page.evaluate(() => localStorage.getItem('osbio.window-layout.v1')), null,
      'reset layout should clear saved geometry');

    const afterLayoutReset = await page.evaluate(async () => ({
      userFile: (await window.OSBioStorage.listAll()).some((entry) => entry.name === 'browser-smoke-renamed.md'),
      preferences: window.OSBioSettings.get(),
      savedLayout: localStorage.getItem('osbio.window-layout.v1')
    }));
    assert.equal(afterLayoutReset.userFile, true, 'reset layout must not remove user files');
    assert.deepEqual(afterLayoutReset.preferences, {
      wallpaper: 'flow', accent: 'yellow', motion: 'system', desktopIcons: true
    }, 'reset layout must not change preferences');
    assert.equal(afterLayoutReset.savedLayout, null);

    // Clearing user files is a separate confirmed action and keeps built-in documents.
    let clearDataMessage = '';
    page.once('dialog', (dialog) => { clearDataMessage = dialog.message(); void dialog.accept(); });
    await settings.locator('#settings-clear-data').click();
    assert.match(clearDataMessage, /Delete all user-created workspace files and folders/);
    await page.waitForFunction(async () =>
      !(await window.OSBioStorage.listAll()).some((entry) => !entry.system));
    assert.equal(await page.evaluate(async () => {
      const all = await window.OSBioStorage.listAll();
      return all.some((entry) => entry.id === 'file-system-notes' && entry.readOnly);
    }), true, 'clear user files must preserve built-in read-only documents');

    // System Monitor reports actual window and storage state rather than invented host metrics.
    await page.evaluate(() => window.WindowManager.closeAllWindows());
    await page.locator('#launcher-toggle').click();
    await page.locator('.launcher-item[data-app="system"]').click();
    const systemWindow = page.locator('.window[data-app-name="system"]');
    await systemWindow.waitFor({ state: 'visible' });
    await page.waitForFunction(() => document.querySelector('#monitor-window-count')?.textContent === '1 / 1' &&
      document.querySelector('#monitor-active-app')?.textContent === 'System Monitor');
    const systemFacts = await page.evaluate(async () => {
      const stats = await window.OSBioStorage.stats();
      return {
        files: document.querySelector('#monitor-file-count')?.textContent,
        folders: document.querySelector('#monitor-folder-count')?.textContent,
        chars: document.querySelector('#monitor-character-count')?.textContent,
        expectedFiles: String(stats.files),
        expectedFolders: String(stats.folders),
        expectedChars: Number(stats.contentCharacters).toLocaleString('en-US'),
        eventCount: document.querySelectorAll('#monitor-events li strong').length
      };
    });
    assert.equal(systemFacts.files, systemFacts.expectedFiles);
    assert.equal(systemFacts.folders, systemFacts.expectedFolders);
    assert.equal(systemFacts.chars, systemFacts.expectedChars);
    assert.ok(systemFacts.eventCount > 0, 'System Monitor must show actual in-tab events');
    await systemWindow.locator('.window-close').click();

    // Memory Match restart and close cancel pending mismatch timers.
    await page.locator('#launcher-toggle').click();
    await page.locator('.launcher-item[data-app="memory"]').click();
    const game = page.locator('.window[data-app-name="memory"]');
    await game.waitFor({ state: 'visible' });
    assert.equal(await game.locator('.card').count(), 16);
    const findMismatchIndices = () => game.locator('.card').evaluateAll((cards) => {
      const available = cards.map((card, index) => ({ card, index }))
        .filter(({ card }) => !card.classList.contains('matched'));
      for (let i = 0; i < available.length; i += 1) {
        for (let j = i + 1; j < available.length; j += 1) {
          if (available[i].card.dataset.symbol !== available[j].card.dataset.symbol) {
            return [available[i].index, available[j].index];
          }
        }
      }
      return [];
    });
    const firstMismatch = await findMismatchIndices();
    assert.equal(firstMismatch.length, 2);
    await game.locator('.card').nth(firstMismatch[0]).click();
    await game.locator('.card').nth(firstMismatch[1]).click();
    await page.waitForFunction(() => document.querySelector('#game-message')?.textContent.includes('No match'));
    await game.locator('#restart-btn').click();
    assert.equal(await game.locator('#move-count').textContent(), '0');
    assert.equal(await game.locator('#pair-count').textContent(), '0');
    await pause(850);
    assert.match(await game.locator('#game-message').textContent(), /Select two cards/,
      'a stale mismatch timer must not overwrite the restarted round');

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

    const closingMismatch = await findMismatchIndices();
    await game.locator('.card').nth(closingMismatch[0]).click();
    await game.locator('.card').nth(closingMismatch[1]).click();
    await page.waitForFunction(() => document.querySelector('#game-message')?.textContent.includes('No match'));
    await game.locator('.window-close').click();
    await game.waitFor({ state: 'detached' });
    await pause(850);
    await page.locator('.taskbar-btn[data-app="memory"]').click();
    const reopenedGame = page.locator('.window[data-app-name="memory"]');
    await reopenedGame.waitFor({ state: 'visible' });
    assert.equal(await reopenedGame.locator('.card').count(), 16);
    assert.match(await reopenedGame.locator('#game-message').textContent(), /Select two cards/,
      'closing a game must dispose its pending turn timer before reopening');

    // Narrow view uses a single-window workspace, with app switching and close recovery.
    await page.evaluate(() => window.WindowManager.closeAllWindows());
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.locator('.desktop-icons').evaluate((el) => getComputedStyle(el).display), 'none');
    await page.locator('#launcher-toggle').click();
    await page.locator('.launcher-item[data-app="files"]').click();
    const mobileFiles = page.locator('.window[data-app-name="files"]');
    await mobileFiles.waitFor({ state: 'visible' });
    assert.equal(await mobileFiles.evaluate((el) => getComputedStyle(el).borderRadius), '0px');
    await page.locator('.taskbar-btn[data-app="memory"]').click();
    const mobileGame = page.locator('.window[data-app-name="memory"]');
    await mobileGame.waitFor({ state: 'visible' });
    assert.equal(await mobileGame.evaluate((el) => el.classList.contains('active')), true);
    assert.equal(await mobileFiles.evaluate((el) => el.classList.contains('active')), false);
    assert.equal(await page.locator('.window.active').count(), 1);
    await page.locator('.taskbar-btn[data-app="files"]').click();
    assert.equal(await mobileFiles.evaluate((el) => el.classList.contains('active')), true,
      'taskbar should switch back to an existing app in mobile mode');
    await mobileFiles.locator('.window-close').click();
    await mobileFiles.waitFor({ state: 'detached' });
    assert.equal(await mobileGame.evaluate((el) => el.classList.contains('active')), true,
      'closing the current mobile app should return to the next visible app');
    await mobileGame.locator('.window-close').click();
    await mobileGame.waitFor({ state: 'detached' });
    assert.equal(await page.evaluate(() => window.WindowManager.getSnapshot().activeWindowId), null);
    assert.match(await page.locator('#active-app-label').textContent(), /WORKSPACE \/ DESKTOP/);

    // IndexedDB fallback remains persistent when localStorage is available.
    const fallbackPage = await browser.newPage({ viewport: { width: 960, height: 720 } });
    await fallbackPage.addInitScript(() => {
      Object.defineProperty(window, 'indexedDB', { configurable: true, value: undefined });
    });
    await fallbackPage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await fallbackPage.waitForFunction(async () => {
      if (!window.OSBioStorage) return false;
      const result = await window.OSBioStorage.ready();
      return result.mode !== 'starting';
    });
    assert.equal(await fallbackPage.evaluate(() => window.OSBioStorage.getMode()), 'localStorage');
    await fallbackPage.evaluate(async () => {
      await window.OSBioStorage.saveFile({ name: 'fallback-smoke.md', content: 'localStorage fallback' });
    });
    await fallbackPage.reload({ waitUntil: 'domcontentloaded' });
    await fallbackPage.waitForFunction(async () => {
      if (!window.OSBioStorage) return false;
      await window.OSBioStorage.ready();
      return (await window.OSBioStorage.listAll()).some((entry) => entry.name === 'fallback-smoke.md');
    });
    assert.equal(await fallbackPage.evaluate(() => window.OSBioStorage.getMode()), 'localStorage');
    await fallbackPage.close();

    // If storage writes fail, the application uses memory and does not claim cross-reload persistence.
    const memoryPage = await browser.newPage({ viewport: { width: 960, height: 720 } });
    await memoryPage.addInitScript(() => {
      Object.defineProperty(window, 'indexedDB', { configurable: true, value: undefined });
      Storage.prototype.setItem = function () { throw new DOMException('Storage denied', 'QuotaExceededError'); };
    });
    await memoryPage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await memoryPage.waitForFunction(async () => {
      if (!window.OSBioStorage) return false;
      const result = await window.OSBioStorage.ready();
      return result.mode !== 'starting';
    });
    assert.equal(await memoryPage.evaluate(() => window.OSBioStorage.getMode()), 'memory');
    const temporaryId = await memoryPage.evaluate(async () => {
      const item = await window.OSBioStorage.saveFile({ name: 'session-only-smoke.md', content: 'temporary' });
      return item.id;
    });
    assert.ok(temporaryId);
    await memoryPage.reload({ waitUntil: 'domcontentloaded' });
    await memoryPage.waitForFunction(async () => {
      if (!window.OSBioStorage) return false;
      await window.OSBioStorage.ready();
      return window.OSBioStorage.getMode() === 'memory';
    });
    assert.equal(await memoryPage.evaluate(async (id) => window.OSBioStorage.get(id), temporaryId), null,
      'memory fallback should not claim a user file survives reload');
    await memoryPage.close();

    assert.deepEqual(pageErrors, [], 'no uncaught browser JavaScript errors');
    assert.deepEqual(externalFontRequests, [], 'no external font service requests should be made');
    console.log('Browser smoke passed: local fonts, tiered launcher, recent-app taskbar, project detail, overview, persistence, settings, Memory Match, and mobile layout.');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
