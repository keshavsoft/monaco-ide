/**
 * Monaco IDE V3 - Tab Manager & Multi-Document System
 * Manages multiple Monaco editor models, tab strip UI,
 * direct disk persistence via File System Access API, and per-tab dirty tracking.
 */

let tabs = [];
let activeTabId = null;
let editorInstance = null;
let monacoInstance = null;
let tabIdCounter = 1;

export function detectLanguage(fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'json':
            return 'json';
        case 'js':
        case 'mjs':
        case 'cjs':
            return 'javascript';
        case 'ts':
        case 'tsx':
            return 'typescript';
        case 'html':
        case 'htm':
            return 'html';
        case 'css':
        case 'scss':
        case 'less':
            return 'css';
        case 'md':
            return 'markdown';
        case 'xml':
        case 'svg':
            return 'xml';
        case 'yaml':
        case 'yml':
            return 'yaml';
        case 'sql':
            return 'sql';
        default:
            return 'plaintext';
    }
}

export function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileIconClass(fileName) {
    const lang = detectLanguage(fileName);
    switch (lang) {
        case 'json':
            return 'bi bi-filetype-json text-amber-400';
        case 'javascript':
            return 'bi bi-filetype-js text-yellow-400';
        case 'typescript':
            return 'bi bi-filetype-tsx text-sky-400';
        case 'html':
            return 'bi bi-filetype-html text-orange-400';
        case 'css':
            return 'bi bi-filetype-css text-blue-400';
        case 'markdown':
            return 'bi bi-filetype-md text-emerald-400';
        case 'xml':
            return 'bi bi-filetype-xml text-teal-400';
        default:
            return 'bi bi-file-earmark-code text-zinc-400';
    }
}

export function getActiveTab() {
    return tabs.find(t => t.id === activeTabId) || null;
}

export function getTabs() {
    return tabs;
}

function updateHeaderStatus() {
    const tab = getActiveTab();
    const nameEl = document.getElementById('fileName');
    const sizeEl = document.getElementById('fileSize');
    const iconEl = document.getElementById('fileIcon');
    const dirtyDot = document.getElementById('dirtyDot');
    const tabCountEl = document.getElementById('tabCount');

    if (tabCountEl) {
        tabCountEl.textContent = `${tabs.length} ${tabs.length === 1 ? 'file' : 'files'}`;
    }

    if (!tab) {
        if (nameEl) nameEl.textContent = 'No file open';
        if (sizeEl) sizeEl.textContent = '0 B';
        if (iconEl) iconEl.className = 'bi bi-file-earmark text-zinc-500';
        if (dirtyDot) dirtyDot.classList.add('hidden');
        document.title = 'Monaco IDE V3';
        return;
    }

    if (nameEl) nameEl.textContent = tab.name;
    if (sizeEl) sizeEl.textContent = formatBytes(tab.size);
    if (iconEl) iconEl.className = getFileIconClass(tab.name);

    if (dirtyDot) {
        if (tab.isDirty) {
            dirtyDot.classList.remove('hidden');
        } else {
            dirtyDot.classList.add('hidden');
        }
    }

    const baseTitle = `${tab.name} — Monaco IDE V3`;
    document.title = tab.isDirty ? `• ${baseTitle}` : baseTitle;
}

