/**
 * Monaco IDE Render V4 — Studio Controller (Tab 1)
 * Decoupled Architecture: Pure Monaco JSON Supplier & Live HTML Dispatcher
 * Communication Bus: BroadcastChannel ('keshavsoft-render-v4')
 */

const CHANNEL_NAME = 'keshavsoft-render-v4';
const STORAGE_KEY_CONTENT = 'keshavsoft_render_v4_content';
const STORAGE_KEY_META = 'keshavsoft_render_v4_meta';

const FILES = {
    base: './data/base.json',
    columns: './data/columns.json',
    template: './data/template.json',
    data: './data/data.json'
};

const models = {
    base: '',
    columns: '',
    template: '',
    data: '',
    output: ''
};

let activeView = 'base';
let editor = null;
let renderWindow = null;
let channel = null;

const $ = id => document.getElementById(id);
const pretty = v => typeof v === 'string' ? v : JSON.stringify(v, null, 2) + '\n';

function status(text, isError = false) {
    const el = $('saveStatus');
    if (!el) return;
    el.textContent = text;
    el.className = isError
        ? 'text-[10px] font-semibold text-rose-300 bg-rose-950/80 border border-rose-800 px-2 py-0.5 rounded'
        : 'text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded';
    el.classList.remove('hidden');
    clearTimeout(status._timer);
    status._timer = setTimeout(() => el.classList.add('hidden'), 4000);
}

function updateTab2Badge(text, isLive = true) {
    const badge = $('tab2SyncStatus');
    if (!badge) return;
    badge.classList.remove('hidden');
    if (isLive) {
        badge.className = 'text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded flex items-center gap-1.5';
        badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span><span>${text}</span>`;
    } else {
        badge.className = 'text-[10px] font-semibold text-amber-400 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded flex items-center gap-1.5';
        badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span><span>${text}</span>`;
    }
}

