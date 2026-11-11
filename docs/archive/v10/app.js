/**
 * Monaco IDE V10 - In-Browser Local Folder Virtual Server
 * Controls Tab 2 directly from Tab 1 using Service Worker & BroadcastChannel
 */

import {
    clearStorage,
    saveMultipleFilesToVirtualServer,
    saveFileToVirtualServer,
    scanDirectoryHandle,
    cleanPath,
    guessMime
} from './storage.js';

// Application State
const state = {
    dirHandle: null,
    dirName: '',
    files: [],            // Array of { name, path, handle }
    htmlFiles: [],        // Array of paths ending in .html
    activeEntryHtml: '',  // Path of HTML file to preview
    activeFile: null,     // Currently open file in Monaco: { path, handle, content, isDirty }
    editor: null,
    monaco: null,
    swReady: false,
    channel: null
};

// Elements
const dom = {
    selectFolderBtn: document.getElementById('selectFolderBtn'),
    previewBtn: document.getElementById('previewBtn'),
    entrySelect: document.getElementById('entrySelect'),
    saveBtn: document.getElementById('saveBtn'),
    statusBadge: document.getElementById('statusBadge'),
    folderNameDisplay: document.getElementById('folderNameDisplay'),
    fileTree: document.getElementById('fileTree'),
    activeFileName: document.getElementById('activeFileName'),
    activeFileBadge: document.getElementById('activeFileBadge'),
    saveIndicator: document.getElementById('saveIndicator'),
    fileCountBadge: document.getElementById('fileCountBadge'),
    editorContainer: document.getElementById('monacoContainer'),
    cursorPos: document.getElementById('cursorPos')
};

// Initialize BroadcastChannel
function setupChannel() {
    try {
        state.channel = new BroadcastChannel('v10-preview-channel');
        state.channel.onmessage = (event) => {
            const msg = event.data || {};
            console.log('[Tab 1 BroadcastChannel Received]', msg);
        };
    } catch (err) {
        console.warn('BroadcastChannel not supported:', err);
    }
}

// Service Worker Registration
async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        updateStatus('⚠️ Service Worker not supported in this browser', 'error');
        return;
    }

    try {
        updateStatus('Initializing Virtual Server…', 'info');
        const reg = await navigator.serviceWorker.register('./sw.js', { scope: './' });
        await navigator.serviceWorker.ready;

        if (reg.active) {
            reg.active.postMessage({ type: 'CLAIM' });
        }

        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('[Service Worker] Controller claimed clients');
            state.swReady = true;
            updateStatus('⚡ Virtual Server Ready', 'success');
        });

        if (navigator.serviceWorker.controller) {
            state.swReady = true;
            updateStatus('⚡ Virtual Server Ready', 'success');
        } else {
            // Need a reload or claim
            setTimeout(() => {
                if (navigator.serviceWorker.controller) {
                    state.swReady = true;
                    updateStatus('⚡ Virtual Server Ready', 'success');
                }
            }, 800);
        }
    } catch (err) {
        console.error('Service worker registration failed:', err);
        updateStatus('SW Error: ' + err.message, 'error');
    }
}

function updateStatus(text, type = 'info') {
    if (!dom.statusBadge) return;
    dom.statusBadge.textContent = text;
    if (type === 'success') {
        dom.statusBadge.className = 'text-xs px-2.5 py-1 rounded font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 flex items-center gap-1.5';
    } else if (type === 'error') {
        dom.statusBadge.className = 'text-xs px-2.5 py-1 rounded font-mono bg-rose-950/80 text-rose-300 border border-rose-700/60 flex items-center gap-1.5';
    } else {
        dom.statusBadge.className = 'text-xs px-2.5 py-1 rounded font-mono bg-zinc-800 text-sky-300 border border-zinc-700 flex items-center gap-1.5';
    }
}

// Monaco Editor Loader
function loadMonaco() {
    return new Promise((resolve, reject) => {
        if (window.monaco && window.monaco.editor) {
            resolve(window.monaco);
            return;
        }
        require.config({
            paths: {
                vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs'
            }
        });
        require(['vs/editor/editor.main'], () => resolve(window.monaco), reject);
    });
}

function getLanguageForPath(filePath) {
    const ext = String(filePath).split('.').pop()?.toLowerCase();
    const map = {
        js: 'javascript', mjs: 'javascript', cjs: 'javascript',
        ts: 'typescript', tsx: 'typescript',
        html: 'html', htm: 'html',
        css: 'css', scss: 'scss', less: 'less',
        json: 'json',
        md: 'markdown',
        xml: 'xml', svg: 'xml',
        py: 'python', sh: 'shell', sql: 'sql'
    };
    return map[ext] || 'plaintext';
}

