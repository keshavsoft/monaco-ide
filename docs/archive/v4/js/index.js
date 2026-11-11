import { initTabManager, openOrSwitchTab } from './tabManager.js';
import { initTreeExplorer } from './treeExplorer.js';
import { initStatusBar } from './statusBar.js';
import { initPreviewManager } from './previewManager.js';

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
        if (!res.ok) return '{\n  "project": "Monaco IDE",\n  "version": "4.0.0"\n}\n';
        const json = await res.json();
        return JSON.stringify(json, null, 2) + '\n';
    } catch {
        return '{\n  "project": "Monaco IDE",\n  "version": "4.0.0"\n}\n';
    }
}

async function startIDE() {
    try {
        monacoInstance = await loadMonaco();
        const initialCode = await loadInitialSample();
        const container = document.getElementById('jsonEditor');

        // Create base Monaco editor
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

        // 1. Initialize Tab Manager
        initTabManager(editor, monacoInstance);

        // 2. Initialize Left Workspace Tree Explorer
        initTreeExplorer(editor, (fileData) => {
            openOrSwitchTab(fileData);
        });

        // 3. Initialize Bottom Status Bar
        initStatusBar(editor, monacoInstance);

        // 4. Initialize Live Split Preview
        initPreviewManager(editor, monacoInstance);

        // Seed initial sample.json as the first open tab
        openOrSwitchTab({
            name: 'sample.json',
            content: initialCode,
            language: 'json'
        });

    } catch (error) {
        console.error('Monaco IDE V4 initialization failed:', error);
        const container = document.getElementById('jsonEditor');
        if (container) {
            container.innerHTML = `<div style="padding: 20px; color: #ef4444; font-family: monospace;">Failed to initialize Monaco Editor: ${error.message}</div>`;
        }
    }
}

startIDE();

export { editor, monacoInstance };
