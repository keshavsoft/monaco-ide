/**
 * Monaco IDE V2 - File System Access & File Management Module
 * Supports Native Disk Save, Direct File System Access API,
 * Dirty state tracking, formatting, and graceful fallbacks.
 */

let currentFileHandle = null;
let currentFileName = 'sample.json';
let lastSavedContent = '';
let isDirty = false;

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
            return 'css';
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
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function updateFileIcon(fileName) {
    const iconEl = document.getElementById('fileIcon');
    if (!iconEl) return;

    const lang = detectLanguage(fileName);
    switch (lang) {
        case 'json':
            iconEl.className = 'bi bi-filetype-json text-amber-400';
            break;
        case 'javascript':
            iconEl.className = 'bi bi-filetype-js text-yellow-400';
            break;
        case 'typescript':
            iconEl.className = 'bi bi-filetype-tsx text-sky-400';
            break;
        case 'html':
            iconEl.className = 'bi bi-filetype-html text-orange-400';
            break;
        case 'css':
            iconEl.className = 'bi bi-filetype-css text-blue-400';
            break;
        case 'markdown':
            iconEl.className = 'bi bi-filetype-md text-emerald-400';
            break;
        case 'xml':
            iconEl.className = 'bi bi-filetype-xml text-teal-400';
            break;
        default:
            iconEl.className = 'bi bi-file-earmark-code text-zinc-400';
    }
}

function setDirtyState(dirty) {
    isDirty = dirty;
    const dirtyDot = document.getElementById('dirtyDot');
    const saveBtn = document.getElementById('saveFileBtn');

    if (dirtyDot) {
        if (dirty) {
            dirtyDot.classList.remove('hidden');
        } else {
            dirtyDot.classList.add('hidden');
        }
    }

    if (saveBtn) {
        if (dirty) {
            saveBtn.classList.remove('opacity-75');
            saveBtn.classList.add('ring-1', 'ring-emerald-400/50');
        } else {
            saveBtn.classList.add('opacity-75');
            saveBtn.classList.remove('ring-1', 'ring-emerald-400/50');
        }
    }

    const baseTitle = `${currentFileName} — Monaco IDE V2`;
    document.title = dirty ? `• ${baseTitle}` : baseTitle;
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

function updateFileBadge(fileName, sizeInBytes) {
    const nameEl = document.getElementById('fileName');
    const sizeEl = document.getElementById('fileSize');

    if (nameEl) nameEl.textContent = fileName;
    if (sizeEl) sizeEl.textContent = formatBytes(sizeInBytes);
    updateFileIcon(fileName);
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

export async function openFile(editor, monaco) {
    // Attempt File System Access API first for native disk persistence
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

            currentFileHandle = handle;
            currentFileName = file.name;
            lastSavedContent = text;

            const lang = detectLanguage(file.name);
            const model = editor.getModel();
            if (model) {
                monaco.editor.setModelLanguage(model, lang);
                model.setValue(text);
            }

            updateFileBadge(file.name, file.size);
            setDirtyState(false);
            return;
        } catch (err) {
            if (err.name === 'AbortError') {
                return; // User cancelled dialog
            }
            console.warn('showOpenFilePicker failed, falling back to input[type=file]:', err);
        }
    }

    // Fallback for browsers without File System Access API
    const input = document.getElementById('fileInput');
    if (input) input.click();
}

export async function saveFile(editor) {
    if (!editor) return;
    const model = editor.getModel();
    if (!model) return;

    const content = model.getValue();

    try {
        if (currentFileHandle) {
            // Native direct disk save via File System Access API
            const writable = await currentFileHandle.createWritable();
            await writable.write(content);
            await writable.close();

            lastSavedContent = content;
            setDirtyState(false);
            showSavedFeedback();

            // Refresh file size
            const sizeInBytes = new Blob([content]).size;
            const sizeEl = document.getElementById('fileSize');
            if (sizeEl) sizeEl.textContent = formatBytes(sizeInBytes);
            return;
        }

        // If no file handle exists yet (e.g. loaded default sample or opened via input[type=file])
        if (window.showSaveFilePicker) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: currentFileName || 'document.json'
                });
                const writable = await handle.createWritable();
                await writable.write(content);
                await writable.close();

                currentFileHandle = handle;
                currentFileName = handle.name;
                lastSavedContent = content;

                setDirtyState(false);
                showSavedFeedback();

                const sizeInBytes = new Blob([content]).size;
                updateFileBadge(currentFileName, sizeInBytes);
                return;
            } catch (err) {
                if (err.name === 'AbortError') return;
                console.warn('showSaveFilePicker failed, falling back to download:', err);
            }
        }

        // Browser download fallback
        downloadAsBlob(content, currentFileName);
        lastSavedContent = content;
        setDirtyState(false);
        showSavedFeedback();
    } catch (err) {
        console.error('Failed to save file:', err);
        alert(`Failed to save ${currentFileName}: ${err.message}`);
    }
}

export function formatCode(editor) {
    if (!editor) return;
    const action = editor.getAction('editor.action.formatDocument');
    if (action) {
        action.run();
    }
}

export function initFilePicker(editor, monaco) {
    const openBtn = document.getElementById('openFileBtn') || document.getElementById('selectFileBtn');
    const saveBtn = document.getElementById('saveFileBtn');
    const formatBtn = document.getElementById('formatBtn');
    const input = document.getElementById('fileInput');

    // Register dirty listener on model changes
    const model = editor.getModel();
    if (model) {
        lastSavedContent = model.getValue();
        model.onDidChangeContent(() => {
            const isModified = model.getValue() !== lastSavedContent;
            setDirtyState(isModified);
        });
    }

    // Open button
    if (openBtn) {
        openBtn.addEventListener('click', () => openFile(editor, monaco));
    }

    // Fallback file input change listener
    if (input) {
        input.addEventListener('change', async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;

            try {
                const text = await file.text();
                currentFileHandle = null; // Standard input doesn't provide a writable handle
                currentFileName = file.name;
                lastSavedContent = text;

                const lang = detectLanguage(file.name);
                const curModel = editor.getModel();
                if (curModel) {
                    monaco.editor.setModelLanguage(curModel, lang);
                    curModel.setValue(text);
                }

                updateFileBadge(file.name, file.size);
                setDirtyState(false);
            } catch (error) {
                console.error('Failed to read file:', error);
                alert(`Unable to open ${file.name}: ${error.message}`);
            } finally {
                input.value = '';
            }
        });
    }

    // Save button
    if (saveBtn) {
        saveBtn.addEventListener('click', () => saveFile(editor));
    }

    // Format button
    if (formatBtn) {
        formatBtn.addEventListener('click', () => formatCode(editor));
    }

    // Keyboard Shortcuts: Ctrl+S to save, Ctrl+O to open
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        saveFile(editor);
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyO, () => {
        openFile(editor, monaco);
    });

    // Global keyboard listener so Ctrl+S works even when editor doesn't have focus
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
            saveFile(editor);
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
            e.preventDefault();
            openFile(editor, monaco);
        }
    });

    // Warning before closing tab if there are unsaved edits
    window.addEventListener('beforeunload', (e) => {
        if (isDirty) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

export default initFilePicker;
