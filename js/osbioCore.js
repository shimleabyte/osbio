/* OSBio local-first storage and event history. No host OS access. */
(function (global) {
  'use strict';

  const DB_NAME = 'osbio-workspace';
  const DB_VERSION = 1;
  const STORE_NAME = 'entries';
  const FALLBACK_KEY = 'osbio.workspace.entries.v1';
  const EVENT_LIMIT = 160;
  const MAX_IMPORT_ENTRIES = 500;
  const MAX_IMPORT_BYTES = 12 * 1024 * 1024;
  const MAX_TEXT_LENGTH = 2 * 1024 * 1024;
  let database = null;
  let mode = 'starting';
  let fallbackEntries = [];
  let writeQueue = Promise.resolve();
  let readyPromise = null;
  const eventHistory = [];
  const eventSubscribers = new Set();

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function randomId(prefix) {
    const random = global.crypto && typeof global.crypto.randomUUID === 'function'
      ? global.crypto.randomUUID()
      : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    return prefix + '-' + random;
  }

  function emit(type, detail = {}) {
    global.dispatchEvent(new CustomEvent('osbio:event', {
      detail: { type, timestamp: new Date().toISOString(), ...detail }
    }));
  }

  function captureEvent(event) {
    const detail = event && event.detail ? clone(event.detail) : null;
    if (!detail || typeof detail.type !== 'string') return;
    eventHistory.unshift(detail);
    if (eventHistory.length > EVENT_LIMIT) eventHistory.length = EVENT_LIMIT;
    eventSubscribers.forEach((subscriber) => {
      try { subscriber(clone(detail)); } catch (error) { console.error('OSBio event subscriber failed', error); }
    });
  }
  global.addEventListener('osbio:event', captureEvent);

  function readFallback() {
    try {
      const raw = global.localStorage.getItem(FALLBACK_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) throw new Error('Stored workspace data is not a list.');
      fallbackEntries = parsed;
      mode = 'localStorage';
    } catch (error) {
      fallbackEntries = [];
      mode = 'memory';
      emit('storage.degraded', { mode, reason: 'Stored browser data could not be read.' });
    }
  }

  function openDatabase() {
    return new Promise((resolve) => {
      if (!global.indexedDB) {
        readFallback();
        return resolve();
      }

      let request;
      try {
        request = global.indexedDB.open(DB_NAME, DB_VERSION);
      } catch (error) {
        readFallback();
        emit('storage.degraded', { mode, reason: 'IndexedDB could not be opened.' });
        return resolve();
      }

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('parentId', 'parentId', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
      };
      request.onsuccess = () => {
        database = request.result;
        database.onversionchange = () => {
          database.close();
          database = null;
          mode = 'unavailable';
          emit('storage.degraded', { mode, reason: 'Workspace storage changed in another tab; reload this tab.' });
        };
        mode = 'indexeddb';
        resolve();
      };
      request.onerror = () => {
        readFallback();
        emit('storage.degraded', { mode, reason: 'IndexedDB failed to open; using browser fallback storage.' });
        resolve();
      };
      request.onblocked = () => {
        emit('storage.degraded', { mode: 'starting', reason: 'Another tab is blocking a workspace storage upgrade.' });
      };
    });
  }

  function readAllRaw() {
    if (mode !== 'indexeddb' || !database) return Promise.resolve(clone(fallbackEntries));
    return new Promise((resolve, reject) => {
      let transaction;
      try { transaction = database.transaction(STORE_NAME, 'readonly'); }
      catch (error) { reject(error); return; }
      const request = transaction.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error || new Error('Could not read workspace data.'));
    });
  }

  function writeAllRaw(entries) {
    if (mode === 'unavailable') return Promise.reject(new Error('Workspace storage is unavailable. Reload the desktop and try again.'));
    if (mode !== 'indexeddb' || !database) {
      const next = clone(entries);
      if (mode === 'localStorage') {
        try {
          global.localStorage.setItem(FALLBACK_KEY, JSON.stringify(next));
        } catch (error) {
          mode = 'memory';
          fallbackEntries = next;
          emit('storage.degraded', { mode, reason: 'Browser storage quota or permissions prevented saving; changes are temporary.' });
          return Promise.resolve();
        }
      }
      fallbackEntries = next;
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      let transaction;
      try { transaction = database.transaction(STORE_NAME, 'readwrite'); }
      catch (error) { reject(error); return; }
      const store = transaction.objectStore(STORE_NAME);
      store.clear();
      entries.forEach((entry) => store.put(entry));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Could not save workspace data.'));
      transaction.onabort = () => reject(transaction.error || new Error('Workspace save was aborted.'));
    });
  }

  const builtInEntries = () => {
    const now = new Date().toISOString();
    return [
      { id: 'folder-documents', name: 'Documents', type: 'folder', parentId: 'root', content: '', createdAt: now, updatedAt: now, readOnly: true, system: true },
      { id: 'folder-projects', name: 'Projects', type: 'folder', parentId: 'root', content: '', createdAt: now, updatedAt: now, readOnly: true, system: true },
      { id: 'file-welcome', name: 'Welcome.md', type: 'file', parentId: 'folder-documents', content: '# OSBio workspace\n\nThis browser workspace stores user-created notes locally. It does not access your host file system.\n\nCreate a text file from Files to save your own notes. Built-in documents are read-only; use Save Copy to make an editable version.\n', createdAt: now, updatedAt: now, readOnly: true, system: true },
      { id: 'file-system-notes', name: 'System Notes.md', type: 'file', parentId: 'folder-documents', content: '# OSBio system notes\\n\\nOSBio is a browser desktop simulation, not a native operating system. It does not run host shell commands or read and write your computer file system.\\n\\n## Window and keyboard controls\\n- Ctrl/Cmd+K opens the application launcher.\\n- Ctrl+Alt+W opens the window overview; Escape dismisses it.\\n- Alt+F4 closes the active app window.\\n- Use title-bar controls to minimize, maximize/restore or close an app. Drag a title bar to move a desktop window; drag to an edge to snap it.\\n- In Files: Enter opens a selected item, F2 renames, Delete removes after confirmation, Ctrl/Cmd+N creates a text file, Ctrl/Cmd+Shift+N creates a folder, Ctrl/Cmd+Shift+M moves, and Alt+Up navigates to the parent folder.\\n- In Editor: Ctrl/Cmd+S saves; Ctrl/Cmd+Shift+S saves a copy. Closing a dirty document offers Save, Discard and Keep editing.\\n\\n## Local workspace data\\n- User-created files and folders stay in this browser profile. They do not sync across browsers or devices.\\n- IndexedDB is the primary virtual filesystem. Browser fallback may use localStorage or temporary memory; memory-mode changes do not survive a reload.\\n- Built-in documents are read-only. Use Save Copy to edit one. Workspace export includes user-created content, not built-in documents.\\n- Imports are limited to 12 MiB UTF-8, 500 items, and 2 MiB characters per text file; malformed IDs and invalid or cyclic folder relationships are rejected.\\n\\n## System Monitor\\nSystem Monitor reports OSBio window state, virtual file counts and this-tab event history. It does not expose actual host CPU, memory, battery, network or process metrics.\\n', createdAt: now, updatedAt: now, readOnly: true, system: true },
      { id: 'file-project-index', name: 'Project Index.md', type: 'file', parentId: 'folder-projects', content: '# Project Index\n\n- [Mutabaah CLI](https://github.com/shimleabyte/mutabaah-cli) — Go CLI for activity tracking.\n- [Simpul](https://github.com/shimleabyte/simpul) — order and payment workflow backend concept.\n- [Optical Anchor Button](https://github.com/shimleabyte/optical-anchor-button) — pointer-driven interaction component.\n- [OSBio](https://github.com/shimleabyte/osbio) — this browser desktop environment.\n', createdAt: now, updatedAt: now, readOnly: true, system: true }
    ];
  };

  async function initialize() {
    await openDatabase();
    let entries;
    try {
      entries = await readAllRaw();
    } catch (error) {
      readFallback();
      entries = await readAllRaw();
    }
    const defaults = builtInEntries();
    if (!entries.length) {
      await writeAllRaw(defaults);
      entries = await readAllRaw();
    } else {
      // Add newly introduced built-in documents to old workspaces without replacing
      // or resetting any existing user-created content.
      const existingIds = new Set(entries.map((entry) => entry.id));
      const missingBuiltIns = defaults.filter((entry) => entry.system && !existingIds.has(entry.id));
      if (missingBuiltIns.length) {
        await writeAllRaw(entries.concat(missingBuiltIns));
        entries = await readAllRaw();
        emit('storage.migrated', { addedBuiltIns: missingBuiltIns.map((entry) => entry.id) });
      }
    }
    emit('storage.ready', { mode, entryCount: entries.length });
    return { mode, entryCount: entries.length };
  }

  function ready() {
    if (!readyPromise) readyPromise = initialize().catch((error) => {
      mode = 'unavailable';
      emit('storage.error', { mode, reason: 'Workspace storage failed to initialize.' });
      return { mode, entryCount: 0, error: String(error.message || error) };
    });
    return readyPromise;
  }

  async function listAll() {
    await ready();
    await writeQueue;
    const entries = await readAllRaw();
    return entries.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    }).map(clone);
  }

  async function get(id) {
    return (await listAll()).find((entry) => entry.id === id) || null;
  }

  async function list(parentId = 'root') {
    return (await listAll()).filter((entry) => entry.parentId === parentId);
  }

  function validateName(name) {
    const cleaned = String(name == null ? '' : name).trim();
    if (!cleaned || cleaned.length > 120 || /[\\/\\0]/.test(cleaned) || cleaned === '.' || cleaned === '..') {
      throw new Error('Name must be 1–120 characters and cannot contain slashes.');
    }
    return cleaned;
  }

  function validateParent(entries, parentId) {
    if (parentId === 'root') return;
    const parent = entries.find((entry) => entry.id === parentId);
    if (!parent || parent.type !== 'folder') throw new Error('Destination folder no longer exists.');
  }

  function assertUniqueName(entries, parentId, name, excludeId = null) {
    const exists = entries.some((entry) => entry.parentId === parentId && entry.id !== excludeId &&
      entry.name.toLocaleLowerCase() === name.toLocaleLowerCase());
    if (exists) throw new Error('An item with that name already exists in this folder.');
  }

  function commit(mutator) {
    const operation = writeQueue.then(async () => {
      await ready();
      const entries = await readAllRaw();
      const outcome = mutator(entries);
      if (outcome.changed) await writeAllRaw(entries);
      if (outcome.event) emit(outcome.event.type, outcome.event.detail || {});
      return clone(outcome.value);
    });
    writeQueue = operation.then(() => undefined, () => undefined);
    return operation;
  }

  function createFolder(name, parentId = 'root') {
    return commit((entries) => {
      const cleaned = validateName(name);
      validateParent(entries, parentId);
      assertUniqueName(entries, parentId, cleaned);
      const now = new Date().toISOString();
      const entry = { id: randomId('folder'), name: cleaned, type: 'folder', parentId, content: '', createdAt: now, updatedAt: now, readOnly: false, system: false };
      entries.push(entry);
      return { changed: true, value: entry, event: { type: 'folder.created', detail: { entryId: entry.id, name: entry.name, parentId } } };
    });
  }

  function saveFile({ id = null, name, parentId = 'root', content = '' } = {}) {
    return commit((entries) => {
      const cleaned = validateName(name);
      const text = String(content);
      if (text.length > MAX_TEXT_LENGTH) throw new Error('This text file exceeds the 2 MB character limit.');
      validateParent(entries, parentId);
      const existing = id ? entries.find((entry) => entry.id === id) : null;
      if (id && !existing) throw new Error('This file no longer exists.');
      if (existing && (existing.type !== 'file' || existing.readOnly)) throw new Error('This document is read-only. Use Save Copy.');
      assertUniqueName(entries, parentId, cleaned, id);
      const now = new Date().toISOString();
      if (existing) {
        existing.name = cleaned;
        existing.content = text;
        existing.parentId = parentId;
        existing.updatedAt = now;
        return { changed: true, value: existing, event: { type: 'file.saved', detail: { entryId: existing.id, name: existing.name, characters: text.length } } };
      }
      const entry = { id: randomId('file'), name: cleaned, type: 'file', parentId, content: text, createdAt: now, updatedAt: now, readOnly: false, system: false };
      entries.push(entry);
      return { changed: true, value: entry, event: { type: 'file.created', detail: { entryId: entry.id, name: entry.name, parentId, characters: text.length } } };
    });
  }

  function rename(id, newName) {
    return commit((entries) => {
      const entry = entries.find((item) => item.id === id);
      if (!entry) throw new Error('This item no longer exists.');
      if (entry.readOnly || entry.system) throw new Error('Built-in workspace items cannot be renamed.');
      const cleaned = validateName(newName);
      assertUniqueName(entries, entry.parentId, cleaned, entry.id);
      entry.name = cleaned;
      entry.updatedAt = new Date().toISOString();
      return { changed: true, value: entry, event: { type: entry.type + '.renamed', detail: { entryId: entry.id, name: entry.name } } };
    });
  }

  function move(id, newParentId) {
    return commit((entries) => {
      const entry = entries.find((item) => item.id === id);
      if (!entry) throw new Error('This item no longer exists.');
      if (entry.readOnly || entry.system) throw new Error('Built-in workspace items cannot be moved.');
      validateParent(entries, newParentId);
      if (entry.type === 'folder') {
        let ancestorId = newParentId;
        while (ancestorId !== 'root') {
          if (ancestorId === id) throw new Error('A folder cannot be moved inside itself.');
          const ancestor = entries.find((item) => item.id === ancestorId);
          if (!ancestor || ancestor.type !== 'folder') break;
          ancestorId = ancestor.parentId;
        }
      }
      assertUniqueName(entries, newParentId, entry.name, entry.id);
      entry.parentId = newParentId;
      entry.updatedAt = new Date().toISOString();
      return { changed: true, value: entry, event: { type: entry.type + '.moved', detail: { entryId: entry.id, name: entry.name, parentId: newParentId } } };
    });
  }

  function remove(id) {
    return commit((entries) => {
      const index = entries.findIndex((entry) => entry.id === id);
      if (index < 0) throw new Error('This item no longer exists.');
      const entry = entries[index];
      if (entry.readOnly || entry.system) throw new Error('Built-in workspace items cannot be deleted.');
      if (entry.type === 'folder' && entries.some((item) => item.parentId === id)) {
        throw new Error('This folder is not empty. Move or delete its contents first.');
      }
      entries.splice(index, 1);
      return { changed: true, value: entry, event: { type: entry.type + '.deleted', detail: { entryId: entry.id, name: entry.name } } };
    });
  }

  async function stats() {
    const entries = await listAll();
    const userEntries = entries.filter((entry) => !entry.system);
    const contentCharacters = entries.reduce((total, entry) => total + (entry.content || '').length, 0);
    return {
      mode,
      entries: entries.length,
      files: entries.filter((entry) => entry.type === 'file').length,
      folders: entries.filter((entry) => entry.type === 'folder').length,
      userEntries: userEntries.length,
      contentCharacters
    };
  }

  async function exportData() {
    const all = await listAll();
    const userEntries = all.filter((entry) => !entry.system);
    const userIds = new Set(userEntries.map((entry) => entry.id));
    // Built-in folders are intentionally excluded from exports. Rebase direct
    // user children of those folders to the exported root while preserving
    // parent links between user-created folders/files.
    const entries = userEntries.map((entry) => ({
      ...entry,
      parentId: userIds.has(entry.parentId) ? entry.parentId : 'root'
    }));
    const serialized = JSON.stringify({ format: 'osbio-workspace-export-v1', exportedAt: new Date().toISOString(), entries }, null, 2);
    if (new Blob([serialized]).size > MAX_IMPORT_BYTES) {
      throw new Error('Workspace export exceeds the 12 MB transfer limit. Remove or split large files, then export again.');
    }
    return serialized;
  }

  async function importData(serialized) {
    if (typeof serialized !== 'string') throw new Error('Import content must be text.');
    if (serialized.length > MAX_IMPORT_BYTES || new Blob([serialized]).size > MAX_IMPORT_BYTES) {
      throw new Error('Import exceeds the 12 MB transfer limit. Split the export into smaller workspace files and try again.');
    }
    let parsed;
    try { parsed = JSON.parse(serialized); } catch { throw new Error('Import file is not valid JSON.'); }
    if (!parsed || parsed.format !== 'osbio-workspace-export-v1' || !Array.isArray(parsed.entries)) {
      throw new Error('This is not a supported OSBio workspace export.');
    }
    if (parsed.entries.length > MAX_IMPORT_ENTRIES) throw new Error('Import is limited to 500 items per file.');
    const entries = parsed.entries;
    const sourceById = new Map();
    for (const raw of entries) {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw) ||
          typeof raw.id !== 'string' || !raw.id.trim() || raw.id.length > 180) {
        throw new Error('Import contains an invalid item ID.');
      }
      if (sourceById.has(raw.id)) throw new Error('Import contains duplicate item IDs.');
      if (!['file', 'folder'].includes(raw.type)) throw new Error('Import contains an unsupported item type.');
      const name = validateName(raw.name);
      if (raw.type === 'file') {
        if (raw.content !== undefined && typeof raw.content !== 'string') {
          throw new Error('Imported file contents must be text.');
        }
        if ((raw.content || '').length > MAX_TEXT_LENGTH) throw new Error('An imported text file exceeds the 2 MB character limit.');
      }
      sourceById.set(raw.id, { raw, name });
    }

    // Validate parent references before assigning imported IDs.
    for (const [id, item] of sourceById) {
      const parentId = item.raw.parentId;
      if (parentId === 'root') continue;
      if (typeof parentId !== 'string' || !sourceById.has(parentId)) {
        throw new Error('Import contains a missing parent folder.');
      }
      if (sourceById.get(parentId).raw.type !== 'folder') {
        throw new Error('Imported items must belong to a folder or the workspace root.');
      }
      if (parentId === id) throw new Error('An item cannot be its own parent.');
    }

    // Reject cycles before any write enters the storage queue.
    for (const id of sourceById.keys()) {
      const visited = new Set();
      let cursor = id;
      while (cursor !== 'root') {
        if (visited.has(cursor)) throw new Error('Import contains a cyclic folder structure.');
        visited.add(cursor);
        const item = sourceById.get(cursor);
        if (!item) throw new Error('Import contains a missing parent folder.');
        cursor = item.raw.parentId;
      }
    }

    const mapping = new Map([...sourceById].map(([id, item]) => [
      id, randomId(item.raw.type === 'folder' ? 'folder' : 'file')
    ]));
    const prepared = [];
    for (const [id, item] of sourceById) {
      const raw = item.raw;
      prepared.push({
        id: mapping.get(id),
        name: item.name,
        type: raw.type,
        parentId: raw.parentId === 'root' ? 'root' : mapping.get(raw.parentId),
        content: raw.type === 'file' ? (raw.content || '') : '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        readOnly: false,
        system: false
      });
    }
    return commit((current) => {
      prepared.forEach((entry) => {
        const parent = entry.parentId === 'root' ? null : [...current, ...prepared].find((item) => item.id === entry.parentId);
        if (entry.parentId !== 'root' && (!parent || parent.type !== 'folder')) {
          throw new Error('Import parent structure changed during validation.');
        }
        let name = entry.name;
        let suffix = 2;
        while (current.some((item) => item.parentId === entry.parentId && item.name.toLowerCase() === name.toLowerCase()) ||
               prepared.some((other) => other !== entry && other.id !== entry.id && other.parentId === entry.parentId && other.name.toLowerCase() === name.toLowerCase())) {
          name = entry.name + ' (' + suffix++ + ')';
        }
        entry.name = name;
        current.push(entry);
      });
      return { changed: prepared.length > 0, value: { imported: prepared.length }, event: { type: 'storage.imported', detail: { count: prepared.length } } };
    });
  }

  function clearUserData() {
    return commit((entries) => {
      const kept = entries.filter((entry) => entry.system);
      entries.splice(0, entries.length, ...kept);
      return { changed: true, value: { removed: true }, event: { type: 'storage.user-data-cleared', detail: {} } };
    });
  }

  const Events = {
    emit,
    subscribe(callback) {
      eventSubscribers.add(callback);
      return () => eventSubscribers.delete(callback);
    },
    recent(limit = 100) { return eventHistory.slice(0, Math.max(0, limit)).map(clone); },
    clearHistory() { eventHistory.length = 0; eventSubscribers.forEach((subscriber) => { try { subscriber(null); } catch {} }); }
  };

  global.OSBioEvents = Events;
  global.OSBioStorage = {
    ready, get, list, listAll, createFolder, saveFile, rename, move, remove, stats,
    exportData, importData, clearUserData,
    getMode: () => mode,
    getLimits: () => ({ maxTextCharacters: MAX_TEXT_LENGTH, maxImportEntries: MAX_IMPORT_ENTRIES, maxImportBytes: MAX_IMPORT_BYTES })
  };
  global.OSBioWorkspace = {
    openFile(id) {
      if (!id || !global.WindowManager) return false;
      // Window creation and app mounting are synchronous. Dispatch only after the
      // Editor has mounted so the same contract works for new and existing windows.
      global.WindowManager.openWindow('editor');
      const editorWindow = document.querySelector('.window[data-app-name="editor"]');
      if (!editorWindow) return false;
      const request = new CustomEvent('osbio:open-file', { detail: { id }, cancelable: true });
      global.dispatchEvent(request);
      return !request.defaultPrevented;
    }
  };

  ready();
})(window);
