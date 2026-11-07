/**
 * Monaco IDE V9 - Central State Store
 * Single source of truth for workspace metadata, tabs, and file index.
 */

export const state = {
    workspace: {
        handle: null,
        name: 'Workspace',
        fileIndex: [] // Array of { name, path, handle } for fast Ctrl+P and asset resolution
    },
    tabs: [],
    activeTabId: null,
    editor: null,
    monaco: null
};

export function getActiveTab() {
    return state.tabs.find(t => t.id === state.activeTabId) || null;
}

export function setWorkspace(handle) {
    state.workspace.handle = handle;
    state.workspace.name = handle ? handle.name : 'Workspace';
}

export function updateFileIndex(index) {
    state.workspace.fileIndex = index;
}

/**
 * Searches the workspace for a file matching a relative path or filename.
 */
export async function resolveWorkspaceFile(relativePath, contextPath = '') {
    if (!state.workspace.handle && state.workspace.fileIndex.length === 0) return null;

    const cleanPath = relativePath.replace(/^(\.\/|\/)/, '').trim();
    const fileName = cleanPath.split('/').pop().toLowerCase();

    // 1. Check indexed workspace files (exact match, path ending, or filename)
    const matched = state.workspace.fileIndex.find(f => {
        const norm = f.path.replace(/\\/g, '/').toLowerCase();
        return norm.endsWith(cleanPath.toLowerCase()) || f.name.toLowerCase() === fileName;
    });

    if (matched) {
        try {
            const file = await matched.handle.getFile();
            return { file, text: await file.text(), handle: matched.handle, path: matched.path };
        } catch (err) {
            console.warn('Failed to read matched workspace file:', err);
        }
    }

    // 2. Direct directory traversal if root handle exists
    if (state.workspace.handle) {
        try {
            const parts = cleanPath.split('/').filter(Boolean);
            let currentDir = state.workspace.handle;

            for (let i = 0; i < parts.length - 1; i++) {
                currentDir = await currentDir.getDirectoryHandle(parts[i]);
            }

            const targetHandle = await currentDir.getFileHandle(parts[parts.length - 1]);
            const file = await targetHandle.getFile();
            return { file, text: await file.text(), handle: targetHandle, path: cleanPath };
        } catch {
            // Not found
        }
    }

    return null;
}

export default state;

