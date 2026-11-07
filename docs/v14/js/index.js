/**
 * Monaco IDE V14 - Application Bootstrapper
 * Built with KeshavSoft Declarative DOM Primitive Bindings.
 * Enhanced with VS Code-like Integrated Terminal (cmd, powershell, node, bash).
 */

import { state } from './core/state.js';
import { initHeader } from './modules/header/index.js';
import { initExplorer } from './modules/explorer/index.js';
import { initTabs, createTab } from './modules/tabs/index.js';
import { initPreview } from './modules/preview/index.js';
import './modules/previewTab.js';
import { initStatusBar } from './modules/statusBar/index.js';
import { initQuickOpen } from './modules/quickOpen/index.js';
import { initTerminal } from './modules/terminal/index.js';

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
        if (!res.ok) return '{\n  "project": "Monaco IDE",\n  "version": "14.0.0"\n}\n';
        const json = await res.json();
        return JSON.stringify(json, null, 2) + '\n';
    } catch {
        return '{\n  "project": "Monaco IDE",\n  "version": "14.0.0"\n}\n';
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

        state.editor = editor;
        state.monaco = monacoInstance;

        // Initialize all modules powered by dom-primitive-bindings
        initHeader();
        initExplorer();
        initTabs();
        initPreview();
        initStatusBar();
        initQuickOpen();
        initTerminal();

        // Seed initial sample.json tab
        createTab({
            name: 'sample.json',
            content: initialCode,
            language: 'json'
        });

        // Seed samp.js tab as shown in user's VS Code workflow
        createTab({
            name: 'samp.js',
            content: 'console.log("Hello world")\nconsole.log("Hello")\nconsole.log("Hello KeshavSoft")\n',
            language: 'javascript'
        });

    } catch (error) {
        console.error('Monaco IDE V14 initialization failed:', error);
        const container = document.getElementById('jsonEditor');
        if (container) {
            container.innerHTML = `<div style="padding: 20px; color: #ef4444; font-family: monospace;">Failed to initialize Monaco Editor: ${error.message}</div>`;
        }
    }
}

startIDE();

export { editor, monacoInstance, state };
