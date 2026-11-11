import { initFilePicker } from './filePicker.js';

let editor = null;
let monacoInstance = null;

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

async function loadInitialSample() {
    try {
        const res = await fetch('./sample.json');
        if (!res.ok) return '{\n  "title": "Welcome to Monaco IDE V1"\n}\n';
        const json = await res.json();
        return JSON.stringify(json, null, 2) + '\n';
    } catch {
        return '{\n  "title": "Welcome to Monaco IDE V1"\n}\n';
    }
}

async function startIDE() {
    try {
        monacoInstance = await loadMonaco();
        const initialCode = await loadInitialSample();

        const model = monacoInstance.editor.createModel(initialCode, 'json');
        const container = document.getElementById('jsonEditor');

        editor = monacoInstance.editor.create(container, {
            theme: 'vs-dark',
            model,
            automaticLayout: true,
            tabSize: 2,
            fontSize: 13,
            lineNumbers: 'on',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            cursorBlinking: 'smooth',
            renderLineHighlight: 'all',
            padding: { top: 8 }
        });

        // Initialize file picker
        initFilePicker(editor, monacoInstance);

        // Update initial file size
        const sizeEl = document.getElementById('fileSize');
        if (sizeEl) {
            const bytes = new Blob([initialCode]).size;
            sizeEl.textContent = `${(bytes / 1024).toFixed(1)} KB`;
        }
    } catch (error) {
        console.error('Monaco IDE initialization failed:', error);
        const container = document.getElementById('jsonEditor');
        if (container) {
            container.innerHTML = `<div style="padding: 20px; color: #ef4444; font-family: monospace;">Failed to initialize Monaco Editor: ${error.message}</div>`;
        }
    }
}

startIDE();

export { editor, monacoInstance };

