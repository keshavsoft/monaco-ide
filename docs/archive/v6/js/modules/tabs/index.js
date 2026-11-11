/**
 * Monaco IDE V6 - Tabs & Buffer Management Module
 * Powered by declarative dom-primitive-bindings.
 */

import { bindEvents } from '../../core/bindings.js';
import { eventBus } from '../../core/eventBus.js';
import { state, getActiveTab } from '../../core/state.js';
import bindings from './bindings.json' with { type: 'json' };
import actions from './actions.js';

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

function updateHeaderStatus() {
    const tab = getActiveTab();
    const nameEl = document.getElementById('fileName');
    const sizeEl = document.getElementById('fileSize');
    const iconEl = document.getElementById('fileIcon');
    const dirtyDot = document.getElementById('dirtyDot');
    const tabCountEl = document.getElementById('tabCount');

    if (tabCountEl) {
        tabCountEl.textContent = `${state.tabs.length} ${state.tabs.length === 1 ? 'file' : 'files'}`;
    }

    if (!tab) {
        if (nameEl) nameEl.textContent = 'No file open';
        if (sizeEl) sizeEl.textContent = '0 B';
        if (iconEl) iconEl.className = 'bi bi-file-earmark text-zinc-500';
        if (dirtyDot) dirtyDot.classList.add('hidden');
        document.title = 'Monaco IDE V6';
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

    const baseTitle = `${tab.name} — Monaco IDE V6`;
    document.title = tab.isDirty ? `• ${baseTitle}` : baseTitle;
}

export function renderTabStrip() {
    const strip = document.getElementById('tabStrip');
    if (!strip) return;

    strip.innerHTML = '';

    state.tabs.forEach(tab => {
        const isActive = tab.id === state.activeTabId;
        const tabEl = document.createElement('div');
        tabEl.dataset.tabId = tab.id;
        tabEl.className = `tab-item h-full px-3 flex items-center gap-2 border-r border-zinc-800 text-xs cursor-pointer transition select-none ${isActive ? 'tab-active' : 'tab-inactive'}`;
        tabEl.title = tab.path || tab.name;

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

        // Close button (declarative selector: .tab-close-btn)
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'tab-close-btn ml-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700/60 rounded p-0.5 transition flex items-center justify-center';
        closeBtn.title = 'Close (Ctrl+W)';
        closeBtn.innerHTML = '<i class="bi bi-x text-sm leading-none"></i>';
        tabEl.appendChild(closeBtn);

        strip.appendChild(tabEl);
    });

    updateHeaderStatus();
}

export function switchTab(tabId) {
    const tab = state.tabs.find(t => t.id === tabId);
    if (!tab) return;

    state.activeTabId = tab.id;
    if (state.editor && tab.model) {
        state.editor.setModel(tab.model);
    }

    renderTabStrip();
    eventBus.emit('tab:activated', tab);
}

export function createTab({ name, content = '', handle = null, path = '', language = null, size = 0 }) {
    if (!state.monaco) return null;

    const lang = language || detectLanguage(name);
    const model = state.monaco.editor.createModel(content, lang);

    const newTab = {
        id: `tab-${tabIdCounter++}`,
        name,
        path: path || name,
        handle,
        model,
        lastSavedContent: content,
        isDirty: false,
        size: size || new Blob([content]).size
    };

    model.onDidChangeContent(() => {
        const currentContent = model.getValue();
        const dirty = currentContent !== newTab.lastSavedContent;
        if (newTab.isDirty !== dirty) {
            newTab.isDirty = dirty;
            renderTabStrip();
            eventBus.emit('tab:dirty', newTab);
        }
        eventBus.emit('model:contentChanged', newTab);
    });

    state.tabs.push(newTab);
    switchTab(newTab.id);
    return newTab;
}

export function openOrSwitchTab(fileData) {
    const { name, handle, path } = fileData;
    const existing = state.tabs.find(t =>
        (handle && t.handle && t.handle.name === handle.name) ||
        (path && t.path === path) ||
        (!handle && !path && t.name === name)
    );

    if (existing) {
        switchTab(existing.id);
        return existing;
    }

    return createTab(fileData);
}

export function closeTab(tabId) {
    const tabIndex = state.tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;

    const tab = state.tabs[tabIndex];

    if (tab.isDirty) {
        const discard = confirm(`"${tab.name}" has unsaved changes.\nAre you sure you want to discard your changes and close?`);
        if (!discard) return;
    }

    if (tab.model) {
        tab.model.dispose();
    }

    state.tabs.splice(tabIndex, 1);
    eventBus.emit('tab:closed', tab);

    if (state.activeTabId === tabId) {
        if (state.tabs.length > 0) {
            const nextTab = state.tabs[Math.min(tabIndex, state.tabs.length - 1)];
            switchTab(nextTab.id);
        } else {
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
    setTimeout(() => statusEl.classList.add('hidden'), 2000);
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
            const writable = await tab.handle.createWritable();
            await writable.write(content);
            await writable.close();

            tab.lastSavedContent = content;
            tab.isDirty = false;
            tab.size = new Blob([content]).size;

            showSavedFeedback();
            renderTabStrip();
            eventBus.emit('file:saved', tab);
            return;
        }

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
                eventBus.emit('file:saved', tab);
                return;
            } catch (err) {
                if (err.name === 'AbortError') return;
                console.warn('showSaveFilePicker failed, fallback to download:', err);
            }
        }

        downloadAsBlob(content, tab.name);
        tab.lastSavedContent = content;
        tab.isDirty = false;
        tab.size = new Blob([content]).size;

        showSavedFeedback();
        renderTabStrip();
        eventBus.emit('file:saved', tab);
    } catch (err) {
        console.error('Failed to save file:', err);
        alert(`Failed to save ${tab.name}: ${err.message}`);
    }
}

