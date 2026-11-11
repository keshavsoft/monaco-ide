/**
 * Tab 1 (Supplier) — Centralized State & Channel Bus (V5 - Pure Output Mode)
 * Discipline: Single-Spec Direct Supplier with Instruction-Driven Bindings
 */

export const CHANNEL_NAME = 'keshavsoft-render-v5';
export const STORAGE_KEY_CONTENT = 'keshavsoft_render_v5_content';
export const STORAGE_KEY_META = 'keshavsoft_render_v5_meta';

export const OUTPUT_FILE = './data/output.json';

export const models = {
    output: ''
};

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

/**
 * Beams the output spec across the BroadcastChannel to Tab 2
 */
export function sendPayload() {
    const ed = getEditor();
    if (ed) {
        models.output = ed.getValue();
    }

    if (!models.output) {
        setStatus('Output JSON is empty', true);
        return;
    }

    let spec;
    try {
        spec = JSON.parse(models.output);
    } catch (e) {
        setStatus(`Syntax error in output.json: ${e.message}`, true);
        return;
    }

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
