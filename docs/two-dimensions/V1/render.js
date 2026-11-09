import jsonToDom from './js/lib/json-to-dom.min.js';
const CHANNEL = 'keshavsoft-two-dimensions-v1';
const STORAGE_KEY = 'keshavsoft-two-dimensions-v1-spec';
const channel = new BroadcastChannel(CHANNEL);

function renderSpec(spec) {
    if (!spec) return;
    const app = document.getElementById('app');
    const staging = document.createElement('div');
    staging.id = 'staging';
    staging.style.display = 'none';
    document.body.append(staging);
    try {
        const render = window.ks?.jsonToDom?.appendToDom || jsonToDom;
        render({ jsonSpec: spec, targetHtmlId: 'staging' });
        const element = staging.firstElementChild;
        if (!element) throw Error('Renderer produced no element');
        app.replaceChildren(element);
    } catch (error) {
        console.error('Render error:', error);
        app.textContent = `Render error: ${error.message}`;
    } finally {
        staging.remove();
    }
}

try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) renderSpec(JSON.parse(cached));
} catch (e) {
    console.warn('LocalStorage read error:', e);
}

try {
    channel.postMessage({ type: 'REQUEST_RENDER' });
} catch { }

channel.onmessage = ({ data }) => {
    if (data?.type === 'RENDER_OUTPUT' && data.spec) {
        renderSpec(data.spec);
    }
};