export async function openFiles() {
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
                const file = await handle.getFile();
                const text = await file.text();
                openOrSwitchTab({
                    name: file.name,
                    content: text,
                    handle,
                    path: file.name,
                    size: file.size
                });
            }
            return;
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.warn('showOpenFilePicker failed, fallback to input:', err);
        }
    }

    const input = document.getElementById('fileInput');
    if (input) input.click();
}

export function formatActiveDocument() {
    if (!state.editor) return;
    const action = state.editor.getAction('editor.action.formatDocument');
    if (action) action.run();
}

export function initTabs() {
    const tabStripContainer = document.getElementById('tabStripContainer') || document.querySelector('nav');
    if (tabStripContainer) {
        bindEvents(tabStripContainer, bindings, actions);
    }

    // Bind hidden file input
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        bindEvents(document.body, [
            { event: 'change', selector: '#fileInput', action: 'handleFileInput' }
        ], actions);
    }

    // Subscribe to events from Header, Explorer, QuickOpen
    eventBus.on('ui:saveActiveFile', saveActiveFile);
    eventBus.on('ui:openFiles', openFiles);
    eventBus.on('ui:formatActiveDocument', formatActiveDocument);
    eventBus.on('file:open', (fileData) => openOrSwitchTab(fileData));

    // Keyboard shortcuts
    if (state.editor && state.monaco) {
        state.editor.addCommand(state.monaco.KeyMod.CtrlCmd | state.monaco.KeyCode.KeyS, saveActiveFile);
        state.editor.addCommand(state.monaco.KeyMod.CtrlCmd | state.monaco.KeyCode.KeyO, openFiles);
        state.editor.addCommand(state.monaco.KeyMod.CtrlCmd | state.monaco.KeyCode.KeyW, () => {
            if (state.activeTabId) closeTab(state.activeTabId);
        });
    }

    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
            saveActiveFile();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
            e.preventDefault();
            openFiles();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w') {
            e.preventDefault();
            if (state.activeTabId) closeTab(state.activeTabId);
        }
    });

    window.addEventListener('beforeunload', (e) => {
        const hasDirty = state.tabs.some(t => t.isDirty);
        if (hasDirty) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

export default initTabs;

