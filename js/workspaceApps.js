(function (global) {
  'use strict';
  const emit = (type, detail = {}) => global.dispatchEvent(new CustomEvent('osbio:event', { detail: { type, timestamp: new Date().toISOString(), ...detail } }));
  const status = (node, message, error = false) => { node.textContent = message; node.classList.toggle('is-error', error); };

  function mountFiles(win) {
    const store = global.OSBioStorage, list = win.querySelector('.files-list'), empty = win.querySelector('.files-empty');
    const state = win.querySelector('.files-status'), crumbs = win.querySelector('.files-breadcrumbs');
    const app = win.querySelector('.files-app'), contextMenu = win.querySelector('.files-context-menu');
    const moveDialog = win.querySelector('.files-move-dialog'), moveForm = win.querySelector('.files-move-form');
    const moveDestination = win.querySelector('#files-move-destination'), moveError = win.querySelector('.files-move-error');
    const dialog = win.querySelector('.files-name-dialog'), form = win.querySelector('.files-name-form');
    const input = win.querySelector('#files-name-input'), errorNode = win.querySelector('.files-dialog-error');
    const importInput = win.querySelector('.files-import-input');
    let parent = 'root', selected = null, entries = [], action = 'new-file', renameId = null;
    let contextItemId = null, movingItemId = null, refreshRequest = 0;
    const picked = () => entries.find((item) => item.id === selected) || null;
    const setActions = () => {
      const item = picked();
      const disabled = {
        open: !item, rename: !item || item.readOnly || item.system,
        delete: !item || item.readOnly || item.system,
        move: !item || item.readOnly || item.system,
        up: parent === 'root'
      };
      Object.entries(disabled).forEach(([name, isDisabled]) => {
        const button = win.querySelector('[data-files-action="' + name + '"]');
        if (button) button.disabled = isDisabled;
      });
    };
    function syncSelection() {
      list.querySelectorAll('.file-row').forEach((row) => {
        const isSelected = row.dataset.id === selected;
        row.classList.toggle('is-selected', isSelected);
        row.setAttribute('aria-pressed', String(isSelected));
      });
      setActions();
    }
    function closeContextMenu(restoreFocus = false) {
      if (contextMenu.hidden) return;
      contextMenu.hidden = true;
      const previousId = contextItemId;
      contextItemId = null;
      if (restoreFocus) {
        const row = [...list.querySelectorAll('.file-row')].find((item) => item.dataset.id === (previousId || selected));
        if (row) row.focus({ preventScroll: true });
      }
    }
    function showContextMenu(item, row, clientX = null, clientY = null) {
      if (!item) return;
      selected = item.id;
      contextItemId = item.id;
      syncSelection();
      const restricted = Boolean(item.readOnly || item.system);
      contextMenu.querySelectorAll('[data-context-action]').forEach((button) => {
        const name = button.dataset.contextAction;
        button.disabled = restricted && ['rename', 'move', 'delete'].includes(name);
      });
      contextMenu.hidden = false;
      const appRect = app.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();
      const x = Number.isFinite(clientX) ? clientX : rowRect.left + 10;
      const y = Number.isFinite(clientY) ? clientY : rowRect.bottom;
      const maxLeft = Math.max(6, appRect.width - contextMenu.offsetWidth - 6);
      const maxTop = Math.max(6, appRect.height - contextMenu.offsetHeight - 6);
      contextMenu.style.left = Math.max(6, Math.min(x - appRect.left, maxLeft)) + 'px';
      contextMenu.style.top = Math.max(6, Math.min(y - appRect.top, maxTop)) + 'px';
      contextMenu.querySelector('button:not(:disabled)')?.focus({ preventScroll: true });
      emit('files.context-menu-opened', { entryId: item.id, name: item.name });
    }
    function closeMoveDialog(restoreFocus = true) {
      moveDialog.hidden = true;
      moveError.textContent = '';
      movingItemId = null;
      if (restoreFocus) {
        const row = [...list.querySelectorAll('.file-row')].find((item) => item.dataset.id === selected);
        if (row) row.focus({ preventScroll: true });
      }
    }
    async function showMoveDialog(item) {
      if (!item || item.readOnly || item.system) return;
      closeContextMenu(false);
      moveError.textContent = '';
      movingItemId = item.id;
      try {
        const all = await store.listAll();
        const byId = new Map(all.map((entry) => [entry.id, entry]));
        const isInsideMovingFolder = (candidateId) => {
          if (item.type !== 'folder') return false;
          let cursor = byId.get(candidateId), guard = 0;
          while (cursor && guard++ <= all.length) {
            if (cursor.id === item.id) return true;
            cursor = cursor.parentId === 'root' ? null : byId.get(cursor.parentId);
          }
          return false;
        };
        moveDestination.replaceChildren();
        const rootOption = document.createElement('option');
        rootOption.value = 'root';
        rootOption.textContent = 'Workspace';
        moveDestination.appendChild(rootOption);
        all.filter((entry) => entry.type === 'folder' && !isInsideMovingFolder(entry.id))
          .sort((a, b) => a.name.localeCompare(b.name))
          .forEach((folder) => {
            const path = [folder.name];
            let cursor = folder, guard = 0;
            while (cursor.parentId !== 'root' && guard++ <= all.length) {
              cursor = byId.get(cursor.parentId);
              if (!cursor) break;
              path.unshift(cursor.name);
            }
            const option = document.createElement('option');
            option.value = folder.id;
            option.textContent = path.join(' / ');
            moveDestination.appendChild(option);
          });
        moveDestination.value = item.parentId;
        if (![...moveDestination.options].some((option) => option.value === item.parentId)) moveDestination.value = 'root';
        moveDialog.hidden = false;
        moveDestination.focus({ preventScroll: true });
      } catch (error) {
        moveError.textContent = error.message || 'Could not load destination folders.';
      }
    }
    function renderRows() {
      closeContextMenu(false);
      list.replaceChildren();
      entries.forEach((item) => {
        const row = document.createElement('button'); row.type = 'button'; row.className = 'file-row';
        row.dataset.id = item.id; row.setAttribute('aria-pressed', String(selected === item.id));
        row.setAttribute('aria-haspopup', 'menu'); row.setAttribute('aria-controls', 'files-context-menu');
        if (selected === item.id) row.classList.add('is-selected');
        const type = document.createElement('span'); type.className = 'file-row-type'; type.textContent = item.type === 'folder' ? 'DIR' : 'TXT';
        const name = document.createElement('span'); name.className = 'file-row-name'; name.textContent = item.name;
        const tag = document.createElement('span'); tag.className = 'file-row-state'; tag.textContent = item.readOnly ? 'BUILT-IN' : 'LOCAL';
        row.append(type, name, tag);
        row.addEventListener('click', (event) => {
          selected = item.id;
          syncSelection();
          if (event.detail === 0) open(item);
        });
        row.addEventListener('dblclick', () => open(item));
        list.appendChild(row);
      });
      empty.hidden = entries.length > 0;
      empty.textContent = 'This folder is empty. Create a file or folder to begin.';
      setActions();
    }
    function renderCrumbs(all) {
      crumbs.replaceChildren();
      const root = document.createElement('button'); root.type = 'button'; root.dataset.filesParent = 'root'; root.textContent = 'Workspace'; crumbs.appendChild(root);
      const map = new Map(all.map((item) => [item.id, item])), chain = [];
      let cursor = parent === 'root' ? null : map.get(parent), guard = 0;
      while (cursor && guard++ < 32) { chain.unshift(cursor); cursor = cursor.parentId === 'root' ? null : map.get(cursor.parentId); }
      chain.forEach((folder) => { const slash = document.createElement('span'); slash.setAttribute('aria-hidden','true'); slash.textContent='/'; const button=document.createElement('button'); button.type='button'; button.dataset.filesParent=folder.id; button.textContent=folder.name; crumbs.append(slash,button); });
    }
    async function refresh() {
      const requestId = ++refreshRequest;
      closeContextMenu(false);
      status(state, 'Reading local workspace…');
      try {
        await store.ready();
        const all = await store.listAll();
        if (requestId !== refreshRequest || !win.isConnected) return;
        if (parent !== 'root' && !all.some((item) => item.id === parent && item.type === 'folder')) parent = 'root';
        entries = all.filter((item) => item.parentId === parent);
        if (!entries.some((item) => item.id === selected)) selected = null;
        renderRows(); renderCrumbs(all);
        const s = await store.stats();
        if (requestId !== refreshRequest || !win.isConnected) return;
        status(state, s.mode.toUpperCase() + ' · ' + s.files + ' files · ' + s.folders + ' folders');
        emit('files.viewed', { parentId: parent, count: entries.length });
      } catch (e) {
        if (requestId !== refreshRequest || !win.isConnected) return;
        status(state, e.message || 'Could not read workspace.', true); empty.hidden=false; empty.textContent='Workspace is unavailable. Check browser storage permissions and reload.';
      }
    }
    function open(item) {
      if (!item) return;
      closeContextMenu(false);
      if (item.type === 'folder') { parent=item.id; selected=null; refresh(); }
      else if (global.OSBioWorkspace) global.OSBioWorkspace.openFile(item.id);
    }
    function showName(actionName, item = null) {
      closeContextMenu(false);
      action=actionName; renameId=item && item.id; errorNode.textContent='';
      input.value=item ? item.name : actionName === 'new-file' ? 'untitled.md' : '';
      dialog.hidden=false;
      form.querySelector('[type="submit"]').textContent=actionName === 'rename' ? 'Rename' : actionName === 'new-folder' ? 'Create folder' : 'Create file';
      input.focus({preventScroll:true}); input.select();
    }
    const closeName=()=>{
      dialog.hidden=true;errorNode.textContent='';
      const row=[...list.querySelectorAll('.file-row')].find((item)=>item.dataset.id===selected);
      (row||win.querySelector('[data-files-action="new-file"]'))?.focus({preventScroll:true});
    };
    form.addEventListener('submit',async(e)=>{
      e.preventDefault();
      try {
        if(action==='rename'){await store.rename(renameId,input.value);selected=renameId;await refresh();closeName();status(state,'Name updated.');}
        else if(action==='new-folder'){const f=await store.createFolder(input.value,parent);selected=f.id;await refresh();closeName();status(state,'Folder created.');}
        else {const f=await store.saveFile({name:input.value,parentId:parent,content:''});selected=f.id;await refresh();closeName();open(f);}
      } catch(err){errorNode.textContent=err.message || 'The item could not be saved.';}
    });
    const bind=(name,fn)=>{const button=win.querySelector('[data-files-action="'+name+'"]');if(button)button.addEventListener('click',fn);};
    bind('new-file',()=>showName('new-file')); bind('new-folder',()=>showName('new-folder'));
    bind('open',()=>open(picked())); bind('rename',()=>{const item=picked();if(item&&!item.readOnly&&!item.system)showName('rename',item);});
    bind('cancel-name',closeName);
    bind('up',async()=>{if(parent==='root')return;const folder=await store.get(parent);parent=folder?folder.parentId:'root';selected=null;refresh();});
    bind('move',()=>showMoveDialog(picked()));
    bind('cancel-move',()=>closeMoveDialog(true));
    moveForm.addEventListener('submit',async(e)=>{
      e.preventDefault();
      const itemId=movingItemId, destination=moveDestination.value;
      if(!itemId)return;
      try{
        await store.move(itemId,destination);
        selected=null;
        closeMoveDialog(false);
        await refresh();
        status(state,'Item moved.');
      }catch(error){moveError.textContent=error.message||'Move failed.';}
    });
    bind('delete',async()=>{const item=picked();if(!item||item.readOnly||item.system)return;if(!global.confirm('Delete "'+item.name+'"? This cannot be undone.'))return;try{await store.remove(item.id);selected=null;await refresh();status(state,'Item deleted.');}catch(e){status(state,e.message||'Delete failed.',true);}});
    bind('export',async()=>{try{const data=await store.exportData();const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='osbio-workspace-export.json';a.click();URL.revokeObjectURL(url);status(state,'Workspace export prepared.');}catch(e){status(state,e.message||'Export failed.',true);}});
    bind('import',()=>importInput.click());
    importInput.addEventListener('change',async()=>{const file=importInput.files&&importInput.files[0];if(!file)return;try{const limit=store.getLimits().maxImportBytes;if(file.size>limit){throw new Error('Import file exceeds the 12 MB transfer limit.');}const result=await store.importData(await file.text());parent='root';selected=null;await refresh();status(state,'Imported '+result.imported+' item(s).');}catch(e){status(state,e.message||'Import failed.',true);}finally{importInput.value='';}});
    crumbs.addEventListener('click',(e)=>{const button=e.target.closest('[data-files-parent]');if(!button)return;parent=button.dataset.filesParent;selected=null;refresh();});
    list.addEventListener('contextmenu',(event)=>{
      const row=event.target.closest('.file-row');
      if(!row)return;
      event.preventDefault();
      showContextMenu(entries.find((entry)=>entry.id===row.dataset.id),row,event.clientX,event.clientY);
    });
    contextMenu.addEventListener('click',(event)=>{
      const button=event.target.closest('[data-context-action]');
      if(!button||button.disabled)return;
      const actionName=button.dataset.contextAction;
      const item=entries.find((entry)=>entry.id===contextItemId);
      closeContextMenu(false);
      if(actionName==='open'){open(item);return;}
      if(actionName==='move'){showMoveDialog(item);return;}
      win.querySelector('[data-files-action="'+actionName+'"]')?.click();
    });
    contextMenu.addEventListener('keydown',(event)=>{
      const items=[...contextMenu.querySelectorAll('button:not(:disabled)')];
      const index=items.indexOf(document.activeElement);
      let next=null;
      if(event.key==='ArrowDown')next=items[(index+1)%items.length];
      else if(event.key==='ArrowUp')next=items[(index-1+items.length)%items.length];
      else if(event.key==='Home')next=items[0];
      else if(event.key==='End')next=items[items.length-1];
      else if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeContextMenu(true);return;}
      if(next){event.preventDefault();event.stopPropagation();next.focus({preventScroll:true});}
    });
    win.addEventListener('pointerdown',(event)=>{if(!contextMenu.hidden&&!contextMenu.contains(event.target))closeContextMenu(false);});
    win.addEventListener('keydown',(event)=>{
      if(event.key==='Escape'&&!dialog.hidden){event.preventDefault();event.stopPropagation();closeName();return;}
      if(event.key==='Escape'&&!moveDialog.hidden){event.preventDefault();event.stopPropagation();closeMoveDialog(true);return;}
      if(event.key==='Escape'&&!contextMenu.hidden){event.preventDefault();event.stopPropagation();closeContextMenu(true);return;}
      const typingTarget=event.target.closest&&event.target.closest('input,textarea,select,[contenteditable="true"]');
      if(typingTarget)return;
      if((event.ctrlKey||event.metaKey)&&event.shiftKey&&event.key.toLowerCase()==='n'){event.preventDefault();showName('new-folder');return;}
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='n'){event.preventDefault();showName('new-file');return;}
      if((event.ctrlKey||event.metaKey)&&event.shiftKey&&event.key.toLowerCase()==='m'){event.preventDefault();showMoveDialog(picked());return;}
      if(event.key==='ContextMenu'||(event.shiftKey&&event.key==='F10')){
        const row=event.target.closest&&event.target.closest('.file-row');
        const itemId=row?row.dataset.id:selected;
        const item=entries.find((entry)=>entry.id===itemId);
        const targetRow=[...list.querySelectorAll('.file-row')].find((element)=>element.dataset.id===itemId);
        if(item&&targetRow){event.preventDefault();showContextMenu(item,targetRow);return;}
      }
      if(event.key==='F2'&&picked()){event.preventDefault();showName('rename',picked());}
      else if(event.key==='Delete'&&picked()){event.preventDefault();win.querySelector('[data-files-action="delete"]').click();}
      else if(event.altKey&&event.key==='ArrowUp'){event.preventDefault();win.querySelector('[data-files-action="up"]').click();}
    });
    const onEvent=(e)=>{const type=e.detail&&e.detail.type;if(type&&(type.startsWith('file.')||type.startsWith('folder.')||type==='storage.imported'||type==='storage.user-data-cleared'))refresh();};
    global.addEventListener('osbio:event',onEvent);
    win.addEventListener('osbio:dispose',()=>global.removeEventListener('osbio:event',onEvent),{once:true});
    refresh();
  }

  function mountEditor(win) {
    const store=global.OSBioStorage,name=win.querySelector('#editor-name'),body=win.querySelector('#editor-content');
    const save=win.querySelector('#editor-save'),copy=win.querySelector('#editor-save-copy'),badge=win.querySelector('#editor-dirty-state');
    const statusNode=win.querySelector('#editor-status-text'),count=win.querySelector('#editor-character-count'),title=win.querySelector('.window-title');
    const closeDialog=win.querySelector('#editor-close-dialog');
    let id=null,parent='root',readOnly=false,hasFile=false,dirty=false,savedName='untitled.md',savedBody='',loadRequestId=0;
    let closeDialogReturnFocus=null,allowCloseOnce=false,pendingOpenFileId=null;
    const update=()=>{
      dirty=name.value!==savedName||body.value!==savedBody;
      count.textContent=body.value.length+' chars';
      badge.textContent=readOnly?'READ-ONLY':dirty?'UNSAVED CHANGES':hasFile?'SAVED':'NEW DOCUMENT';
      badge.classList.toggle('is-dirty',dirty);
      save.disabled=readOnly||(!dirty&&hasFile);
      copy.disabled=!readOnly&&!hasFile;
      title.textContent=(dirty?'* ':'')+(name.value||'Editor');
      if(dirty&&!readOnly)status(statusNode,'Unsaved changes');
    };
    async function load(fileId){
      const requestId=++loadRequestId;
      try{const item=await store.get(fileId);if(requestId!==loadRequestId||!win.isConnected)return;if(!item||item.type!=='file'){status(statusNode,'That document no longer exists.',true);return;}
        id=item.id;parent=item.parentId;readOnly=Boolean(item.readOnly||item.system);hasFile=true;
        name.value=item.name;body.value=item.content||'';name.readOnly=readOnly;body.readOnly=readOnly;savedName=name.value;savedBody=body.value;
        status(statusNode,readOnly?'Built-in document · save a copy to edit':'Saved locally · '+item.updatedAt);update();
        emit('editor.opened',{entryId:item.id,name:item.name});
      }catch(e){status(statusNode,e.message||'Could not open document.',true);}
    }
    async function saveDocument(asCopy=false){
      try{
        if(readOnly&&!asCopy){status(statusNode,'This document is read-only. Use Save copy.',true);return false;}
        let fileName=name.value.trim()||'untitled.md',fileId=id,folder=parent;
        if(readOnly||asCopy||!hasFile){
          if(readOnly||asCopy){if(fileName===savedName){const dot=fileName.lastIndexOf('.');fileName=dot>0?fileName.slice(0,dot)+' copy'+fileName.slice(dot):fileName+' copy';}folder='root';}
          fileId=null;
        }
        const item=await store.saveFile({id:fileId,name:fileName,parentId:folder,content:body.value});
        id=item.id;parent=item.parentId;readOnly=false;hasFile=true;name.readOnly=false;body.readOnly=false;name.value=item.name;savedName=item.name;savedBody=item.content;
        status(statusNode,store.getMode()==='memory'?'Saved for this session only · browser storage is unavailable':'Saved locally · '+item.updatedAt);update();
        return true;
      }catch(e){status(statusNode,e.message||'Save failed.',true);return false;}
    }
    save.addEventListener('click',()=>saveDocument(false));copy.addEventListener('click',()=>saveDocument(true));
    win.addEventListener('keydown',(event)=>{
      if(!closeDialog.hidden&&event.key==='Escape'){
        event.preventDefault();event.stopPropagation();pendingOpenFileId=null;hideCloseDialog(true);return;
      }
      if(!(event.ctrlKey||event.metaKey)||event.key.toLowerCase()!=='s')return;
      event.preventDefault();
      if(event.shiftKey)saveDocument(true);else saveDocument(false);
    });
    name.addEventListener('input',update);body.addEventListener('input',update);
    function showCloseDialog() {
      if (!closeDialog.hidden) return;
      closeDialogReturnFocus=document.activeElement;
      closeDialog.hidden=false;
      closeDialog.querySelector('[data-editor-close-action="save"]').focus({preventScroll:true});
      emit('editor.close-prompt-opened',{entryId:id,name:name.value});
    }
    function hideCloseDialog(restoreFocus=true) {
      closeDialog.hidden=true;
      if(restoreFocus&&closeDialogReturnFocus instanceof HTMLElement&&closeDialogReturnFocus.isConnected) {
        closeDialogReturnFocus.focus({preventScroll:true});
      }
      closeDialogReturnFocus=null;
    }
    closeDialog.addEventListener('click',async(event)=>{
      const button=event.target.closest('[data-editor-close-action]');
      if(!button)return;
      const choice=button.dataset.editorCloseAction;
      if(choice==='cancel') {
        pendingOpenFileId=null;
        hideCloseDialog(true);
        emit('editor.close-cancelled',{entryId:id});
        return;
      }
      const targetFileId=pendingOpenFileId;
      if(choice==='save') {
        const saved=await saveDocument(false);
        if(!saved)return;
        pendingOpenFileId=null;
        hideCloseDialog(false);
        if(targetFileId) load(targetFileId);
        else global.WindowManager.closeWindow(win.id);
        return;
      }
      pendingOpenFileId=null;
      hideCloseDialog(false);
      if(targetFileId) {
        load(targetFileId);
        return;
      }
      allowCloseOnce=true;
      global.WindowManager.closeWindow(win.id);
      if(win.isConnected) {
        allowCloseOnce=false;
        showCloseDialog();
      }
    });

    const onOpen=(e)=>{
      if(!e.detail||!e.detail.id||!win.isConnected)return;
      update();
      if(dirty){
        pendingOpenFileId=e.detail.id;
        showCloseDialog();
        e.preventDefault();
        return;
      }
      load(e.detail.id);
    };
    global.addEventListener('osbio:open-file',onOpen);
    win.addEventListener('osbio:dispose',()=>{loadRequestId+=1;global.removeEventListener('osbio:open-file',onOpen);},{once:true});
    win.addEventListener('osbio:before-close',(event)=>{
      update();
      if(allowCloseOnce){allowCloseOnce=false;return;}
      if(dirty){event.preventDefault();showCloseDialog();}
    });
    name.value=savedName;
    body.value='';
    status(statusNode,'New document · not saved');
    update();
  }


  function mountSettings(win) {
    const settings=global.OSBioSettings;
    const wallpaper=win.querySelector('#setting-wallpaper'),accent=win.querySelector('#setting-accent');
    const motion=win.querySelector('#setting-motion'),icons=win.querySelector('#setting-desktop-icons');
    const statusNode=win.querySelector('#settings-status');
    function sync(){const value=settings.get();wallpaper.value=value.wallpaper;accent.value=value.accent;motion.value=value.motion;icons.checked=value.desktopIcons;}
    function message(text,error=false){status(statusNode,text,error);}
    function change(){try{const result=settings.update({wallpaper:wallpaper.value,accent:accent.value,motion:motion.value,desktopIcons:icons.checked});message(result.persistent?'Preferences saved.':'Preferences applied for this session; browser storage is unavailable.',!result.persistent);}catch(e){message(e.message||'Could not update preferences.',true);}}
    [wallpaper,accent,motion].forEach((control)=>control.addEventListener('change',change));
    icons.addEventListener('change',change);
    win.querySelector('#settings-reset').addEventListener('click',()=>{const result=settings.reset();sync();message(result.persistent?'Preferences reset to defaults.':'Defaults applied for this session; browser storage is unavailable.',!result.persistent);});
    win.querySelector('#settings-clear-data').addEventListener('click',async()=>{
      if(!global.confirm('Delete all user-created workspace files and folders? Built-in documents will remain. Export first if you need a backup.'))return;
      try{const result=await global.OSBioStorage.clearUserData();message('User files and folders cleared.');emit('settings.user-data-cleared',result);}
      catch(e){message(e.message||'Could not clear workspace data.',true);}
    });
    const onEvent=(e)=>{if(e.detail&&e.detail.type==='settings.changed')sync();};
    global.addEventListener('osbio:event',onEvent);
    win.addEventListener('osbio:dispose',()=>global.removeEventListener('osbio:event',onEvent),{once:true});
    sync();
    message('Preferences loaded · '+(global.OSBioSettings.get().motion==='system'?'system motion preference':'custom motion preference')+'.');
  }

  function mountSystemMonitor(win) {
    const activeNode=win.querySelector('#monitor-active-app'),windowCount=win.querySelector('#monitor-window-count');
    const files=win.querySelector('#monitor-file-count'),folders=win.querySelector('#monitor-folder-count');
    const chars=win.querySelector('#monitor-character-count'),mode=win.querySelector('#monitor-storage-mode');
    const log=win.querySelector('#monitor-events'),statusNode=win.querySelector('#monitor-status');
    let lastRender=Promise.resolve();
    function renderEvents(){
      log.replaceChildren();
      const events=global.OSBioEvents.recent(35);
      if(!events.length){const li=document.createElement('li');li.className='monitor-no-events';li.textContent='No events recorded in this tab yet.';log.appendChild(li);return;}
      events.forEach((event)=>{
        const li=document.createElement('li');
        const time=document.createElement('time');
        const date=new Date(event.timestamp);
        time.textContent=Number.isNaN(date.getTime())?'--:--:--':date.toLocaleTimeString('en-GB');
        const type=document.createElement('strong');type.textContent=event.type;
        const detail=document.createElement('span');
        const fragments=[];
        if(event.app)fragments.push(event.app);
        if(event.name)fragments.push(event.name);
        if(event.side)fragments.push(event.side);
        if(event.count!=null)fragments.push(String(event.count)+' item(s)');
        if(event.windowCount!=null)fragments.push(String(event.windowCount)+' windows');
        detail.textContent=fragments.join(' · ');
        li.append(time,type,detail);log.appendChild(li);
      });
    }
    async function refresh(){
      const snapshot=global.WindowManager&&global.WindowManager.getSnapshot?global.WindowManager.getSnapshot():{windows:[],activeWindowId:null};
      const active=snapshot.windows.find((item)=>item.id===snapshot.activeWindowId);
      activeNode.textContent=active?active.title:'Desktop';
      windowCount.textContent=String(snapshot.windows.filter((item)=>!item.minimized).length)+' / '+snapshot.windows.length;
      try{
        const data=await global.OSBioStorage.stats();
        files.textContent=String(data.files);folders.textContent=String(data.folders);chars.textContent=Number(data.contentCharacters).toLocaleString('en-US');mode.textContent=data.mode.toUpperCase();
        status(statusNode,'Workspace state updated · '+new Date().toLocaleTimeString('en-GB'));
      }catch(e){mode.textContent='ERROR';status(statusNode,e.message||'Could not read storage status.',true);}
      renderEvents();
    }
    function onEvent(event){
      renderEvents();
      const type=event.detail&&event.detail.type||'';
      if(['window.','file.','folder.','storage.','settings.'].some((prefix)=>type.startsWith(prefix))){
        lastRender=lastRender.then(()=>refresh()).catch(()=>undefined);
      }
    }
    global.addEventListener('osbio:event',onEvent);
    win.addEventListener('osbio:dispose',()=>global.removeEventListener('osbio:event',onEvent),{once:true});
    win.querySelector('#monitor-clear-events').addEventListener('click',()=>{global.OSBioEvents.clearHistory();renderEvents();status(statusNode,'Event history cleared for this tab.');});
    refresh();
  }


  function mountFlow(win) {
    const filter=win.querySelector('#flow-filter'),search=win.querySelector('#flow-search');
    const list=win.querySelector('#flow-event-list'),empty=win.querySelector('#flow-empty'),count=win.querySelector('#flow-event-count');
    const selectedType=win.querySelector('#flow-selected-type'),selectedTime=win.querySelector('#flow-selected-time');
    const detail=win.querySelector('#flow-event-detail'),statusNode=win.querySelector('#flow-status');
    let filtered=[],selectedKey=null;
    const key=(event)=>event.timestamp+'|'+event.type+'|'+JSON.stringify(event);
    function category(event){
      const type=String(event.type||'');
      if(type.startsWith('window.')||type.startsWith('overview.'))return 'window';
      if(type.startsWith('file.')||type.startsWith('folder.')||type.startsWith('storage.'))return 'file';
      if(type.startsWith('settings.'))return 'settings';
      if(type.startsWith('game.'))return 'game';
      if(type.startsWith('launcher.')||type.startsWith('app.')||type.startsWith('desktop.'))return 'launcher';
      return 'all';
    }
    function summary(event){
      const values=[];
      ['app','name','side','entryId','parentId','count','turns','matchedPairs'].forEach((field)=>{if(event[field]!=null)values.push(field+': '+String(event[field]));});
      return values.join(' · ');
    }
    function inspect(event){
      selectedKey=event?key(event):null;
      if(!event){selectedType.textContent='Select an event';selectedTime.textContent='—';detail.textContent='Choose an item from the stream to inspect its exact recorded fields.';return;}
      selectedType.textContent=event.type;
      const date=new Date(event.timestamp);
      selectedTime.textContent=Number.isNaN(date.getTime())?String(event.timestamp||'Unknown time'):date.toLocaleString();
      detail.textContent=JSON.stringify(event,null,2);
    }
    function render(){
      const all=global.OSBioEvents.recent(160),needle=search.value.trim().toLowerCase(),scope=filter.value;
      filtered=all.filter((event)=>(scope==='all'||category(event)===scope)&&(!needle||(event.type+' '+summary(event)+' '+JSON.stringify(event)).toLowerCase().includes(needle)));
      list.replaceChildren();count.textContent=String(filtered.length);empty.hidden=filtered.length>0;
      filtered.forEach((event)=>{
        const button=document.createElement('button');button.type='button';button.className='flow-event-row';
        if(key(event)===selectedKey)button.classList.add('is-selected');
        const time=document.createElement('time'),date=new Date(event.timestamp);
        time.textContent=Number.isNaN(date.getTime())?'--:--:--':date.toLocaleTimeString('en-GB');
        const marker=document.createElement('span');marker.className='flow-event-marker';marker.setAttribute('aria-hidden','true');
        const main=document.createElement('span');main.className='flow-event-main';
        const type=document.createElement('strong');type.textContent=event.type;
        const sub=document.createElement('small');sub.textContent=summary(event)||'No additional fields';
        main.append(type,sub);button.append(time,marker,main);button.setAttribute('aria-label',event.type+' '+summary(event));
        button.addEventListener('click',()=>{inspect(event);list.querySelectorAll('.flow-event-row').forEach((row)=>row.classList.toggle('is-selected',row===button));});
        list.appendChild(button);
      });
      empty.textContent=all.length?'No events match this filter.':'No events have been recorded in this tab yet.';
      if(selectedKey&&!filtered.some((event)=>key(event)===selectedKey))inspect(null);
      status(statusNode,filtered.length+' shown · '+all.length+' in the bounded tab-local buffer.');
    }
    filter.addEventListener('change',render);search.addEventListener('input',render);
    win.querySelector('#flow-clear').addEventListener('click',()=>{
      if(!global.confirm('Clear the event history held in this tab? This does not clear workspace files.'))return;
      global.OSBioEvents.clearHistory();selectedKey=null;inspect(null);render();status(statusNode,'Event history cleared for this tab.');
    });
    win.querySelector('#flow-export').addEventListener('click',()=>{
      try{
        const json=JSON.stringify({format:'osbio-event-trace-v1',exportedAt:new Date().toISOString(),events:global.OSBioEvents.recent(160)},null,2);
        const url=URL.createObjectURL(new Blob([json],{type:'application/json'}));const link=document.createElement('a');
        link.href=url;link.download='osbio-event-trace.json';link.click();URL.revokeObjectURL(url);
        status(statusNode,'Trace export prepared.');
      }catch(error){status(statusNode,error.message||'Could not export trace.',true);}
    });
    const onEvent=()=>render();
    global.addEventListener('osbio:event',onEvent);
    win.addEventListener('osbio:dispose',()=>global.removeEventListener('osbio:event',onEvent),{once:true});
    render();inspect(null);
  }

  global.OSBioWorkspaceApps={mount(win,name){
    if(name==='files')mountFiles(win);
    if(name==='editor')mountEditor(win);
    if(name==='settings')mountSettings(win);
    if(name==='system')mountSystemMonitor(win);
    if(name==='flow')mountFlow(win);
  }};
})(window);
