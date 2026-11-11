/**
 * Monaco IDE V4 - Workspace Tree Explorer
 * Uses File System Access API (showDirectoryPicker) to browse
 * and open project files in a collapsible sidebar.
 */

import { getFileIconClass } from './tabManager.js';

let rootDirectoryHandle = null;
let onFileOpenCallback = null;
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

export function setOnFileOpenCallback(cb) {
    onFileOpenCallback = cb;
}

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

async function readDirectoryRecursive(dirHandle, parentEl, level = 0) {
    const entries = [];
    for await (const [name, handle] of dirHandle.entries()) {
        if (IGNORED_ENTRIES.has(name)) continue;
        entries.push({ name, handle, kind: handle.kind });
    }

    // Sort: folders first, then alphabetical
    entries.sort((a, b) => {
        if (a.kind === b.kind) return a.name.localeCompare(b.name);
        return a.kind === 'directory' ? -1 : 1;
    });

    for (const entry of entries) {
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
                        await readDirectoryRecursive(entry.handle, childrenContainer, level + 1);
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
                // Highlight active tree item
                document.querySelectorAll('.sidebar-tree-item.active').forEach(el => el.classList.remove('active'));
                rowEl.classList.add('active');

                if (onFileOpenCallback) {
                    try {
                        const file = await entry.handle.getFile();
                        const text = await file.text();
                        onFileOpenCallback({
                            name: file.name,
                            content: text,
                            handle: entry.handle,
                            size: file.size
                        });
                    } catch (err) {
                        console.error('Failed to open file from tree:', err);
                        alert(`Unable to open ${entry.name}: ${err.message}`);
                    }
                }
            });

            itemEl.appendChild(rowEl);
        }

        parentEl.appendChild(itemEl);
    }
}

export async function openWorkspaceFolder(editor) {
    if (!window.showDirectoryPicker) {
        alert('Your browser does not support the Directory Picker API. Please use Google Chrome, Edge, or Opera.');
        return;
    }

    try {
        rootDirectoryHandle = await window.showDirectoryPicker();
        if (!rootDirectoryHandle) return;

        // Ensure sidebar is visible
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('hidden')) {
            toggleSidebar(editor);
        }

        const treeContainer = document.getElementById('folderTree');
        const folderNameEl = document.getElementById('workspaceName');

        if (folderNameEl) folderNameEl.textContent = rootDirectoryHandle.name;
        if (treeContainer) {
            treeContainer.innerHTML = '';
            await readDirectoryRecursive(rootDirectoryHandle, treeContainer, 0);
        }
    } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Failed to open workspace directory:', err);
    }
}

export function initTreeExplorer(editor, onFileOpen) {
    onFileOpenCallback = onFileOpen;

    const toggleBtn = document.getElementById('sidebarToggleBtn');
    const openFolderBtn = document.getElementById('openFolderBtn');
    const refreshBtn = document.getElementById('refreshTreeBtn');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => toggleSidebar(editor));
    }

    if (openFolderBtn) {
        openFolderBtn.addEventListener('click', () => openWorkspaceFolder(editor));
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            if (rootDirectoryHandle) {
                const treeContainer = document.getElementById('folderTree');
                if (treeContainer) {
                    treeContainer.innerHTML = '';
                    await readDirectoryRecursive(rootDirectoryHandle, treeContainer, 0);
                }
            }
        });
    }

    // Ctrl+B shortcut to toggle sidebar
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
            e.preventDefault();
            toggleSidebar(editor);
        }
    });

    if (editor) {
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
            toggleSidebar(editor);
        });
    }
}