function renderTabStrip() {
    const strip = document.getElementById('tabStrip');
    if (!strip) return;

    strip.innerHTML = '';

    tabs.forEach(tab => {
        const isActive = tab.id === activeTabId;
        const tabEl = document.createElement('div');
        tabEl.dataset.tabId = tab.id;
        tabEl.className = `h-full px-3 flex items-center gap-2 border-r border-zinc-800 text-xs cursor-pointer transition select-none ${isActive ? 'tab-active' : 'tab-inactive'}`;
        tabEl.title = tab.name;

        // Icon
        const icon = document.createElement('i');
        icon.className = getFileIconClass(tab.name);
        tabEl.appendChild(icon);

        // Name
        const nameSpan = document.createElement('span');
        nameSpan.className = 'truncate max-w-[140px] font-mono font-medium';
        nameSpan.textContent = tab.name;
        tabEl.appendChild(nameSpan);

        // Dirty Dot
        const dirtySpan = document.createElement('span');
        dirtySpan.className = `w-1.5 h-1.5 rounded-full bg-amber-400 ${tab.isDirty ? 'inline-block' : 'hidden'}`;
        dirtySpan.title = 'Unsaved changes';
        tabEl.appendChild(dirtySpan);

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'ml-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700/60 rounded p-0.5 transition flex items-center justify-center';
        closeBtn.title = 'Close (Ctrl+W)';
        closeBtn.innerHTML = '<i class="bi bi-x text-sm leading-none"></i>';
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeTab(tab.id);
        });
        tabEl.appendChild(closeBtn);

        // Tab click switches active tab
        tabEl.addEventListener('click', () => {
            if (activeTabId !== tab.id) {
                switchTab(tab.id);
            }
        });

        strip.appendChild(tabEl);
    });

    updateHeaderStatus();
}

export function switchTab(tabId) {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;

    activeTabId = tab.id;
    if (editorInstance && tab.model) {
        editorInstance.setModel(tab.model);
    }

    renderTabStrip();
}

export function createTab({ name, content = '', handle = null, language = null, size = 0 }) {
    if (!monacoInstance) return null;

    const lang = language || detectLanguage(name);
    const model = monacoInstance.editor.createModel(content, lang);

    const newTab = {
        id: `tab-${tabIdCounter++}`,
        name,
        handle,
        model,
        lastSavedContent: content,
        isDirty: false,
        size: size || new Blob([content]).size
    };

    // Listen to changes for per-tab dirty state
    model.onDidChangeContent(() => {
        const currentContent = model.getValue();
        const dirty = currentContent !== newTab.lastSavedContent;
        if (newTab.isDirty !== dirty) {
            newTab.isDirty = dirty;
            renderTabStrip();
        }
    });

    tabs.push(newTab);
    switchTab(newTab.id);
    return newTab;
}

export function closeTab(tabId) {
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;

    const tab = tabs[tabIndex];

    if (tab.isDirty) {
        const discard = confirm(`"${tab.name}" has unsaved changes.\nAre you sure you want to discard your changes and close?`);
        if (!discard) return;
    }

    // Clean up Monaco model
    if (tab.model) {
        tab.model.dispose();
    }

    tabs.splice(tabIndex, 1);

    if (activeTabId === tabId) {
        if (tabs.length > 0) {
            const nextTab = tabs[Math.min(tabIndex, tabs.length - 1)];
            switchTab(nextTab.id);
        } else {
            // Create a fresh Untitled buffer if all tabs are closed
            createTab({
                name: 'untitled.json',
                content: '{\n  \n}\n',
                language: 'json'
            });
        }
    } else {
        renderTabStrip();
    }
}

function showSavedFeedback() {
    const statusEl = document.getElementById('saveStatus');
    if (!statusEl) return;

    statusEl.classList.remove('hidden');
    statusEl.textContent = 'Saved ✓';
    setTimeout(() => {
        statusEl.classList.add('hidden');
    }, 2000);
}

