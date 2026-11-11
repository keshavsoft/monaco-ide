const DATABASE_NAME = 'monaco-ide-v9-preview';
const DATABASE_VERSION = 1;
const FILE_STORE = 'workspaceFiles';
const META_PATH = '\u0000__meta__';

self.addEventListener('install', event => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
});

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(FILE_STORE)) {
                const store = db.createObjectStore(FILE_STORE, { keyPath: 'id' });
                store.createIndex('sessionId', 'sessionId', { unique: false });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('Could not open browser storage.'));
    });
}

function sendReply(port, payload) {
    if (port) port.postMessage(payload);
}

async function replaceWorkspace(sessionId, channelName, files) {
    const db = await openDatabase();
    await new Promise((resolve, reject) => {
        const transaction = db.transaction(FILE_STORE, 'readwrite');
        const store = transaction.objectStore(FILE_STORE);
        const cursorRequest = store.index('sessionId').openCursor(IDBKeyRange.only(sessionId));
        cursorRequest.onsuccess = () => {
            const cursor = cursorRequest.result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
                return;
            }
            store.put({
                id: `${sessionId}\u0000${META_PATH}`, sessionId, path: META_PATH,
                channelName, contentType: 'application/json', body: new Blob(['{}'])
            });
            for (const file of files) {
                store.put({
                    id: `${sessionId}\u0000${file.path}`,
                    sessionId,
                    path: file.path,
                    contentType: file.contentType || 'application/octet-stream',
                    body: file.body
                });
            }
        };
        cursorRequest.onerror = () => transaction.abort();
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error || new Error('Could not store workspace files.'));
        transaction.onabort = () => reject(transaction.error || new Error('Workspace file update was cancelled.'));
    });
    db.close();
}

async function putFile(sessionId, file) {
    const db = await openDatabase();
    await new Promise((resolve, reject) => {
        const transaction = db.transaction(FILE_STORE, 'readwrite');
        transaction.objectStore(FILE_STORE).put({
            id: `${sessionId}\u0000${file.path}`,
            sessionId,
            path: file.path,
            contentType: file.contentType || 'application/octet-stream',
            body: file.body
        });
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error || new Error('Could not update the preview file.'));
        transaction.onabort = () => reject(transaction.error || new Error('Preview file update was cancelled.'));
    });
    db.close();
}

async function readFile(sessionId, path) {
    const db = await openDatabase();
    const result = await new Promise((resolve, reject) => {
        const request = db.transaction(FILE_STORE, 'readonly')
            .objectStore(FILE_STORE)
            .get(`${sessionId}\u0000${path}`);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error || new Error('Could not read the preview file.'));
    });
    db.close();
    return result;
}

self.addEventListener('message', event => {
    const message = event.data || {};
    const port = event.ports?.[0];
    const task = (async () => {
        if (message.type === 'SYNC_WORKSPACE') {
            await replaceWorkspace(message.sessionId, message.channelName, message.files || []);
            sendReply(port, { ok: true, count: (message.files || []).length });
            return;
        }
        if (message.type === 'PUT_FILE') {
            await putFile(message.sessionId, message.file);
            sendReply(port, { ok: true });
            return;
        }
        sendReply(port, { ok: false, error: 'Unknown preview bridge request.' });
    })().catch(error => sendReply(port, { ok: false, error: error.message }));
    event.waitUntil(task);
});

function workspaceRoute() {
    return new URL('__workspace__/', self.registration.scope).pathname;
}

function makeWorkspaceRoot(sessionId) {
    return new URL(`__workspace__/${encodeURIComponent(sessionId)}/`, self.registration.scope).href;
}

function rewriteRootReference(value, root) {
    if (!value || !value.startsWith('/') || value.startsWith('//')) return value;
    return `${root}${value.replace(/^\/+/, '')}`;
}

