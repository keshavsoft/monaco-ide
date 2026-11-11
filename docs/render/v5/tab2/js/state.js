import jsonToDom from './lib/json-to-dom.min.js';

export const CHANNEL_NAME = 'keshavsoft-render-v5';
export const STORAGE_KEY_CONTENT = 'keshavsoft_render_v5_content';

export const channel = new BroadcastChannel(CHANNEL_NAME);

export function sendAck(nodeCount) {
    try {
        channel.postMessage({
            type: 'RENDER_ACK',
            success: true,
            count: nodeCount,
            timestamp: Date.now()
        });
    } catch (e) {
        console.warn('[Tab 2 ACK Error]', e);
    }
}

export function renderContent(rawContent) {
    if (!rawContent) return;

    const bodyEl = document.getElementById('app') || document.body;

    try {
        let parsed = null;
        if (typeof rawContent === 'object') {
            parsed = rawContent;
        } else {
            const trimmed = rawContent.trim();
            if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                parsed = JSON.parse(rawContent);
            } else if (trimmed.startsWith('<')) {
                // Direct HTML string fallback
                bodyEl.innerHTML = trimmed;
                sendAck(bodyEl.querySelectorAll('*').length);
                return;
            }
        }

        if (parsed) {
            // Wipe body completely clean before mounting
            bodyEl.innerHTML = '';

            // Orchestrate directly into <body>
            const orchestrator = window.ks?.jsonToDom?.appendToDom || jsonToDom;
            orchestrator({ jsonSpec: parsed, targetHtmlId: 'app' });

            const nodeCount = bodyEl.querySelectorAll('*').length;
            sendAck(nodeCount);
        }
    } catch (err) {
        console.error('[Render Error in Tab 2]', err);
        channel.postMessage({ type: 'RENDER_ERROR', message: err.message });
    }
}