function downloadAsBlob(content, fileName) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'document.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export async function saveActiveFile() {
    const tab = getActiveTab();
    if (!tab || !tab.model) return;

    const content = tab.model.getValue();

    try {
        if (tab.handle) {
            // Native Direct Disk Save via File System Access API
            const writable = await tab.handle.createWritable();
            await writable.write(content);
            await writable.close();

            tab.lastSavedContent = content;
            tab.isDirty = false;
            tab.size = new Blob([content]).size;

            showSavedFeedback();
            renderTabStrip();
            return;
        }

        // If file has no handle yet (e.g. untitled tab or sample)
        if (window.showSaveFilePicker) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: tab.name || 'document.json'
                });
                const writable = await handle.createWritable();
                await writable.write(content);
                await writable.close();

                tab.handle = handle;
                tab.name = handle.name;
                tab.lastSavedContent = content;
                tab.isDirty = false;
                tab.size = new Blob([content]).size;

                showSavedFeedback();
                renderTabStrip();
                return;
            } catch (err) {
                if (err.name === 'AbortError') return;
                console.warn('showSaveFilePicker failed, falling back to download:', err);
            }
        }

        // Browser download fallback
        downloadAsBlob(content, tab.name);
        tab.lastSavedContent = content;
        tab.isDirty = false;
        tab.size = new Blob([content]).size;

        showSavedFeedback();
        renderTabStrip();
    } catch (err) {
        console.error('Failed to save file:', err);
        alert(`Failed to save ${tab.name}: ${err.message}`);
    }
}

export async function openFiles() {
    // Attempt multi-file picker via File System Access API
    if (window.showOpenFilePicker) {
        try {
            const handles = await window.showOpenFilePicker({
                multiple: true,
                types: [
                    {
                        description: 'Supported Code & Text Files',
                        accept: {
                            'application/json': ['.json'],
                            'text/javascript': ['.js', '.mjs', '.cjs'],
                            'text/typescript': ['.ts', '.tsx'],
                            'text/html': ['.html', '.htm'],
                            'text/css': ['.css', '.scss'],
                            'text/markdown': ['.md'],
                            'text/plain': ['.txt', '.log']
                        }
                    }
                ]
            });

            if (!handles || handles.length === 0) return;

            for (const handle of handles) {
                // If file is already open, activate its tab
                const existingTab = tabs.find(t => t.handle && t.handle.name === handle.name);
                if (existingTab) {
                    switchTab(existingTab.id);
                    continue;
                }

                const file = await handle.getFile();
                const text = await file.text();
                createTab({
                    name: file.name,
                    content: text,
                    handle,
                    size: file.size
                });
            }
            return;
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.warn('showOpenFilePicker failed, falling back to input:', err);
        }
    }

    // Fallback file input
    const input = document.getElementById('fileInput');
    if (input) input.click();
}

export function formatActiveDocument() {
    if (!editorInstance) return;
    const action = editorInstance.getAction('editor.action.formatDocument');
    if (action) action.run();
}

export function initTabManager(editor, monaco) {
    editorInstance = editor;
    monacoInstance = monaco;

    const openBtn = document.getElementById('openFileBtn');
    const saveBtn = document.getElementById('saveFileBtn');
    const formatBtn = document.getElementById('formatBtn');
    const newTabBtn = document.getElementById('newTabBtn');
    const input = document.getElementById('fileInput');

    if (openBtn) openBtn.addEventListener('click', openFiles);
    if (saveBtn) saveBtn.addEventListener('click', saveActiveFile);
    if (formatBtn) formatBtn.addEventListener('click', formatActiveDocument);

    if (newTabBtn) {
        newTabBtn.addEventListener('click', () => {
            createTab({
                name: `untitled-${tabs.length + 1}.json`,
                content: '{\n  \n}\n',
                language: 'json'
            });
        });
    }

    if (input) {
        input.addEventListener('change', async (event) => {
            const files = event.target.files;
            if (!files || files.length === 0) return;

            for (const file of files) {
                const text = await file.text();
                createTab({
                    name: file.name,
                    content: text,
                    handle: null,
                    size: file.size
                });
            }
            input.value = '';
        });
    }

    // Monaco editor keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        saveActiveFile();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyO, () => {
        openFiles();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyW, () => {
        if (activeTabId) closeTab(activeTabId);
    });

    // Global keyboard listener
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
            saveActiveFile();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
            e.preventDefault();
            openFiles();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w') {
            e.preventDefault();
            if (activeTabId) closeTab(activeTabId);
        }
    });

    // Before unload warning for unsaved changes in any tab
    window.addEventListener('beforeunload', (e) => {
        const hasDirty = tabs.some(t => t.isDirty);
        if (hasDirty) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

export default initTabManager;