function rewriteCss(css, root) {
    return css
        .replace(/url\(\s*(['"]?)(\/(?!\/)[^)'"\s]*)\1\s*\)/gi,
            (match, quote, path) => `url(${quote}${rewriteRootReference(path, root)}${quote})`)
        .replace(/(@import\s+)(['"])(\/(?!\/)[^'"]+)\2/gi,
            (match, prefix, quote, path) => `${prefix}${quote}${rewriteRootReference(path, root)}${quote}`);
}

function rewriteHtml(html, root, channelName, entryPath) {
    html = html.replace(/\b(href|src|action|poster|data|formaction)\s*=\s*(["'])(\/[^"']*)\2/gi,
        (match, name, quote, path) => `${name}=${quote}${rewriteRootReference(path, root)}${quote}`);
    html = html.replace(/\bsrcset\s*=\s*(["'])([^"']*)\1/gi, (match, quote, value) => {
        const rewritten = value.replace(/(^|,\s*)(\/(?!\/)[^\s,]+)/g,
            (candidate, prefix, path) => `${prefix}${rewriteRootReference(path, root)}`);
        return `srcset=${quote}${rewritten}${quote}`;
    });
    html = html.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)/gi,
        (match, open, css, close) => `${open}${rewriteCss(css, root)}${close}`);
    html = html.replace(/\bstyle\s*=\s*(["'])([^"']*)\1/gi,
        (match, quote, css) => `style=${quote}${rewriteCss(css, root)}${quote}`);

    const scriptUrl = new URL('preview-client.js', self.registration.scope);
    scriptUrl.searchParams.set('channel', channelName);
    const script = `<script src="${scriptUrl.href}" data-preview-bridge="true"></script>`;
    if (/<\/body\s*>/i.test(html)) return html.replace(/<\/body\s*>/i, `${script}</body>`);
    return `${html}${script}`;
}

function mimeFor(path) {
    const ext = path.split('.').pop()?.toLowerCase();
    return ({
        html: 'text/html;charset=utf-8', htm: 'text/html;charset=utf-8',
        css: 'text/css;charset=utf-8', js: 'text/javascript;charset=utf-8',
        mjs: 'text/javascript;charset=utf-8', json: 'application/json;charset=utf-8',
        svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
        gif: 'image/gif', webp: 'image/webp', ico: 'image/x-icon', txt: 'text/plain;charset=utf-8',
        xml: 'application/xml;charset=utf-8', wasm: 'application/wasm', woff: 'font/woff',
        woff2: 'font/woff2', ttf: 'font/ttf', mp4: 'video/mp4', webm: 'video/webm'
    })[ext] || 'application/octet-stream';
}

async function serveWorkspaceFile(request, url) {
    const route = workspaceRoute();
    const pieces = url.pathname.slice(route.length).split('/').filter(Boolean).map(decodeURIComponent);
    const sessionId = pieces.shift();
    const path = pieces.join('/');
    if (!sessionId || !path || pieces.some(part => part === '.' || part === '..')) {
        return new Response('Preview file not found.', { status: 404 });
    }

    const [record, metadata] = await Promise.all([
        readFile(sessionId, path),
        readFile(sessionId, META_PATH)
    ]);
    if (!record) return new Response(`Preview file not found: ${path}`, { status: 404 });

    const headers = new Headers({
        'Content-Type': record.contentType || mimeFor(path),
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
    });
    if (request.method === 'HEAD') return new Response(null, { status: 200, headers });

    const isHtml = /\.html?$/i.test(path);
    const isCss = /\.css$/i.test(path);
    if (isHtml) {
        const html = await record.body.text();
        const channelName = url.searchParams.get('channel') || metadata?.channelName || '';
        const rendered = rewriteHtml(html, makeWorkspaceRoot(sessionId), channelName, path);
        return new Response(rendered, { status: 200, headers });
    }
    if (isCss) {
        const css = rewriteCss(await record.body.text(), makeWorkspaceRoot(sessionId));
        return new Response(css, { status: 200, headers });
    }
    return new Response(record.body, { status: 200, headers });
}

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET' && event.request.method !== 'HEAD') return;
    const url = new URL(event.request.url);
    const route = workspaceRoute();
    if (url.origin !== self.location.origin || !url.pathname.startsWith(route)) return;
    event.respondWith(serveWorkspaceFile(event.request, url).catch(error => {
        return new Response(`Preview bridge error: ${error.message}`, {
            status: 500,
            headers: { 'Content-Type': 'text/plain;charset=utf-8', 'Cache-Control': 'no-store' }
        });
    }));
});