async function initMonaco() {
    state.monaco = await loadMonaco();
    state.editor = state.monaco.editor.create(dom.editorContainer, {
        theme: 'vs-dark',
        value: '// Click "Folder" in the top bar to select a folder from your computer.\n// All files will load in the sidebar and be served in Tab 2!\n',
        language: 'javascript',
        automaticLayout: true,
        fontSize: 13,
        tabSize: 2,
        lineNumbers: 'on',
        minimap: { enabled: false },
        cursorBlinking: 'smooth',
        padding: { top: 10 }
    });

    state.editor.onDidChangeCursorPosition(e => {
        if (dom.cursorPos) {
            dom.cursorPos.textContent = `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
        }
    });

    // Auto-sync changes to Virtual Server & Trigger Live Reload on Tab 2
    let changeTimer = null;
    state.editor.onDidChangeModelContent(() => {
        if (!state.activeFile) return;
        state.activeFile.isDirty = true;
        showDirtyIndicator(true);

        clearTimeout(changeTimer);
        changeTimer = setTimeout(async () => {
            const currentCode = state.editor.getValue();
            state.activeFile.content = currentCode;

            // Sync to IndexedDB for the Virtual Server
            await saveFileToVirtualServer(state.activeFile.path, currentCode, guessMime(state.activeFile.path));

            // Notify Tab 2 to refresh
            if (state.channel) {
                state.channel.postMessage({ type: 'RELOAD', file: state.activeFile.path });
            }
        }, 350);
    });
}

function showDirtyIndicator(isDirty) {
    if (dom.saveIndicator) {
        if (isDirty) {
            dom.saveIndicator.textContent = '● Unsaved';
            dom.saveIndicator.className = 'text-amber-400 font-mono text-[11px]';
        } else {
            dom.saveIndicator.textContent = '✓ Saved to disk';
            dom.saveIndicator.className = 'text-emerald-400 font-mono text-[11px]';
        }
    }
}

// Open and Scan Folder from Local Computer
async function handleSelectFolder() {
    if (!('showDirectoryPicker' in window)) {
        alert('Your browser does not support the File System Access API. Please use Chrome, Edge, or a Chromium browser.');
        return;
    }

    try {
        const dirHandle = await window.showDirectoryPicker();
        state.dirHandle = dirHandle;
        state.dirName = dirHandle.name;

        if (dom.folderNameDisplay) {
            dom.folderNameDisplay.textContent = dirHandle.name;
        }

        updateStatus(`Scanning "${dirHandle.name}"…`, 'info');

        // Scan recursive
        const files = await scanDirectoryHandle(dirHandle);
        state.files = files;

        if (dom.fileCountBadge) {
            dom.fileCountBadge.textContent = `${files.length} files`;
        }

        // Read all files into memory and save into IndexedDB for the Virtual Server
        updateStatus(`Caching ${files.length} files into Virtual Server…`, 'info');
        const fileRecords = [];
        const htmlFiles = [];

        for (const f of files) {
            try {
                const fileObj = await f.handle.getFile();
                fileRecords.push({
                    path: f.path,
                    body: fileObj,
                    contentType: fileObj.type || guessMime(f.path)
                });

                if (/\.html?$/i.test(f.path)) {
                    htmlFiles.push(f.path);
                }
            } catch (err) {
                console.warn(`Could not read file ${f.path}:`, err);
            }
        }

        await clearStorage();
        await saveMultipleFilesToVirtualServer(fileRecords);

        state.htmlFiles = htmlFiles;
        populateEntryDropdown(htmlFiles);

        // Render file tree
        renderFileTree(files);

        updateStatus(`⚡ Virtual Server Active (${files.length} files)`, 'success');

        // Open best entry file in editor
        if (state.activeEntryHtml) {
            const entryItem = files.find(f => f.path === state.activeEntryHtml);
            if (entryItem) {
                await openFileInEditor(entryItem);
            }
        } else if (files.length > 0) {
            await openFileInEditor(files[0]);
        }

    } catch (err) {
        if (err.name === 'AbortError') return; // User cancelled dialog
        console.error('Error selecting folder:', err);
        updateStatus('Folder Error: ' + err.message, 'error');
    }
}

function populateEntryDropdown(htmlFiles) {
    if (!dom.entrySelect) return;
    dom.entrySelect.innerHTML = '';

    if (htmlFiles.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'No HTML file found';
        dom.entrySelect.appendChild(opt);
        dom.entrySelect.disabled = true;
        state.activeEntryHtml = '';
        return;
    }

    dom.entrySelect.disabled = false;

    // Sort to prioritize root index.html or docs/index.html
    htmlFiles.sort((a, b) => {
        const aScore = a === 'index.html' ? 10 : a.endsWith('/index.html') ? 5 : 1;
        const bScore = b === 'index.html' ? 10 : b.endsWith('/index.html') ? 5 : 1;
        return bScore - aScore;
    });

    htmlFiles.forEach((path, idx) => {
        const opt = document.createElement('option');
        opt.value = path;
        opt.textContent = path;
        if (idx === 0) opt.selected = true;
        dom.entrySelect.appendChild(opt);
    });

    state.activeEntryHtml = htmlFiles[0];

    dom.entrySelect.onchange = () => {
        state.activeEntryHtml = dom.entrySelect.value;
    };
}

// Render Explorer Tree
function renderFileTree(files) {
    if (!dom.fileTree) return;
    dom.fileTree.innerHTML = '';

    if (files.length === 0) {
        dom.fileTree.innerHTML = '<div class="text-zinc-500 text-xs p-3">No files found.</div>';
        return;
    }

    files.forEach(f => {
        const item = document.createElement('div');
        item.className = 'file-tree-item flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/80 rounded cursor-pointer transition select-none';
        item.dataset.path = f.path;

        const iconClass = getFileIcon(f.path);
        item.innerHTML = `
            <i class="bi ${iconClass}"></i>
            <span class="truncate flex-1 font-mono">${f.path}</span>
        `;

        item.addEventListener('click', () => {
            openFileInEditor(f);
        });

        dom.fileTree.appendChild(item);
    });
}

function getFileIcon(path) {
    const ext = String(path).split('.').pop()?.toLowerCase();
    const map = {
        html: 'bi-filetype-html text-orange-400',
        htm: 'bi-filetype-html text-orange-400',
        css: 'bi-filetype-css text-sky-400',
        js: 'bi-filetype-js text-yellow-400',
        json: 'bi-filetype-json text-amber-300',
        md: 'bi-filetype-md text-emerald-400',
        svg: 'bi-filetype-svg text-purple-400',
        png: 'bi-file-image text-cyan-400',
        jpg: 'bi-file-image text-cyan-400',
        jpeg: 'bi-file-image text-cyan-400'
    };
    return map[ext] || 'bi-file-earmark-code text-zinc-400';
}

// Open File in Monaco Editor
async function openFileInEditor(fileItem) {
    try {
        const fileObj = await fileItem.handle.getFile();
        const content = await fileObj.text();

        state.activeFile = {
            path: fileItem.path,
            handle: fileItem.handle,
            content,
            isDirty: false
        };

        if (dom.activeFileName) {
            dom.activeFileName.textContent = fileItem.name;
        }
        if (dom.activeFileBadge) {
            dom.activeFileBadge.textContent = fileItem.path;
        }

        showDirtyIndicator(false);

        // Update Monaco Model
        const lang = getLanguageForPath(fileItem.path);
        const oldModel = state.editor.getModel();
        const newModel = state.monaco.editor.createModel(content, lang);
        state.editor.setModel(newModel);
        if (oldModel) oldModel.dispose();

        // Highlight in tree
        document.querySelectorAll('.file-tree-item').forEach(el => {
            if (el.dataset.path === fileItem.path) {
                el.classList.add('bg-zinc-800', 'text-sky-300', 'font-semibold');
            } else {
                el.classList.remove('bg-zinc-800', 'text-sky-300', 'font-semibold');
            }
        });

    } catch (err) {
        console.error(`Failed to open ${fileItem.path}:`, err);
    }
}

// Save File back to Disk (Ctrl+S)
async function handleSaveFile() {
    if (!state.activeFile || !state.activeFile.handle) {
        return;
    }

    try {
        const currentCode = state.editor.getValue();
        const writable = await state.activeFile.handle.createWritable();
        await writable.write(currentCode);
        await writable.close();

        state.activeFile.content = currentCode;
        state.activeFile.isDirty = false;
        showDirtyIndicator(false);

        // Update Virtual Server store
        await saveFileToVirtualServer(state.activeFile.path, currentCode, guessMime(state.activeFile.path));

        // Signal Tab 2 to live reload
        if (state.channel) {
            state.channel.postMessage({ type: 'RELOAD', file: state.activeFile.path });
        }

        updateStatus('Saved to disk ✓', 'success');
        setTimeout(() => {
            updateStatus('⚡ Virtual Server Active', 'success');
        }, 1500);

    } catch (err) {
        console.error('Save to disk failed:', err);
        updateStatus('Save Error: ' + err.message, 'error');
    }
}

// Open Preview in Tab 2
function handleOpenPreview() {
    if (!state.activeEntryHtml) {
        alert('Please select an HTML file to preview!');
        return;
    }

    const previewUrl = new URL(`virtual-server/${state.activeEntryHtml}`, window.location.href);
    console.log('[Tab 1] Opening Preview Tab at:', previewUrl.href);

    // Open in Tab 2
    const previewWindow = window.open(previewUrl.href, '_blank');
    if (!previewWindow) {
        alert('Popup was blocked by your browser. Please allow popups for localhost / this site.');
    } else {
        previewWindow.focus();
    }
}

// Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveFile();
    }
});

// Setup Events
export async function initApp() {
    setupChannel();
    await registerServiceWorker();
    await initMonaco();

    dom.selectFolderBtn?.addEventListener('click', handleSelectFolder);
    dom.saveBtn?.addEventListener('click', handleSaveFile);
    dom.previewBtn?.addEventListener('click', handleOpenPreview);
}

// Start
initApp();

