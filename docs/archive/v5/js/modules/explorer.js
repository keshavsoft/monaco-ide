/**
 * Monaco IDE V5 - Workspace Directory Explorer Module
 * Handles showDirectoryPicker, recursive file indexing, and tree rendering.
 */

import { eventBus } from '../core/eventBus.js';
import { state, setWorkspace, updateFileIndex } from '../core/state.js';
import { getFileIconClass } from './tabs.js';

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

export function toggleSidebar(editor) {
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

    if (editor) {
        setTimeout(() => editor.layout(), 50);
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
        rowEl.className = 'sidebar-tree-item font-mono text-[11px]';
        rowEl.style.paddingLeft = `${level * 12 + 6}px`;

        if (entry.kind === 'directory') {
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
            // File entry
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

            rowEl.addEventListener('click', async () => {
                document.querySelectorAll('.sidebar-tree-item.active').forEach(el => el.classList.remove('active'));
                rowEl.classList.add('active');

                try {
                    const file = await entry.handle.getFile();
                    const text = await file.text();
                    eventBus.emit('file:open', {
                        name: file.name,
                        content: text,
                        handle: entry.handle,
                        path: entryPath,
                        size: file.size
                    });
                } catch (err) {
                    console.error('Failed to open file from tree:', err);
                    alert(`Unable to open ${entry.name}: ${err.message}`);
                }
            });

            itemEl.appendChild(rowEl);
        }

        parentEl.appendChild(itemEl);
    }
}

export async function openWorkspace(editor) {
    if (!window.showDirectoryPicker) {
        alert('Your browser does not support the Directory Picker API. Please use Google Chrome, Edge, or Opera.');
        return;
    }

    try {
        const rootHandle = await window.showDirectoryPicker();
        if (!rootHandle) return;

        setWorkspace(rootHandle);

        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('hidden')) {
            toggleSidebar(editor);
        }

        const treeContainer = document.getElementById('folderTree');
        const folderNameEl = document.getElementById('workspaceName');

        if (folderNameEl) folderNameEl.textContent = rootHandle.name;
        if (treeContainer) {
            treeContainer.innerHTML = '<div class="p-2 text-xs text-zinc-500">Indexing workspace...</div>';
        }

        // Build flat index in background for fast Ctrl+P & Virtual Asset Resolver
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

export function initExplorer(editor, monaco) {
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    const openFolderBtn = document.getElementById('openFolderBtn');
    const refreshBtn = document.getElementById('refreshTreeBtn');

    if (toggleBtn) toggleBtn.addEventListener('click', () => toggleSidebar(editor));
    if (openFolderBtn) openFolderBtn.addEventListener('click', () => openWorkspace(editor));

    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            if (state.workspace.handle) {
                const treeContainer = document.getElementById('folderTree');
                if (treeContainer) {
                    treeContainer.innerHTML = '<div class="p-2 text-xs text-zinc-500">Refreshing...</div>';
                    const fileList = await indexWorkspaceFiles(state.workspace.handle);
                    updateFileIndex(fileList);
                    treeContainer.innerHTML = '';
                    await renderDirectoryRecursive(state.workspace.handle, treeContainer, 0, '');
                }
            }
        });
    }

    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
            e.preventDefault();
            toggleSidebar(editor);
        }
    });

    if (editor) {
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => toggleSidebar(editor));
    }
}

