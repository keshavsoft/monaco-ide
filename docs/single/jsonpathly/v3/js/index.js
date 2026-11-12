/**
 * Monaco IDE Single - jsonpathly V2 Application Bootstrapper
 * Orchestrates domain modules declaratively from the outside:
 * - modules/editors: Activates dual Monaco editors from instructions.json
 * - modules/header: Handles file opening via File button
 * - modules/jsonpath: Handles search input and RFC 9535 jsonpathly evaluation
 * - modules/statusBar: Handles Ln/Col cursor tracking and word wrap
 */

import { initEditors } from './modules/editors/index.js';
import { initHeader } from './modules/header/index.js';
import { initJsonPath } from './modules/jsonpath/index.js';
import { initStatusBar } from './modules/statusBar/index.js';
import { initAutocomplete } from './modules/autocomplete/index.js';

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

async function boot() {
    try {
        const monaco = await loadMonaco();

        // 1. Activate dual Monaco editors from instructions.json on form load
        await initEditors(monaco);

        // 2. Wire domain modules declaratively
        initAutocomplete();
        initHeader();
        initJsonPath();
        initStatusBar();

        console.log('[App] Monaco IDE Single jsonpathly V3 initialized.');
    } catch (err) {
        console.error('[App] Boot failure:', err);
    }
}

boot();

