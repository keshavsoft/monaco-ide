import { state } from './core/state.js';
import { initTabs, createTab } from './modules/tabs.js';
import { initExplorer } from './modules/explorer.js';
import { initPreview } from './modules/preview.js';
import { initStatusBar } from './modules/statusBar.js';
import { initQuickOpen } from './modules/quickOpen.js';

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
        if (!res.ok) return '{\n  "project": "Monaco IDE",\n  "version": "5.0.0"\n}\n';
        const json = await res.json();
        return JSON.stringify(json, null, 2) + '\n';
    } catch {
        return '{\n  "project": "Monaco IDE",\n  "version": "5.0.0"\n}\n';
    }
}

async function startIDE() {
    try {
        monacoInstance = await loadMonaco();
        const initialCode = await loadInitialSample();
        const container = document.getElementById('jsonEditor');

        editor = monacoInstance.editor.create(container, {
            theme: 'vs-dark',
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

        // Store instances in central state
        state.editor = editor;
        state.monaco = monacoInstance;

        // Initialize modular feature engines
        initTabs(editor, monacoInstance);
        initExplorer(editor, monacoInstance);
        initPreview(editor, monacoInstance);
        initStatusBar(editor, monacoInstance);
        initQuickOpen(editor, monacoInstance);

        // Seed initial sample.json
        createTab({
            name: 'sample.json',
            content: initialCode,
            language: 'json'
        });

    } catch (error) {
        console.error('Monaco IDE V5 initialization failed:', error);
        const container = document.getElementById('jsonEditor');
        if (container) {
            container.innerHTML = `<div style="padding: 20px; color: #ef4444; font-family: monospace;">Failed to initialize Monaco Editor: ${error.message}</div>`;
        }
    }
}

startIDE();

export { editor, monacoInstance, state };

