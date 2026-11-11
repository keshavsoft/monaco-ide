/**
 * Monaco IDE V6 - Workspace Directory Explorer
 * Uses dom-primitive-bindings for all user interactions.
 */

import { bindEvents } from '../../core/bindings.js';
import { eventBus } from '../../core/eventBus.js';
import { state, setWorkspace, updateFileIndex } from '../../core/state.js';
import { getFileIconClass } from '../tabs/index.js';
import bindings from './bindings.json' with { type: 'json' };
import actions from './actions.js';

let isSidebarOpen = true;

const IGNORED_ENTRIES = new Set([
    '.git',
    'node_modules',
    '.gemini',
    '.vscode',
    'dist',
    '.cache',
    '.system_generated'
]);

export function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    if (!sidebar) return;

    isSidebarOpen = !isSidebarOpen;
    if (isSidebarOpen) {
        sidebar.classList.remove('hidden');
        if (toggleBtn) toggleBtn.classList.add('bg-zinc-800');
    } else {
        sidebar.classList.add('hidden');
        if (toggleBtn) toggleBtn.classList.remove('bg-zinc-800');
    }

    if (state.editor) {
        setTimeout(() => state.editor.layout(), 50);
    }
}

async function indexWorkspaceFiles(dirHandle, currentPath = '', flatList = []) {
    for await (const [name, handle] of dirHandle.entries()) {
        if (IGNORED_ENTRIES.has(name)) continue;
        const entryPath = currentPath ? `${currentPath}/${name}` : name;

        if (handle.kind === 'file') {
            flatList.push({ name, path: entryPath, handle });
        } else if (handle.kind === 'directory') {
            await indexWorkspaceFiles(handle, entryPath, flatList);
        }
    }
    return flatList;
}

async function renderDirectoryRecursive(dirHandle, parentEl, level = 0, currentPath = '') {
    const entries = [];
    for await (const [name, handle] of dirHandle.entries()) {
        if (IGNORED_ENTRIES.has(name)) continue;
        entries.push({ name, handle, kind: handle.kind });
    }

    entries.sort((a, b) => {
        if (a.kind === b.kind) return a.name.localeCompare(b.name);
        return a.kind === 'directory' ? -1 : 1;
    });

    for (const entry of entries) {
        const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
        const itemEl = document.createElement('div');
        itemEl.className = 'flex flex-col select-none';

        const rowEl = document.createElement('div');
        rowEl.style.paddingLeft = `${level * 12 + 6}px`;

        if (entry.kind === 'directory') {
            rowEl.className = 'sidebar-tree-item font-mono text-[11px]';
            const toggleIcon = document.createElement('i');
            toggleIcon.className = 'bi bi-chevron-right folder-toggle';

            const folderIcon = document.createElement('i');
            folderIcon.className = 'bi bi-folder-fill text-amber-400 text-xs';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'truncate text-zinc-300';
            nameSpan.textContent = entry.name;

            rowEl.appendChild(toggleIcon);
            rowEl.appendChild(folderIcon);
            rowEl.appendChild(nameSpan);

            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'hidden flex flex-col';

            let isExpanded = false;
            let isLoaded = false;

            rowEl.addEventListener('click', async () => {
                isExpanded = !isExpanded;
                if (isExpanded) {
                    toggleIcon.classList.add('expanded');
                    folderIcon.className = 'bi bi-folder2-open text-amber-400 text-xs';
                    childrenContainer.classList.remove('hidden');

                    if (!isLoaded) {
                        await renderDirectoryRecursive(entry.handle, childrenContainer, level + 1, entryPath);
                        isLoaded = true;
                    }
                } else {
                    toggleIcon.classList.remove('expanded');
                    folderIcon.className = 'bi bi-folder-fill text-amber-400 text-xs';
                    childrenContainer.classList.add('hidden');
                }
            });

            itemEl.appendChild(rowEl);
            itemEl.appendChild(childrenContainer);
        } else {
            // File entry (declarative class sidebar-file-item)
            rowEl.className = 'sidebar-tree-item sidebar-file-item font-mono text-[11px]';
            rowEl.dataset.path = entryPath;

            const fileSpacer = document.createElement('span');
            fileSpacer.className = 'w-[14px] inline-block';

            const fileIcon = document.createElement('i');
            fileIcon.className = `${getFileIconClass(entry.name)} text-xs`;

            const nameSpan = document.createElement('span');
            nameSpan.className = 'truncate text-zinc-400 hover:text-zinc-100';
            nameSpan.textContent = entry.name;

            rowEl.appendChild(fileSpacer);
            rowEl.appendChild(fileIcon);
            rowEl.appendChild(nameSpan);

            itemEl.appendChild(rowEl);
        }

        parentEl.appendChild(itemEl);
    }
}

export async function refreshExplorer() {
    if (!state.workspace.handle) return;
    const treeContainer = document.getElementById('folderTree');
    if (treeContainer) {
        treeContainer.innerHTML = '<div class="p-2 text-xs text-zinc-500">Refreshing...</div>';
        const fileList = await indexWorkspaceFiles(state.workspace.handle);
        updateFileIndex(fileList);
        treeContainer.innerHTML = '';
        await renderDirectoryRecursive(state.workspace.handle, treeContainer, 0, '');
    }
}

export async function openWorkspace() {
    if (!window.showDirectoryPicker) {
        alert('Directory Picker API is supported in Chrome, Edge, and Opera.');
        return;
    }

    try {
        const rootHandle = await window.showDirectoryPicker();
        if (!rootHandle) return;

        setWorkspace(rootHandle);

        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('hidden')) {
            toggleSidebar();
        }

        const treeContainer = document.getElementById('folderTree');
        const folderNameEl = document.getElementById('workspaceName');

        if (folderNameEl) folderNameEl.textContent = rootHandle.name;
        if (treeContainer) {
            treeContainer.innerHTML = '<div class="p-2 text-xs text-zinc-500">Indexing workspace...</div>';
        }

        const fileList = await indexWorkspaceFiles(rootHandle);
        updateFileIndex(fileList);

        if (treeContainer) {
            treeContainer.innerHTML = '';
            await renderDirectoryRecursive(rootHandle, treeContainer, 0, '');
        }

        eventBus.emit('workspace:opened', rootHandle);
    } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Failed to open workspace directory:', err);
    }
}

export function initExplorer() {
    const sidebarEl = document.getElementById('sidebar');
    if (sidebarEl) {
        bindEvents(sidebarEl, bindings, actions);
    }

    // Subscribe to events
    eventBus.on('ui:toggleSidebar', toggleSidebar);
    eventBus.on('ui:openFolder', openWorkspace);

    eventBus.on('explorer:fileClicked', async ({ path, element }) => {
        document.querySelectorAll('.sidebar-tree-item.active').forEach(el => el.classList.remove('active'));
        if (element) element.classList.add('active');

        const matched = state.workspace.fileIndex.find(f => f.path === path);
        if (matched) {
            try {
                const file = await matched.handle.getFile();
                const text = await file.text();
                eventBus.emit('file:open', {
                    name: file.name,
                    content: text,
                    handle: matched.handle,
                    path: matched.path,
                    size: file.size
                });
            } catch (err) {
                console.error('Failed to open file from tree:', err);
                alert(`Unable to open ${matched.name}: ${err.message}`);
            }
        }
    });

    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
            e.preventDefault();
            toggleSidebar();
        }
    });

    if (state.editor && state.monaco) {
        state.editor.addCommand(state.monaco.KeyMod.CtrlCmd | state.monaco.KeyCode.KeyB, toggleSidebar);
    }
}

export default initExplorer;