async function loadJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} loading ${url}`);
    return res.json();
}

function parseModel(viewName) {
    const val = models[viewName];
    if (!val) throw new Error(`${viewName}.json is empty.`);
    try {
        return JSON.parse(val);
    } catch (e) {
        throw new Error(`Syntax error in ${viewName}.json: ${e.message}`);
    }
}

function activateView(view) {
    if (!models[view] && view === 'output') {
        buildOutputSpec();
    }
    if (editor) {
        models[activeView] = editor.getValue();
    }
    activeView = view;
    if (editor) {
        editor.setValue(models[view] || '');
        editor.updateOptions({ readOnly: false });
    }
    document.querySelectorAll('.view-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    $('fileName').textContent = `${view}.json`;
}

function openRenderer() {
    if (!renderWindow || renderWindow.closed) {
        const renderUrl = new URL('./render.html', location.href).href;
        renderWindow = window.open(renderUrl, 'keshavsoft_render_tab');
        if (!renderWindow) {
            throw new Error('Popup blocked! Please allow popups for localhost to open Tab 2.');
        }
    } else {
        renderWindow.focus();
    }
}

/**
 * Synthesizes base, columns, template, and data into a complete Bootstrap-powered table JSON specification
 */
function buildOutputSpec() {
    const base = parseModel('base');
    const columns = parseModel('columns');
    const template = parseModel('template');
    const data = parseModel('data');

    if (!Array.isArray(columns)) throw new Error('Columns JSON must be an array of column definitions.');
    if (!Array.isArray(data.rows)) throw new Error('Data JSON must contain a "rows" array.');

    // Build Table Body Rows with Bootstrap styling & badges
    const tbody = {
        tagName: 'tbody',
        attributes: {
            id: 'PR-body',
            class: 'table-group-divider'
        },
        children: data.rows.map(row => ({
            tagName: 'tr',
            attributes: {
                class: 'align-middle'
            },
            children: columns.map(col => {
                const rawVal = row[col.key] ?? '';
                const tdAttributes = {
                    class: `px-3 py-2.5 ${col.align === 'right' ? 'text-end' : col.align === 'center' ? 'text-center' : 'text-start'} ${col.className || ''}`.trim()
                };

                // Render status as a dynamic Bootstrap badge
                if (col.key === 'status') {
                    let badgeClass = 'badge bg-secondary';
                    const s = String(rawVal).toLowerCase();
                    if (s.includes('paid') || s.includes('success')) badgeClass = 'badge bg-success';
                    else if (s.includes('pending') || s.includes('process')) badgeClass = 'badge bg-warning text-dark';
                    else if (s.includes('overdue') || s.includes('fail') || s.includes('cancel')) badgeClass = 'badge bg-danger';

                    return {
                        tagName: 'td',
                        attributes: tdAttributes,
                        children: [
                            {
                                tagName: 'span',
                                textContent: String(rawVal),
                                attributes: { class: badgeClass }
                            }
                        ]
                    };
                }

                return {
                    tagName: 'td',
                    textContent: String(rawVal),
                    attributes: tdAttributes
                };
            })
        }))
    };

    const composed = {
        tagName: base.tagName || 'table',
        attributes: {
            ...base.attributes,
            id: 'PR'
        },
        children: [
            structuredClone(template),
            tbody
        ]
    };

    models.output = pretty(composed);
    return composed;
}

/**
 * Transmits the synthesized JSON specification to Tab 2 to render the live HTML
 */
function playHtmlInTab2() {
    if (editor) {
        models[activeView] = editor.getValue();
    }

    const spec = buildOutputSpec();
    const formattedJson = pretty(spec);

    // Save to local storage for instant hydration on refresh
    localStorage.setItem(STORAGE_KEY_CONTENT, formattedJson);
    localStorage.setItem(STORAGE_KEY_META, JSON.stringify({
        filename: 'output.json',
        language: 'json',
        timestamp: Date.now()
    }));

    // Ensure Tab 2 is open
    openRenderer();

    // Beam the JSON specification across BroadcastChannel
    if (channel) {
        channel.postMessage({
            type: 'RENDER_SPEC',
            spec: spec,
            content: formattedJson,
            filename: 'output.json',
            language: 'json'
        });
    }

    status('Sent to Tab 2: Playing Live HTML ✓');
}

function safeRun(fn) {
    try {
        const res = fn();
        if (res && res.catch) {
            res.catch(err => {
                status(err.message, true);
                console.error('[Action Error]', err);
            });
        }
    } catch (err) {
        status(err.message, true);
        console.error('[Action Error]', err);
    }
}

async function start() {
    try {
        // Load Monaco Editor
        const monaco = await new Promise((resolve, reject) => {
            require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs' } });
            require(['vs/editor/editor.main'], () => resolve(window.monaco), reject);
        });

        // Load 4 initial data files
        const [baseData, colsData, tplData, rowsData] = await Promise.all([
            loadJson(FILES.base),
            loadJson(FILES.columns),
            loadJson(FILES.template),
            loadJson(FILES.data)
        ]);

        models.base = pretty(baseData);
        models.columns = pretty(colsData);
        models.template = pretty(tplData);
        models.data = pretty(rowsData);

        // Build initial output model
        buildOutputSpec();

        // Create Monaco Editor
        editor = monaco.editor.create($('jsonEditor'), {
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

        // Keep local model updated on change
        editor.onDidChangeModelContent(() => {
            models[activeView] = editor.getValue();
        });

        // View Tabs switching
        document.querySelectorAll('.view-tab').forEach(btn => {
            btn.addEventListener('click', () => activateView(btn.dataset.view));
        });

        // Button Actions
        $('playBtn').addEventListener('click', () => safeRun(playHtmlInTab2));
        $('renderBtn').addEventListener('click', () => safeRun(playHtmlInTab2));
        $('buildBtn').addEventListener('click', () => {
            safeRun(() => {
                buildOutputSpec();
                activateView('output');
                status('Output spec generated ✓');
            });
        });

        // Keyboard Shortcut: Ctrl + Enter / Cmd + Enter plays in Tab 2
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
            safeRun(playHtmlInTab2);
        });

        // Open File handler
        const fileInput = $('fileInput');
        const openFileBtn = $('openFileBtn');
        if (openFileBtn && fileInput) {
            openFileBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const text = ev.target.result;
                    models[activeView] = text;
                    if (editor) editor.setValue(text);
                    $('fileName').textContent = file.name;
                    status(`Loaded: ${file.name}`);
                };
                reader.readAsText(file);
            });
        }

        // Status Bar: Cursor Position
        editor.onDidChangeCursorPosition((e) => {
            const pos = e.position;
            const el = $('cursorPos');
            if (el) el.textContent = `Ln ${pos.lineNumber}, Col ${pos.column}`;
        });

        // Status Bar: Word Wrap Toggle
        let wordWrapOn = false;
        $('toggleWordWrapBtn')?.addEventListener('click', () => {
            wordWrapOn = !wordWrapOn;
            editor.updateOptions({ wordWrap: wordWrapOn ? 'on' : 'off' });
            $('toggleWordWrapBtn').textContent = `Wrap: ${wordWrapOn ? 'On' : 'Off'}`;
        });

        // Status Bar: Minimap Toggle
        let minimapOn = false;
        $('toggleMinimapBtn')?.addEventListener('click', () => {
            minimapOn = !minimapOn;
            editor.updateOptions({ minimap: { enabled: minimapOn } });
            $('toggleMinimapBtn').textContent = `Map: ${minimapOn ? 'On' : 'Off'}`;
        });

        // Initialize BroadcastChannel
        channel = new BroadcastChannel(CHANNEL_NAME);
        channel.onmessage = ({ data: msg }) => {
            if (!msg) return;
            if (msg.type === 'TAB_READY') {
                updateTab2Badge('Tab 2 Connected ✓', true);
                // Tab 2 just came online; send latest compiled spec
                if (models.output) {
                    try {
                        const spec = JSON.parse(models.output);
                        channel.postMessage({
                            type: 'RENDER_SPEC',
                            spec: spec,
                            content: models.output,
                            filename: 'output.json'
                        });
                    } catch (e) { }
                }
            } else if (msg.type === 'RENDER_ACK') {
                updateTab2Badge(`Tab 2 Live (${msg.count} elements) ✓`, true);
                status(`Tab 2 rendered ${msg.count} elements ✓`);
            } else if (msg.type === 'RENDER_ERROR') {
                updateTab2Badge('Tab 2 Error', false);
                status(`Tab 2 Error: ${msg.message}`, true);
            } else if (msg.type === 'REQUEST_CONTENT') {
                if (models.output) {
                    channel.postMessage({
                        type: 'RENDER_SPEC',
                        spec: JSON.parse(models.output),
                        content: models.output,
                        filename: 'output.json'
                    });
                }
            }
        };

        // Ping Tab 2 to check if already open
        channel.postMessage({ type: 'TAB_PING' });

        $('fileName').textContent = 'base.json';
        status('4 Source files loaded ready to Play');
    } catch (err) {
        console.error('[Render V4 Initialization]', err);
        $('jsonEditor').textContent = 'Failed to initialize Monaco Studio: ' + err.message;
    }
}

start();

