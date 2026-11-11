/**
 * Monaco IDE V8 - Quick Open File Switcher Palette (Ctrl+P)
 * Powered by declarative dom-primitive-bindings.
 */

import { bindEvents } from '../../core/bindings.js';
import { eventBus } from '../../core/eventBus.js';
import { state } from '../../core/state.js';
import { getFileIconClass } from '../tabs/index.js';
import bindings from './bindings.json' with { type: 'json' };
import actions from './actions.js';

let isOpen = false;
let selectedIndex = 0;
let filteredItems = [];

export function openQuickPalette() {
    const modal = document.getElementById('quickOpenModal');
    const input = document.getElementById('quickOpenInput');
    if (!modal || !input) return;

    isOpen = true;
    modal.classList.remove('hidden');
    input.value = '';
    selectedIndex = 0;
    updateResults('');
    input.focus();
}

export function closeQuickPalette() {
    const modal = document.getElementById('quickOpenModal');
    if (!modal) return;

    isOpen = false;
    modal.classList.add('hidden');
    if (state.editor) state.editor.focus();
}

export function updateResults(query) {
    const lowerQuery = (query || '').toLowerCase().trim();

    const tabItems = state.tabs.map(t => ({
        name: t.name,
        path: t.path || t.name,
        handle: t.handle,
        isTab: true
    }));

    const workspaceItems = state.workspace.fileIndex.map(f => ({
        name: f.name,
        path: f.path,
        handle: f.handle,
        isTab: false
    }));

    const combined = [...tabItems];
    for (const item of workspaceItems) {
        if (!combined.some(c => c.path === item.path)) {
            combined.push(item);
        }
    }

    filteredItems = combined.filter(item => {
        if (!lowerQuery) return true;
        return item.name.toLowerCase().includes(lowerQuery) || item.path.toLowerCase().includes(lowerQuery);
    }).slice(0, 20);

    selectedIndex = Math.min(selectedIndex, Math.max(0, filteredItems.length - 1));
    renderList();
}

export function navigateList(delta) {
    if (filteredItems.length === 0) return;
    selectedIndex = (selectedIndex + delta + filteredItems.length) % filteredItems.length;
    renderList();
}

export function selectActiveItem() {
    if (filteredItems[selectedIndex]) {
        selectItem(filteredItems[selectedIndex]);
    }
}

export function selectItemByIndex(index) {
    if (filteredItems[index]) {
        selectItem(filteredItems[index]);
    }
}

function renderList() {
    const listEl = document.getElementById('quickOpenList');
    if (!listEl) return;

    listEl.innerHTML = '';

    if (filteredItems.length === 0) {
        listEl.innerHTML = '<div class="p-4 text-xs text-zinc-500 text-center">No matching files found</div>';
        return;
    }

    filteredItems.forEach((item, index) => {
        const itemEl = document.createElement('div');
        const isSelected = index === selectedIndex;
        itemEl.className = `quick-open-item px-3 py-2 flex items-center justify-between text-xs cursor-pointer select-none rounded transition ${isSelected ? 'bg-sky-600 text-white' : 'text-zinc-300 hover:bg-zinc-800'}`;
        itemEl.dataset.index = index;

        const leftEl = document.createElement('div');
        leftEl.className = 'flex items-center gap-2 overflow-hidden';

        const icon = document.createElement('i');
        icon.className = getFileIconClass(item.name);
        leftEl.appendChild(icon);

        const nameSpan = document.createElement('span');
        nameSpan.className = 'font-mono font-medium truncate';
        nameSpan.textContent = item.name;
        leftEl.appendChild(nameSpan);

        const pathSpan = document.createElement('span');
        pathSpan.className = `text-[10px] truncate max-w-[200px] ${isSelected ? 'text-sky-100' : 'text-zinc-500'}`;
        pathSpan.textContent = item.path;
        leftEl.appendChild(pathSpan);

        itemEl.appendChild(leftEl);

        if (item.isTab) {
            const badge = document.createElement('span');
            badge.className = `text-[9px] px-1.5 py-0.2 rounded font-mono ${isSelected ? 'bg-sky-800 text-white' : 'bg-zinc-800 text-zinc-400'}`;
            badge.textContent = 'OPEN';
            itemEl.appendChild(badge);
        }

        listEl.appendChild(itemEl);
    });
}

async function selectItem(item) {
    closeQuickPalette();

    if (item.handle) {
        try {
            const file = await item.handle.getFile();
            const text = await file.text();
            eventBus.emit('file:open', {
                name: file.name,
                content: text,
                handle: item.handle,
                path: item.path,
                size: file.size
            });
        } catch (err) {
            console.error('Failed to open file from quick palette:', err);
        }
    } else {
        const tab = state.tabs.find(t => t.path === item.path || t.name === item.name);
        if (tab) eventBus.emit('file:open', tab);
    }
}

export function initQuickOpen() {
    const modalEl = document.getElementById('quickOpenModal');
    if (modalEl) {
        bindEvents(modalEl, bindings, actions);
    }

    eventBus.on('ui:openQuickOpen', openQuickPalette);

    if (state.editor && state.monaco) {
        state.editor.addCommand(state.monaco.KeyMod.CtrlCmd | state.monaco.KeyCode.KeyP, openQuickPalette);
    }

    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
            e.preventDefault();
            if (isOpen) {
                closeQuickPalette();
            } else {
                openQuickPalette();
            }
        }
    });
}

export default initQuickOpen;

