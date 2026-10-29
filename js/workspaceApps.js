(function (global) {
  'use strict';
  const emit = (type, detail = {}) => global.dispatchEvent(new CustomEvent('osbio:event', { detail: { type, timestamp: new Date().toISOString(), ...detail } }));
  const status = (node, message, error = false) => { node.textContent = message; node.classList.toggle('is-error', error); };

  function mountFiles(win) {
    const store = global.OSBioStorage, list = win.querySelector('.files-list'), empty = win.querySelector('.files-empty');
    const state = win.querySelector('.files-status'), crumbs = win.querySelector('.files-breadcrumbs');
    const dialog = win.querySelector('.files-name-dialog'), form = win.querySelector('.files-name-form');
    const input = win.querySelector('#files-name-input'), errorNode = win.querySelector('.files-dialog-error');
    const importInput = win.querySelector('.files-import-input');
    let parent = 'root', selected = null, entries = [], action = 'new-file', renameId = null;
    const picked = () => entries.find((item) => item.id === selected) || null;
    const setActions = () => {
      const item = picked();
      const disabled = {
        open: !item, rename: !item || item.readOnly || item.system,
        delete: !item || item.readOnly || item.system,
        'move-root': !item || item.readOnly || item.system || item.parentId === 'root',
        up: parent === 'root'
      };
      Object.entries(disabled).forEach(([name, isDisabled]) => {
        const button = win.querySelector('[data-files-action="' + name + '"]');
        if (button) button.disabled = isDisabled;
      });
    };
    function renderRows() {
      list.replaceChildren();
      entries.forEach((item) => {
        const row = document.createElement('button'); row.type = 'button'; row.className = 'file-row';
        row.dataset.id = item.id; row.setAttribute('role', 'listitem'); row.setAttribute('aria-pressed', String(selected === item.id));
        if (selected === item.id) row.classList.add('is-selected');
        const type = document.createElement('span'); type.className = 'file-row-type'; type.textContent = item.type === 'folder' ? 'DIR' : 'TXT';
        const name = document.createElement('span'); name.className = 'file-row-name'; name.textContent = item.name;
        const tag = document.createElement('span'); tag.className = 'file-row-state'; tag.textContent = item.readOnly ? 'BUILT-IN' : 'LOCAL';
        row.append(type, name, tag);
        row.addEventListener('click', () => { selected = item.id; renderRows(); setActions(); });
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
      status(state, 'Reading local workspace…');
      try {
        await store.ready();
        const all = await store.listAll();
        if (parent !== 'root' && !all.some((item) => item.id === parent && item.type === 'folder')) parent = 'root';
        entries = all.filter((item) => item.parentId === parent);
        if (!entries.some((item) => item.id === selected)) selected = null;
        renderRows(); renderCrumbs(all);
        const s = await store.stats(); status(state, s.mode.toUpperCase() + ' · ' + s.files + ' files · ' + s.folders + ' folders');
        emit('files.viewed', { parentId: parent, count: entries.length });
      } catch (e) { status(state, e.message || 'Could not read workspace.', true); empty.hidden=false; empty.textContent='Workspace is unavailable. Check browser storage permissions and reload.'; }
    }
    function open(item) {
      if (!item) return;
      if (item.type === 'folder') { parent=item.id; selected=null; refresh(); }
      else if (global.OSBioWorkspace) global.OSBioWorkspace.openFile(item.id);
    }
    function showName(actionName, item = null) {
      action=actionName; renameId=item && item.id; errorNode.textContent='';
      input.value=item ? item.name : actionName === 'new-file' ? 'untitled.md' : '';
      dialog.hidden=false;
      form.querySelector('[type="submit"]').textContent=actionName === 'rename' ? 'Rename' : actionName === 'new-folder' ? 'Create folder' : 'Create file';
      input.focus({preventScroll:true}); input.select();
    }
    const closeName=()=>{dialog.hidden=true;errorNode.textContent='';};
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
    bind('move-root',async()=>{const item=picked();if(!item||item.readOnly||item.system||item.parentId==='root')return;try{await store.move(item.id,'root');selected=null;await refresh();status(state,'Moved to workspace root.');}catch(e){status(state,e.message||'Move failed.',true);}});
    bind('delete',async()=>{const item=picked();if(!item||item.readOnly||item.system)return;if(!global.confirm('Delete "'+item.name+'"? This cannot be undone.'))return;try{await store.remove(item.id);selected=null;await refresh();status(state,'Item deleted.');}catch(e){status(state,e.message||'Delete failed.',true);}});
    bind('export',async()=>{try{const data=await store.exportData();const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='osbio-workspace-export.json';a.click();URL.revokeObjectURL(url);status(state,'Workspace export prepared.');}catch(e){status(state,e.message||'Export failed.',true);}});
    bind('import',()=>importInput.click());
    importInput.addEventListener('change',async()=>{const file=importInput.files&&importInput.files[0];if(!file)return;try{const result=await store.importData(await file.text());parent='root';selected=null;await refresh();status(state,'Imported '+result.imported+' item(s).');}catch(e){status(state,e.message||'Import failed.',true);}finally{importInput.value='';}});
    crumbs.addEventListener('click',(e)=>{const button=e.target.closest('[data-files-parent]');if(!button)return;parent=button.dataset.filesParent;selected=null;refresh();});
    win.addEventListener('keydown',(e)=>{if(e.key==='Escape'&&!dialog.hidden){e.preventDefault();e.stopPropagation();closeName();}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='n'){e.preventDefault();showName('new-file');}});
    const onEvent=(e)=>{const type=e.detail&&e.detail.type;if(type&&(/^file\\./.test(type)||/^folder\\./.test(type)||/^storage\\.(imported|user-data-cleared)$/.test(type)))refresh();};
    global.addEventListener('osbio:event',onEvent);
    win.addEventListener('osbio:dispose',()=>global.removeEventListener('osbio:event',onEvent),{once:true});
    refresh();
  }

  function mountEditor(win) {
    const store=global.OSBioStorage,name=win.querySelector('#editor-name'),body=win.querySelector('#editor-content');
    const save=win.querySelector('#editor-save'),copy=win.querySelector('#editor-save-copy'),badge=win.querySelector('#editor-dirty-state');
    const statusNode=win.querySelector('#editor-status-text'),count=win.querySelector('#editor-character-count'),title=win.querySelector('.window-title');
    let id=null,parent='root',readOnly=false,hasFile=false,dirty=false,savedName='untitled.md',savedBody='';
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
      try{const item=await store.get(fileId);if(!item||item.type!=='file'){status(statusNode,'That document no longer exists.',true);return;}
        id=item.id;parent=item.parentId;readOnly=Boolean(item.readOnly||item.system);hasFile=true;
        name.value=item.name;body.value=item.content||'';name.readOnly=readOnly;body.readOnly=readOnly;savedName=name.value;savedBody=body.value;
        status(statusNode,readOnly?'Built-in document · save a copy to edit':'Saved locally · '+item.updatedAt);update();
        emit('editor.opened',{entryId:item.id,name:item.name});
      }catch(e){status(statusNode,e.message||'Could not open document.',true);}
    }
    async function saveDocument(asCopy=false){
      try{
        if(readOnly&&!asCopy){status(statusNode,'This document is read-only. Use Save copy.',true);return;}
        let fileName=name.value.trim()||'untitled.md',fileId=id,folder=parent;
        if(readOnly||asCopy||!hasFile){
          if(readOnly||asCopy){if(fileName===savedName){const dot=fileName.lastIndexOf('.');fileName=dot>0?fileName.slice(0,dot)+' copy'+fileName.slice(dot):fileName+' copy';}folder='root';}
          fileId=null;
        }
        const item=await store.saveFile({id:fileId,name:fileName,parentId:folder,content:body.value});
        id=item.id;parent=item.parentId;readOnly=false;hasFile=true;name.readOnly=false;body.readOnly=false;name.value=item.name;savedName=item.name;savedBody=item.content;
        status(statusNode,'Saved locally · '+item.updatedAt);update();
      }catch(e){status(statusNode,e.message||'Save failed.',true);}
    }
    save.addEventListener('click',()=>saveDocument(false));copy.addEventListener('click',()=>saveDocument(true));
    name.addEventListener('input',update);body.addEventListener('input',update);
    const onOpen=(e)=>{if(e.detail&&e.detail.id&&win.isConnected)load(e.detail.id);};
    global.addEventListener('osbio:open-file',onOpen);
    win.addEventListener('osbio:dispose',()=>global.removeEventListener('osbio:open-file',onOpen),{once:true});
    win.addEventListener('osbio:before-close',(e)=>{update();if(dirty&&!global.confirm('Discard unsaved changes to "'+name.value+'"?'))e.preventDefault();});
    const pending=global.OSBioWorkspace&&global.OSBioWorkspace.pendingFileId;
    if(global.OSBioWorkspace)global.OSBioWorkspace.pendingFileId=null;
    if(pending)load(pending);else{ name.value=savedName;body.value='';status(statusNode,'New document · not saved');update(); }
  }

  global.OSBioWorkspaceApps={mount(win,name){if(name==='files')mountFiles(win);if(name==='editor')mountEditor(win);}};
})(window);
