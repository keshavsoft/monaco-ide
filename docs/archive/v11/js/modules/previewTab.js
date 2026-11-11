/**
 * Monaco IDE V11 - Full Preview Virtual Server Bridge
 * Connects Tab 1 (Monaco Studio) directly to Tab 2 (Preview) via Service Worker & BroadcastChannel.
 */

import { eventBus } from '../core/eventBus.js';
import { state, getActiveTab } from '../core/state.js';

const DB_NAME = 'v11-monaco-preview';
const DB_VERSION = 1;
const STORE_NAME = 'files';
const CHANNEL_NAME = 'v11-preview-channel';

let channel = null;
let updateTimer = null;
let registrationPromise = null;

function setStatus(message, isError = false) {
    const el = document.getElementById('previewTabStatus');
    if (!el) return;
    el.textContent = message;
    el.title = message;
    el.className = `text-[9px] font-mono ${isError ? 'text-amber-400' : 'text-emerald-400'}`;
}

function cleanPath(path) {
    return String(path || '').replace(/\\/g, '/').replace(/^\/+/, '');
}

function guessMime(path) {
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
        req.onerror = () => reject(req.error || new Error('Could not open IndexedDB in Tab 1'));
    });
}

async function registerVirtualServerWorker() {
    if (!('serviceWorker' in navigator)) {
        setStatus('Service Worker not supported', true);
        return null;
    }
    if (!registrationPromise) {
        registrationPromise = navigator.serviceWorker.register('./workspace-preview-sw.js', { scope: './' })
            .then(async reg => {
                await navigator.serviceWorker.ready;
                if (reg.active) {
                    reg.active.postMessage({ type: 'CLAIM' });
                }
                return reg;
            });
    }
    return registrationPromise;
}

/**
 * Bulk writes all workspace files into IndexedDB for the Virtual Server
 */
export async function syncWorkspaceToVirtualServer() {
    const db = await openDatabase();
    const filesMap = new Map();

    // 1. Files from disk handle
    for (const item of state.workspace.fileIndex || []) {
        try {
            const file = await item.handle.getFile();
            const path = cleanPath(item.path);
            filesMap.set(path, {
                path,
                body: file,
                contentType: file.type || guessMime(path)
            });
        } catch (err) {
            console.warn(`Could not read file ${item.path}:`, err);
        }
    }

    // 2. Open editor tabs override disk (live unsaved edits take precedence)
    for (const tab of state.tabs || []) {
        if (!tab.model) continue;
        const path = cleanPath(tab.path || tab.name);
        const code = tab.model.getValue();
        filesMap.set(path, {
            path,
            body: code,
            contentType: guessMime(path)
        });
    }

    // Write all to IndexedDB
    await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.clear();
        for (const record of filesMap.values()) {
            store.put(record);
        }
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
    });

    db.close();
    return filesMap.size;
}

/**
 * Saves a single active buffer into IndexedDB and signals live reload
 */
export async function saveBufferToVirtualServer(tab) {
    if (!tab || !tab.model) return;
    const path = cleanPath(tab.path || tab.name);
    const code = tab.model.getValue();
    const mime = guessMime(path);

    const db = await openDatabase();
    await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put({
            path,
            body: code,
            contentType: mime
        });
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
    });
    db.close();

    // Notify Tab 2 over BroadcastChannel
    if (channel) {
        channel.postMessage({ type: 'RELOAD', file: path });
    }
}

/**
 * Selects the most appropriate entry HTML file
 */
function chooseEntryPath() {
    const isHtml = path => /\.html?$/i.test(path || '');

    // 1. Active tab if HTML
    const active = getActiveTab();
    if (active && isHtml(active.path || active.name)) {
        return cleanPath(active.path || active.name);
    }

    // 2. Any open tab that is HTML
    const openHtml = (state.tabs || []).find(t => isHtml(t.path || t.name));
    if (openHtml) {
        return cleanPath(openHtml.path || openHtml.name);
    }

    // 3. Search file index for index.html (or nested index.html)
    const files = state.workspace.fileIndex || [];
    const htmlFiles = files.filter(f => isHtml(f.name || f.path));

    // Prefer index.html in root or docs
    const preferred = htmlFiles.find(f => /^index\.html?$/i.test(f.name))
        || htmlFiles.find(f => f.path.includes('index.html'))
        || htmlFiles[0];

    return preferred ? cleanPath(preferred.path) : '';
}

/**
 * Opens Tab 2 directly at the Virtual Server URL
 */
export async function openFullPreviewTab() {
    try {
        setStatus('Syncing workspace…');
        const fileCount = await syncWorkspaceToVirtualServer();

        const entryPath = chooseEntryPath();
        if (!entryPath) {
            setStatus('No HTML file in project', true);
            alert('Please select or open an HTML file in Monaco IDE to preview.');
            return;
        }

        const virtualUrl = new URL(`virtual-server/${entryPath}`, window.location.href);
        console.log('[V11 Studio] Opening Virtual Server preview at:', virtualUrl.href);

        const win = window.open(virtualUrl.href, 'monacoPreviewV11');
        if (!win) {
            setStatus('Popup blocked — allow popups', true);
            alert('Browser blocked pop-up. Please allow popups for localhost / this site.');
            return;
        }

        win.focus();
        setStatus(`⚡ Serving: ${entryPath} (${fileCount} files)`);
    } catch (err) {
        console.error('Failed to open preview tab:', err);
        setStatus('Preview error — see console', true);
    }
}

function initBridge() {
    try {
        channel = new BroadcastChannel(CHANNEL_NAME);
        channel.onmessage = event => {
            const msg = event.data || {};
            console.log('[Tab 1 BroadcastChannel Received]', msg);
        };
    } catch (err) {
        console.warn('BroadcastChannel error:', err);
    }

    // Wire up the Full Preview button in the header
    document.getElementById('openFullPreviewBtn')?.addEventListener('click', openFullPreviewTab);

    // Event bus hooks
    eventBus.on('model:contentChanged', tab => {
        clearTimeout(updateTimer);
        updateTimer = setTimeout(() => saveBufferToVirtualServer(tab), 250);
    });

    eventBus.on('file:saved', tab => {
        saveBufferToVirtualServer(tab);
    });

    eventBus.on('workspace:opened', () => {
        syncWorkspaceToVirtualServer().then(count => {
            setStatus(`Virtual Server: ${count} files cached`);
        });
    });

    eventBus.on('workspace:refreshed', () => {
        syncWorkspaceToVirtualServer();
    });

    // Register service worker early
    registerVirtualServerWorker().catch(err => {
        console.error('Could not start Virtual Server SW:', err);
        setStatus('Virtual Server SW error', true);
    });
}

initBridge();
