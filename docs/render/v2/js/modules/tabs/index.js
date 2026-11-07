/**
 * Monaco IDE Single V3 - Single File Manager
 * At any point in time, manages exactly ONE active file buffer in Monaco Editor.
 * Zero multi-tabs, zero tab strip clutter.
 */

import { bindEvents } from '../../core/bindings.js';
import { eventBus } from '../../core/eventBus.js';
import { state, getActiveTab } from '../../core/state.js';
import bindings from './bindings.json' with { type: 'json' };
import actions from './actions.js';

export function detectLanguage(fileName) {
    const ext = String(fileName || '').split('.').pop()?.toLowerCase();
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
        case 'py':
            return 'python';
        case 'sh':
            return 'shell';
        default:
            return 'plaintext';
    }
}

export function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
}

export function getFileIconClass(fileName) {
    const ext = String(fileName || '').split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'json':
            return 'bi bi-filetype-json text-amber-400';
        case 'js':
        case 'mjs':
        case 'cjs':
            return 'bi bi-filetype-js text-yellow-400';
        case 'ts':
        case 'tsx':
            return 'bi bi-filetype-tsx text-blue-400';
        case 'html':
        case 'htm':
            return 'bi bi-filetype-html text-orange-400';
        case 'css':
        case 'scss':
        case 'less':
            return 'bi bi-filetype-css text-sky-400';
        case 'md':
            return 'bi bi-filetype-md text-emerald-400';
        case 'xml':
        case 'svg':
            return 'bi bi-filetype-xml text-purple-400';
        case 'sql':
            return 'bi bi-filetype-sql text-indigo-400';
        case 'py':
            return 'bi bi-filetype-py text-emerald-300';
        default:
            return 'bi bi-file-earmark-code text-zinc-400';
    }
}

export function updateHeaderStatus() {
    const tab = getActiveTab();
    const fileNameEl = document.getElementById('fileName');
    const fileSizeEl = document.getElementById('fileSize');
    const fileIconEl = document.getElementById('fileIcon');
    const dirtyDotEl = document.getElementById('dirtyDot');

    if (!tab) {
        if (fileNameEl) fileNameEl.textContent = 'Untitled';
        if (fileSizeEl) fileSizeEl.textContent = '0 B';
        if (dirtyDotEl) dirtyDotEl.classList.add('hidden');
        document.title = 'Monaco IDE Single V3';
        return;
    }

    if (fileNameEl) fileNameEl.textContent = tab.name;
    if (fileSizeEl) fileSizeEl.textContent = formatBytes(tab.size || 0);

    if (fileIconEl) {
        fileIconEl.className = `${getFileIconClass(tab.name)} text-xs`;
    }

    if (dirtyDotEl) {
        if (tab.isDirty) dirtyDotEl.classList.remove('hidden');
        else dirtyDotEl.classList.add('hidden');
    }

    const baseTitle = `${tab.name} — Monaco IDE Single V3`;
    document.title = tab.isDirty ? `• ${baseTitle}` : baseTitle;
}

export function showSavedFeedback() {
    const saveStatusEl = document.getElementById('saveStatus');
    if (!saveStatusEl) return;
    saveStatusEl.classList.remove('hidden');
    setTimeout(() => {
        saveStatusEl.classList.add('hidden');
    }, 1800);
}

/**
 * Loads a single file into the editor, cleanly replacing any previous file.
 */
export function loadFile({ name, content = '', language = null, handle = null, path = '', size = 0 }) {
    if (!state.editor || !state.monaco) return null;

    // Dispose old model if exists
    const currentTab = getActiveTab();
    if (currentTab && currentTab.model) {
        currentTab.model.dispose();
    }

    const lang = language || detectLanguage(name);
    const model = state.monaco.editor.createModel(content, lang);

    const singleTab = {
        id: 1,
        name: name || 'Untitled',
        path: path || name || 'Untitled',
        handle,
        model,
        size: size || new Blob([content]).size,
        isDirty: false,
        lastSavedContent: content
    };

    // Keep single file in state
    state.tabs = [singleTab];
    state.activeTabId = 1;

    state.editor.setModel(model);

    // Watch for edits to toggle dirty indicator
    model.onDidChangeContent(() => {
        const text = model.getValue();
        singleTab.isDirty = text !== singleTab.lastSavedContent;
        singleTab.size = new Blob([text]).size;
        updateHeaderStatus();
        eventBus.emit('model:contentChanged', singleTab);
    });

    updateHeaderStatus();
    eventBus.emit('file:loaded', singleTab);
    return singleTab;
}

// Alias for initial bootstrapper compatibility
export const createTab = loadFile;

/**
 * Save active file directly to disk via File System Access API
 */
export async function saveActiveFile() {
    const tab = getActiveTab();
    if (!tab || !tab.model) return;

    const content = tab.model.getValue();

    try {
        if (tab.handle && tab.handle.createWritable) {
            const writable = await tab.handle.createWritable();
            await writable.write(content);
            await writable.close();

            tab.lastSavedContent = content;
            tab.isDirty = false;
            tab.size = new Blob([content]).size;

            showSavedFeedback();
            updateHeaderStatus();
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
                updateHeaderStatus();
                eventBus.emit('file:saved', tab);
                return;
            } catch (err) {
                if (err.name === 'AbortError') return;
                console.warn('showSaveFilePicker fallback:', err);
            }
        }

        // Fallback: browser download
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = tab.name || 'document.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        tab.lastSavedContent = content;
        tab.isDirty = false;
        showSavedFeedback();
        updateHeaderStatus();
        eventBus.emit('file:saved', tab);
    } catch (err) {
        console.error('Failed to save file:', err);
        alert(`Failed to save ${tab.name}: ${err.message}`);
    }
}

/**
 * Open single file from disk
 */
export async function openFiles() {
    if (window.showOpenFilePicker) {
        try {
            const [handle] = await window.showOpenFilePicker({
                multiple: false,
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

            if (!handle) return;
            const file = await handle.getFile();
            const text = await file.text();

            loadFile({
                name: file.name,
                content: text,
                handle,
                path: file.name,
                size: file.size
            });
            return;
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.warn('showOpenFilePicker failed, falling back to input:', err);
        }
    }

    // Fallback: trigger file input
    const input = document.getElementById('fileInput');
    if (input) input.click();
}

export function handleFileInput(event) {
    const input = event.target;
    if (!input || !input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
        loadFile({
            name: file.name,
            content: reader.result,
            path: file.name,
            size: file.size
        });
        input.value = '';
    };
    reader.readAsText(file);
}

export function initTabs() {
    const container = document.body;
    if (container) {
        bindEvents(container, bindings, actions);
    }

    // Subscribe to events
    eventBus.on('ui:openFiles', openFiles);
    eventBus.on('ui:saveFile', saveActiveFile);

    // Save shortcut (Ctrl+S)
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
            saveActiveFile();
        }
    });

    // Open shortcut (Ctrl+O)
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
            e.preventDefault();
            openFiles();
        }
    });

    if (state.editor && state.monaco) {
        state.editor.addCommand(state.monaco.KeyMod.CtrlCmd | state.monaco.KeyCode.KeyS, saveActiveFile);
        state.editor.addCommand(state.monaco.KeyMod.CtrlCmd | state.monaco.KeyCode.KeyO, openFiles);
    }
}

export default initTabs;
