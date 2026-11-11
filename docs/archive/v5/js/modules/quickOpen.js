/**
 * Monaco IDE V5 - Quick Open / File Switcher Palette (Ctrl+P)
 * Fuzzy search across all workspace files and open tabs.
 */

import { eventBus } from '../core/eventBus.js';
import { state } from '../core/state.js';
import { getFileIconClass } from './tabs.js';

let isOpen = false;
let selectedIndex = 0;
let filteredItems = [];

export function openQuickPalette() {
    const palette = document.getElementById('quickOpenModal');
    const input = document.getElementById('quickOpenInput');
    if (!palette || !input) return;

    isOpen = true;
    palette.classList.remove('hidden');
    input.value = '';
    selectedIndex = 0;
    updateResults('');
    input.focus();
}

export function closeQuickPalette() {
    const palette = document.getElementById('quickOpenModal');
    if (!palette) return;

    isOpen = false;
    palette.classList.add('hidden');
    if (state.editor) state.editor.focus();
}

function updateResults(query) {
    const listEl = document.getElementById('quickOpenList');
    if (!listEl) return;

    const lowerQuery = query.toLowerCase().trim();

    // Source 1: Open tabs
    const tabItems = state.tabs.map(t => ({
        name: t.name,
        path: t.path || t.name,
        handle: t.handle,
        isTab: true
    }));

    // Source 2: Indexed workspace files
    const workspaceItems = state.workspace.fileIndex.map(f => ({
        name: f.name,
        path: f.path,
        handle: f.handle,
        isTab: false
    }));

    // Combine and deduplicate
    const combined = [...tabItems];
    for (const item of workspaceItems) {
        if (!combined.some(c => c.path === item.path)) {
            combined.push(item);
        }
    }

    // Filter by query
    filteredItems = combined.filter(item => {
        if (!lowerQuery) return true;
        return item.name.toLowerCase().includes(lowerQuery) || item.path.toLowerCase().includes(lowerQuery);
    }).slice(0, 20); // Top 20 results

    selectedIndex = Math.min(selectedIndex, Math.max(0, filteredItems.length - 1));
    renderList();
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
        itemEl.className = `px-3 py-2 flex items-center justify-between text-xs cursor-pointer select-none rounded transition ${isSelected ? 'bg-sky-600 text-white' : 'text-zinc-300 hover:bg-zinc-800'}`;

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

        itemEl.addEventListener('click', () => {
            selectItem(item);
        });

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
            console.error('Failed to open file via quick palette:', err);
        }
    } else {
        // Tab without handle
        const tab = state.tabs.find(t => t.path === item.path || t.name === item.name);
        if (tab) eventBus.emit('file:open', tab);
    }
}

export function initQuickOpen(editor, monaco) {
    const input = document.getElementById('quickOpenInput');
    const backdrop = document.getElementById('quickOpenBackdrop');

    if (input) {
        input.addEventListener('input', (e) => {
            selectedIndex = 0;
            updateResults(e.target.value);
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = (selectedIndex + 1) % Math.max(1, filteredItems.length);
                renderList();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = (selectedIndex - 1 + filteredItems.length) % Math.max(1, filteredItems.length);
                renderList();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredItems[selectedIndex]) {
                    selectItem(filteredItems[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                closeQuickPalette();
            }
        });
    }

    if (backdrop) {
        backdrop.addEventListener('click', closeQuickPalette);
    }

    // Ctrl+P keyboard shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP, openQuickPalette);
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

