/**
 * Monaco IDE V9 - Full Preview bridge.
 * Shares the selected workspace with a same-origin service worker so the
 * preview tab can load normal HTML, CSS, JavaScript, and other relative assets.
 */
import { eventBus } from '../core/eventBus.js';
import { state, getActiveTab } from '../core/state.js';

const CHANNEL = `keshavsoft-monaco-preview-v9-${crypto.randomUUID()}`;
const SESSION_ID = crypto.randomUUID();
let channel = null;
let previewWindow = null;
let registrationPromise = null;
let workspaceSynced = false;
let pageReady = false;
let currentEntryUrl = '';
let updateTimer = null;
let operationQueue = Promise.resolve();
let closedTimer = null;

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

function tabBelongsToWorkspace(tab) {
    if (!state.workspace.handle) return true;
    const path = cleanPath(tab?.path || tab?.name);
    const file = (state.workspace.fileIndex || []).find(item => cleanPath(item.path) === path);
    return Boolean(file && tab?.handle && file.handle === tab.handle);
}

function registerWorker() {
    if (!('serviceWorker' in navigator)) {
        return Promise.reject(new Error('This browser does not support the preview bridge.'));
    }
    if (!registrationPromise) {
        registrationPromise = navigator.serviceWorker.register('./workspace-preview-sw.js', { scope: './' })
            .then(async registration => {
                await navigator.serviceWorker.ready;
                if (!registration.active) throw new Error('The preview bridge did not start. Refresh V9 and try again.');
                return registration;
            });
    }
    return registrationPromise;
}

async function sendToWorker(type, data = {}) {
    const registration = await registerWorker();
    const worker = navigator.serviceWorker.controller || registration.active;
    if (!worker) throw new Error('The browser preview bridge is not ready yet.');

    return new Promise((resolve, reject) => {
        const messageChannel = new MessageChannel();
        const timeout = setTimeout(() => {
            messageChannel.port1.close();
            reject(new Error('The browser preview bridge did not respond.'));
        }, 30000);
        messageChannel.port1.onmessage = event => {
            clearTimeout(timeout);
            messageChannel.port1.close();
            const response = event.data || {};
            if (response.ok) resolve(response);
            else reject(new Error(response.error || 'The browser preview bridge could not save the workspace.'));
        };
        worker.postMessage({ type, sessionId: SESSION_ID, channelName: CHANNEL, ...data }, [messageChannel.port2]);
    });
}

function chooseEntry() {
    const isHtml = tab => tab && /\.html?$/i.test(tab.name || tab.path || '');
    const active = getActiveTab();
    if (isHtml(active) && tabBelongsToWorkspace(active)) return { path: cleanPath(active.path || active.name), tab: active };

    const openHtml = [...state.tabs].reverse().find(tab => isHtml(tab) && tabBelongsToWorkspace(tab));
    if (openHtml) return { path: cleanPath(openHtml.path || openHtml.name), tab: openHtml };

    const files = state.workspace.fileIndex || [];
    const htmlFiles = files.filter(file => /\.html?$/i.test(file.name));
    const entry = htmlFiles.find(file => /^index\.html?$/i.test(file.name)) || htmlFiles[0];
    return entry ? { path: cleanPath(entry.path), tab: null } : { path: '', tab: null };
}

function makeEntryUrl(entryPath) {
    const base = new URL('./', window.location.href);
    const encodedPath = cleanPath(entryPath).split('/').map(encodeURIComponent).join('/');
    const url = new URL(`__workspace__/${encodeURIComponent(SESSION_ID)}/${encodedPath}`, base);
    url.searchParams.set('channel', CHANNEL);
    url.searchParams.set('entry', entryPath);
    return url.href;
}

async function collectWorkspaceFiles() {
    const files = new Map();
    for (const item of state.workspace.fileIndex || []) {
        try {
            const file = await item.handle.getFile();
            const path = cleanPath(item.path);
            files.set(path, { path, body: file, contentType: file.type || guessMime(path) });
        } catch (error) {
            console.warn(`Could not read workspace file ${item.path}:`, error);
        }
    }

    // Open editor buffers take precedence over the saved files on disk.
    for (const tab of state.tabs) {
        if (!tab.model || !tabBelongsToWorkspace(tab)) continue;
        const path = cleanPath(tab.path || tab.name);
        files.set(path, {
            path,
            body: new Blob([tab.model.getValue()], { type: guessMime(path) }),
            contentType: guessMime(path)
        });
    }
    return [...files.values()];
}

