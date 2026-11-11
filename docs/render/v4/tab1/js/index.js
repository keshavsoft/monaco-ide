import {
    $,
    FILES,
    models,
    pretty,
    loadJSON,
    setStatus,
    channel,
    activeView,
    setEditor,
    buildOutputSpec,
    sendPayload
} from './state.js';
import { initBindings } from './showInMonaco/reader.js';
import actions from './showInMonaco/actions.js';

async function start() {
    try {
        // 1. Initialize Monaco Editor Core
        const monaco = await new Promise((resolve, reject) => {
            require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs' } });
            require(['vs/editor/editor.main'], () => resolve(window.monaco), reject);
        });

        // 2. Load all 4 Source JSON files
        const [baseData, colsData, tplData, rowsData] = await Promise.all([
            loadJSON(FILES.base),
            loadJSON(FILES.columns),
            loadJSON(FILES.template),
            loadJSON(FILES.data)
        ]);

        models.base = pretty(baseData);
        models.columns = pretty(colsData);
        models.template = pretty(tplData);
        models.data = pretty(rowsData);

        // Pre-build output model
        buildOutputSpec();

        // 3. Create Monaco Editor Instance
        const container = $('jsonEditor');
        const editorInstance = monaco.editor.create(container, {
            value: models.base,
            language: 'json',
            theme: 'vs-dark',
            automaticLayout: true,
            tabSize: 2,
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            cursorBlinking: 'smooth',
            renderLineHighlight: 'all',
            padding: { top: 8 }
        });

        setEditor(editorInstance);

        // Track live edits in active model
        editorInstance.onDidChangeModelContent(() => {
            models[activeView] = editorInstance.getValue();
        });

        // Cursor Position
        editorInstance.onDidChangeCursorPosition((e) => {
            const pos = e.position;
            const el = $('cursorPos');
            if (el) el.textContent = `Ln ${pos.lineNumber}, Col ${pos.column}`;
        });

        // Keyboard Shortcut: Ctrl + Enter / Cmd + Enter plays in Tab 2
        editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
            actions.playHtml();
        });

        // 4. File input change listener
        const fileInput = $('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const text = ev.target.result;
                    models[activeView] = text;
                    editorInstance.setValue(text);
                    const fn = $('fileName');
                    if (fn) fn.textContent = file.name;
                    setStatus(`Loaded: ${file.name}`);
                };
                reader.readAsText(file);
            });
        }

        // 5. Initialize Declarative DOM Primitive Bindings
        initBindings(document.body);

        // 6. Connect Channel Receiver
        channel.onmessage = ({ data: msg }) => {
            if (!msg) return;
            if (msg.type === 'TAB_READY') {
                actions.handleTabReady(msg);
            } else if (msg.type === 'RENDER_ACK') {
                actions.handleRenderAck(msg);
            } else if (msg.type === 'RENDER_ERROR') {
                actions.handleRenderError(msg);
            } else if (msg.type === 'REQUEST_CONTENT') {
                sendPayload();
            }
        };

        // Ping Tab 2 to check if already open
        channel.postMessage({ type: 'TAB_PING' });

        const fn = $('fileName');
        if (fn) fn.textContent = 'base.json';
        setStatus('Source studio ready · 4 files loaded');
    } catch (err) {
        console.error('[Render V4 Tab 1 Init Error]', err);
        const ed = $('jsonEditor');
        if (ed) ed.textContent = 'Failed to initialize Monaco Studio: ' + err.message;
    }
}

start();

