/**
 * Tab 1 (Supplier) — Centralized State & Channel Bus
 * Discipline: Isolated State & Pure Instruction Execution
 */

export const CHANNEL_NAME = 'keshavsoft-render-v4';
export const STORAGE_KEY_CONTENT = 'keshavsoft_render_v4_content';
export const STORAGE_KEY_META = 'keshavsoft_render_v4_meta';

export const FILES = {
    base: './data/base.json',
    columns: './data/columns.json',
    template: './data/template.json',
    data: './data/data.json'
};

export const models = {
    base: '',
    columns: '',
    template: '',
    data: '',
    output: ''
};

export let activeView = 'base';
let editor = null;
export let renderWindow = null;

export const channel = new BroadcastChannel(CHANNEL_NAME);

export const $ = (id) => document.getElementById(id);
export const pretty = (v) => typeof v === 'string' ? v : JSON.stringify(v, null, 2) + '\n';

export function getEditor() {
    return editor;
}

export function setEditor(instance) {
    editor = instance;
}

export function setActiveView(view) {
    activeView = view;
}

export function setRenderWindow(win) {
    renderWindow = win;
}

export function setStatus(text, isError = false) {
    const el = $('saveStatus');
    if (!el) return;
    el.textContent = text;
    el.className = isError
        ? 'text-[10px] font-semibold text-rose-300 bg-rose-950/80 border border-rose-800 px-2 py-0.5 rounded'
        : 'text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded';
    el.classList.remove('hidden');
    clearTimeout(setStatus._timer);
    setStatus._timer = setTimeout(() => el.classList.add('hidden'), 4000);
}

export function updateTab2Badge(text, isLive = true) {
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

export async function loadJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} loading ${url}`);
    return res.json();
}

export function parseModel(viewName) {
    const val = models[viewName];
    if (!val) throw new Error(`${viewName}.json is empty.`);
    try {
        return JSON.parse(val);
    } catch (e) {
        throw new Error(`Syntax error in ${viewName}.json: ${e.message}`);
    }
}

/**
 * Builds the complete composed JSON specification for the Bootstrap table
 */
export function buildOutputSpec() {
    const base = parseModel('base');
    const columns = parseModel('columns');
    const template = parseModel('template');
    const data = parseModel('data');

    if (!Array.isArray(columns)) throw new Error('Columns JSON must be an array.');
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

                // Dynamic Bootstrap badges for Status field
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
 * Beams the rendered spec across the BroadcastChannel to Tab 2
 */
export function sendPayload() {
    const spec = buildOutputSpec();
    const formatted = pretty(spec);

    localStorage.setItem(STORAGE_KEY_CONTENT, formatted);
    localStorage.setItem(STORAGE_KEY_META, JSON.stringify({
        filename: 'output.json',
        timestamp: Date.now()
    }));

    channel.postMessage({
        type: 'RENDER_SPEC',
        spec: spec,
        content: formatted,
        filename: 'output.json'
    });

    setStatus('Beamed to Tab 2: Playing Live HTML ✓');
}