async function syncWorkspace() {
    const files = await collectWorkspaceFiles();
    await sendToWorker('SYNC_WORKSPACE', { files });
    workspaceSynced = true;
}

async function saveOpenBuffer(tab) {
    if (!tab?.model || !tabBelongsToWorkspace(tab)) return;
    const path = cleanPath(tab.path || tab.name);
    const contentType = guessMime(path);
    await sendToWorker('PUT_FILE', {
        file: {
            path,
            body: new Blob([tab.model.getValue()], { type: contentType }),
            contentType
        }
    });
}

function postEntry() {
    if (!previewWindow || previewWindow.closed) return;
    const { path } = chooseEntry();
    if (!path) {
        channel?.postMessage({ type: 'NO_ENTRY', message: 'Choose a folder that contains an HTML file, or open an HTML file.' });
        setStatus('No HTML file found', true);
        return;
    }

    const entryUrl = makeEntryUrl(path);
    if (pageReady && currentEntryUrl === entryUrl) {
        channel?.postMessage({ type: 'RELOAD' });
    } else {
        channel?.postMessage({ type: 'RENDER', entry: path, entryUrl });
        currentEntryUrl = entryUrl;
    }
    setStatus('Sending workspace to preview…');
}

function enqueue(task) {
    operationQueue = operationQueue.then(task).catch(error => {
        console.error('Full Preview:', error);
        setStatus(error.message || 'Preview could not be updated', true);
    });
    return operationQueue;
}

function refreshPreview(tab = null, fullSync = false) {
    if (!previewWindow || previewWindow.closed) return;
    return enqueue(async () => {
        if (fullSync || !workspaceSynced) {
            setStatus('Sharing selected folder…');
            await syncWorkspace();
        } else if (tab) {
            await saveOpenBuffer(tab);
        }
        postEntry();
    });
}

function openPreviewTab() {
    if (previewWindow && !previewWindow.closed) {
        previewWindow.focus();
        refreshPreview(null, true);
        return;
    }

    const url = new URL('./preview-tab.html', window.location.href);
    url.searchParams.set('channel', CHANNEL);
    previewWindow = window.open(url.href, 'monacoPreviewV9');
    if (!previewWindow) {
        setStatus('Popup blocked — allow pop-ups', true);
        return;
    }
    pageReady = false;
    currentEntryUrl = '';
    setStatus('Opening preview…');
    previewWindow.focus();
}

function initBridge() {
    if (!('BroadcastChannel' in window)) {
        setStatus('This browser cannot open the preview bridge', true);
        return;
    }

    channel = new BroadcastChannel(CHANNEL);
    channel.addEventListener('message', event => {
        const message = event.data || {};
        if (message.type === 'SHELL_READY') {
            pageReady = false;
            refreshPreview(null, true);
        } else if (message.type === 'PAGE_READY') {
            pageReady = true;
            if (message.entryUrl) currentEntryUrl = message.entryUrl;
            setStatus('Preview ready');
        } else if (message.type === 'PREVIEW_ERROR') {
            setStatus('Preview error — see console', true);
            console.error('Preview error:', message.error);
        } else if (message.type === 'PREVIEW_LOG') {
            console.info('[Preview]', message.message);
        }
    });

    document.getElementById('openFullPreviewBtn')?.addEventListener('click', openPreviewTab);

    eventBus.on('model:contentChanged', tab => {
        clearTimeout(updateTimer);
        updateTimer = setTimeout(() => refreshPreview(tab), 180);
    });
    eventBus.on('tab:activated', tab => refreshPreview(tab));
    eventBus.on('workspace:opened', () => refreshPreview(null, true));
    eventBus.on('workspace:refreshed', () => refreshPreview(null, true));
    eventBus.on('file:saved', tab => refreshPreview(tab));

    // Register early so the preview tab is controlled before its HTML loads.
    registerWorker().catch(error => {
        console.error('Could not start the browser preview bridge:', error);
        setStatus('Preview bridge unavailable', true);
    });

    closedTimer = setInterval(() => {
        if (previewWindow && previewWindow.closed) {
            previewWindow = null;
            pageReady = false;
            setStatus('Preview closed — click Full Preview');
        }
    }, 1000);

    window.addEventListener('beforeunload', () => {
        clearInterval(closedTimer);
        clearTimeout(updateTimer);
        channel?.close();
    });
}

initBridge();
