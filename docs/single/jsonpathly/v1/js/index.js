/**
 * Monaco IDE Single - jsonpathly V1 Bootstrapper
 * Orchestrates domain modules declaratively from the outside:
 * - modules/editors: Activates dual Monaco editors from instructions.json
 * - modules/header: Handles file opening & active file metadata
 * - modules/jsonpath: Handles RFC 9535 query execution & result output
 * - modules/statusBar: Handles Ln/Col and studio controls
 */

import { initEditors } from './modules/editors/index.js';
import { initHeader } from './modules/header/index.js';
import { initTabs } from './modules/tabs/index.js';
import { initJsonPath } from './modules/jsonpath/index.js';
import { initStatusBar } from './modules/statusBar/index.js';

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

async function start() {
    try {
        const monaco = await loadMonaco();

        // 1. Activate dual Monaco editors from instructions.json on form load
        await initEditors(monaco);

        // 2. Wire domain modules declaratively
        initHeader();
        initTabs();
        initJsonPath();
        initStatusBar();

        console.log('[App] Monaco IDE Single jsonpathly V1 initialized successfully.');
    } catch (err) {
        console.error('[App] Boot failure:', err);
    }
}

start();
