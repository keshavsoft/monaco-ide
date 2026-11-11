import {
    channel,
    STORAGE_KEY_CONTENT,
    renderContent
} from './state.js';

function initReceiver() {
    // 1. Channel Message Listener
    channel.onmessage = (event) => {
        const msg = event.data || {};
        if (msg.type === 'CONTENT_UPDATE' || msg.type === 'RENDER' || msg.type === 'RENDER_SPEC') {
            renderContent(msg.spec || msg.content);
        } else if (msg.type === 'TAB_PING') {
            channel.postMessage({ type: 'TAB_READY' });
        }
    };

    // 2. Hydrate from localStorage on initial load
    try {
        const cached = localStorage.getItem(STORAGE_KEY_CONTENT);
        if (cached) {
            renderContent(cached);
        }
    } catch (err) {
        console.warn('[LocalStorage Read Error]', err);
    }

    // 3. Notify Tab 1 that Tab 2 is active and ready
    channel.postMessage({ type: 'TAB_READY' });

    // 4. Fallback cross-tab storage listener
    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY_CONTENT && e.newValue) {
            renderContent(e.newValue);
        }
    });
}

// Mount cleanly when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReceiver);
} else {
    initReceiver();
}

