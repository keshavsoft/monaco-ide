const query = new URLSearchParams(location.search);
const channelName = query.get('channel');
if (channelName && 'BroadcastChannel' in window) {
    const channel = new BroadcastChannel(channelName);
    const badge = document.createElement('div');
    badge.textContent = `Live preview · ${decodeURIComponent(location.pathname.split('/').pop() || '')}`;
    badge.style.cssText = 'position:fixed;z-index:2147483647;left:10px;bottom:10px;padding:5px 9px;background:#111827dd;color:#fff;font:11px monospace;pointer-events:none';
    (document.body || document.documentElement).appendChild(badge);

    channel.addEventListener('message', event => {
        const message = event.data || {};
        if (message.type === 'RELOAD') {
            location.reload();
        } else if (message.type === 'RENDER' && message.entryUrl) {
            const target = new URL(message.entryUrl, location.href);
            if (target.href !== location.href) location.assign(target.href);
        } else if (message.type === 'NO_ENTRY') {
            badge.textContent = message.message || 'No HTML file selected';
        }
    });

    channel.postMessage({
        type: 'PAGE_READY',
        entryUrl: location.href,
        entry: query.get('entry') || location.pathname
    });

    window.addEventListener('error', event => {
        const failedUrl = event.target?.src || event.target?.href;
        channel.postMessage({
            type: 'PREVIEW_ERROR',
            error: failedUrl ? `Could not load ${failedUrl}` : event.message
        });
    }, true);
}
