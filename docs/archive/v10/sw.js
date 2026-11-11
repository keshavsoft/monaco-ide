const DB_NAME = 'v10-monaco-preview';
const DB_VERSION = 1;
const STORE_NAME = 'files';

self.addEventListener('install', event => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
});

function openDatabase() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'path' });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error || new Error('Could not open IndexedDB in Service Worker'));
    });
}

async function getStoredFile(filePath) {
    const db = await openDatabase();
    return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(filePath);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
    });
}

async function getAllStoredPaths() {
    const db = await openDatabase();
    return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAllKeys();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
    });
}

function guessMimeType(path) {
    const ext = String(path).split('.').pop()?.toLowerCase();
    const map = {
        html: 'text/html; charset=utf-8',
        htm: 'text/html; charset=utf-8',
        css: 'text/css; charset=utf-8',
        js: 'text/javascript; charset=utf-8',
        mjs: 'text/javascript; charset=utf-8',
        json: 'application/json; charset=utf-8',
        svg: 'image/svg+xml',
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        webp: 'image/webp',
        ico: 'image/x-icon',
        txt: 'text/plain; charset=utf-8',
        xml: 'application/xml; charset=utf-8',
        wasm: 'application/wasm',
        woff: 'font/woff',
        woff2: 'font/woff2',
        ttf: 'font/ttf'
    };
    return map[ext] || 'application/octet-stream';
}

const LIVE_RELOAD_SNIPPET = `
<script>
(() => {
  try {
    const bc = new BroadcastChannel('v10-preview-channel');
    bc.onmessage = (e) => {
      if (e.data && e.data.type === 'RELOAD') {
        console.log('[V10 Virtual Server] Live reload signal received, reloading...');
        location.reload();
      }
    };
    window.addEventListener('DOMContentLoaded', () => {
      const b = document.createElement('div');
      b.id = '__v10_badge';
      b.innerHTML = '⚡ <b>V10 Virtual Server</b> · ' + (location.pathname.split('/').filter(Boolean).pop() || 'index.html');
      b.style.cssText = 'position:fixed;bottom:10px;right:10px;background:#0f172aee;color:#38bdf8;padding:6px 12px;border-radius:6px;font:11px monospace;z-index:2147483647;border:1px solid #0284c7;box-shadow:0 4px 12px rgba(0,0,0,0.5);pointer-events:none;';
      document.body.appendChild(b);
    });
  } catch(e) {}
})();
</script>
`;

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    const virtualRoutePrefix = new URL('virtual-server/', self.registration.scope).pathname;

    if (url.origin !== self.location.origin || !url.pathname.startsWith(virtualRoutePrefix)) {
        return; // Let normal requests through
    }

    event.respondWith((async () => {
        let relativePath = decodeURIComponent(url.pathname.slice(virtualRoutePrefix.length));
        if (!relativePath || relativePath.endsWith('/')) {
            relativePath += 'index.html';
        }
        relativePath = relativePath.replace(/^\/+/, '');

        // Try exact match in IndexedDB
        let fileRecord = await getStoredFile(relativePath);

        // Fallback: check if path without folder prefix or with index.html matches
        if (!fileRecord && !relativePath.endsWith('.html') && !relativePath.includes('.')) {
            fileRecord = await getStoredFile(relativePath + '/index.html');
        }

        if (!fileRecord) {
            const allKeys = await getAllStoredPaths();
            const listHtml = allKeys.map(k => `<li><a style="color:#38bdf8;text-decoration:none;" href="${new URL(k, url.href).href}">${k}</a></li>`).join('');
            return new Response(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>404 — Virtual File Not Found</title>
  <style>
    body { background: #09090b; color: #f4f4f5; font-family: ui-monospace, monospace; padding: 32px; }
    h1 { color: #f87171; font-size: 20px; }
    code { background: #27272a; padding: 2px 6px; border-radius: 4px; color: #fbbf24; }
    ul { margin-top: 12px; line-height: 1.8; }
  </style>
</head>
<body>
  <h1>Virtual Server: File Not Found</h1>
  <p>Requested path: <code>${relativePath}</code></p>
  <p>Make sure this file exists in your opened folder in Tab 1.</p>
  <hr style="border:0;border-top:1px solid #27272a;margin:20px 0;">
  <h3>Available files in this session (${allKeys.length}):</h3>
  <ul>${listHtml || '<li><em>No files loaded yet. Click "Select Folder" in Tab 1!</em></li>'}</ul>
</body>
</html>
            `, {
                status: 404,
                headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
            });
        }

        const mime = fileRecord.contentType || guessMimeType(relativePath);
        const headers = new Headers({
            'Content-Type': mime,
            'Cache-Control': 'no-store',
            'X-Served-By': 'Monaco-IDE-V10-Virtual-Server'
        });

        if (mime.includes('text/html')) {
            let htmlText = '';
            if (typeof fileRecord.body === 'string') {
                htmlText = fileRecord.body;
            } else if (fileRecord.body instanceof Blob) {
                htmlText = await fileRecord.body.text();
            } else if (fileRecord.body instanceof ArrayBuffer) {
                htmlText = new TextDecoder().decode(fileRecord.body);
            }

            if (/<\/body>/i.test(htmlText)) {
                htmlText = htmlText.replace(/<\/body>/i, `${LIVE_RELOAD_SNIPPET}</body>`);
            } else {
                htmlText += LIVE_RELOAD_SNIPPET;
            }

            return new Response(htmlText, { status: 200, headers });
        }

        return new Response(fileRecord.body, { status: 200, headers });
    })());
});

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (event.data && event.data.type === 'CLAIM') {
        self.clients.claim();
    }
});

