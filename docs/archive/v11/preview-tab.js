const params = new URLSearchParams(location.search);
const channelName = params.get('channel') || 'keshavsoft-monaco-preview-v9';
const channel = new BroadcastChannel(channelName);
const status = document.getElementById('status');

function showMessage(message, isError = false) {
    status.textContent = message;
    status.style.color = isError ? '#fbbf24' : '#cbd5e1';
}

async function waitForPreviewBridge() {
    if (!('serviceWorker' in navigator)) {
        throw new Error('This browser does not support the preview bridge.');
    }
    await navigator.serviceWorker.register('./workspace-preview-sw.js', { scope: './' });
    await navigator.serviceWorker.ready;
    if (navigator.serviceWorker.controller) return;

    await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
            reject(new Error('The preview bridge is still starting. Refresh this preview tab.'));
        }, 5000);
        function onControllerChange() {
            clearTimeout(timeout);
            navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
            resolve();
        }
        navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    });
}

function render(message) {
    if (message.type === 'NO_ENTRY' || message.type === 'PREVIEW_ERROR') {
        showMessage(message.message || message.error || 'Preview could not be loaded.', true);
        return;
    }
    if (message.type !== 'RENDER') return;

    const entryUrl = new URL(message.entryUrl, location.href);
    const scope = new URL('./', location.href);
    if (entryUrl.origin !== location.origin || !entryUrl.pathname.startsWith(`${scope.pathname}__workspace__/`)) {
        channel.postMessage({ type: 'PREVIEW_ERROR', error: 'The preview address is outside the selected workspace.' });
        return;
    }
    location.replace(entryUrl.href);
}

channel.addEventListener('message', event => render(event.data || {}));

window.addEventListener('error', event => {
    const target = event.target;
    const failedUrl = target?.src || target?.href;
    const error = failedUrl ? `Could not load ${failedUrl}` : event.message;
    channel.postMessage({ type: 'PREVIEW_ERROR', error });
}, true);

waitForPreviewBridge()
    .then(() => channel.postMessage({ type: 'SHELL_READY' }))
    .catch(error => {
        showMessage(error.message, true);
        channel.postMessage({ type: 'PREVIEW_ERROR', error: error.message });
    });
