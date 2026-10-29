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
    assert.equal(await page.evaluate(() => window.WindowManager.getSnapshot().windows.length), 0,
      'a fresh page load must begin with the empty desktop');
    await page.evaluate(() => localStorage.setItem('osbio.window-layout.v1', '{ malformed layout'));

    // Launcher search opens a real app template.
    await page.locator('#launcher-toggle').click();
    await page.locator('#app-search').fill('Flow Monitor');
    await page.locator('.launcher-item[data-app="flow"]').click();
    const flowWindow = page.locator('.window[data-app-name="flow"]');
    await flowWindow.waitFor({ state: 'visible' });
    assert.equal(await page.locator('.window.active').count(), 1, 'exactly one window should be active after launch');
    assert.ok(await flowWindow.evaluate((element) => element.offsetLeft >= 116), 'new windows should not cover the desktop shortcut lane');
    await page.locator('#flow-event-list').waitFor({ state: 'visible' });
    const flowTaskbarButton = page.locator('.taskbar-btn[data-app="flow"]');
    await flowTaskbarButton.waitFor({ state: 'visible' });

    // The launcher shortcut returns focus to the prior control when dismissed with Escape.
    await page.keyboard.press('Control+k');
    await page.locator('#app-search').waitFor({ state: 'visible' });
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
    assert.ok(await projectWindow.locator('.project-status').count() >= 3);
    assert.equal(await projectWindow.evaluate((element) => element.classList.contains('active')), true);
    assert.equal(await page.locator('.window.active').count(), 1, 'opening another app must not leave two active windows');

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
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.body.classList.contains('desktop-ready'), { timeout: 6000 });
    assert.equal(await page.evaluate(() => window.WindowManager.getSnapshot().windows.length), 0,
      'saved geometry must not auto-open windows after reload');
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

    // Memory Match restart and close cancel pending mismatch timers.
    await page.locator('#launcher-toggle').click();
    await page.locator('#app-search').fill('Memory Match');
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
    await page.locator('#app-search').fill('Files');
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
    console.log('Browser smoke passed: launcher, overview, shared projects, file persistence, settings, Memory Match, mobile layout.');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
