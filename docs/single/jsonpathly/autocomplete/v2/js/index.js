import { initEditors } from './modules/editors/index.js';
import { initAutocomplete } from './modules/autocomplete/index.js';
import { initHeader } from './modules/header/index.js';
import { initJsonPath } from './modules/jsonpath/index.js';
import { initStatusBar } from './modules/statusBar/index.js';

function loadMonaco() {
    return new Promise((resolve, reject) => {
        if (window.monaco && window.monaco.editor) { resolve(window.monaco); return; }
        require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs' } });
        require(['vs/editor/editor.main'], () => resolve(window.monaco), reject);
    });
}

async function boot() {
    try {
        const monaco = await loadMonaco();
        initAutocomplete();
        await initEditors(monaco);
        initHeader();
        initJsonPath();
        initStatusBar();
        console.log('[App] Autocomplete V2 Initialized.');
    } catch (e) {
        console.error(e);
    }
}
boot();

