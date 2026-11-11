/**
 * Monaco IDE V8 - Full-screen preview tab bridge.
 * The preview keeps its workspace-relative URLs on a local static server.
 */
import { eventBus } from '../core/eventBus.js';
import { state, getActiveTab } from '../core/state.js';

const CHANNEL = 'keshavsoft-monaco-preview-v8';
const BASE_URL_KEY = `monaco-ide-v8-preview-base:${window.location.origin}`;
let channel = null;
let previewWindow = null;
let lastPayload = null;
let buildSequence = 0;
let updateTimer = null;
let closedTimer = null;

function setStatus(message, isError = false) {
    const el = document.getElementById('previewTabStatus');
    if (!el) return;
    el.textContent = message;
    el.title = message;
    el.className = `text-[9px] font-mono ${isError ? 'text-amber-400' : 'text-emerald-400'}`;
}

function normalizePath(path) {
    return String(path || '').replace(/\\/g, '/').replace(/^\/+/, '');
}

function normalizeBaseUrl(value) {
    const url = new URL(value, window.location.href);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('Use an http:// or https:// static workspace URL.');
    }
    if (url.origin !== window.location.origin) {
        throw new Error(`The workspace URL must use this IDE origin: ${window.location.origin}`);
    }
    if (url.search || url.hash) {
        throw new Error('The workspace URL should be a folder URL without a query or fragment.');
    }
    if (!url.pathname.endsWith('/')) url.pathname += '/';
    return url.href;
}

function getPreviewBaseUrl() {
    const fallback = new URL('/workspace/', window.location.origin).href;
    try {
        const stored = localStorage.getItem(BASE_URL_KEY);
        return stored ? normalizeBaseUrl(stored) : fallback;
    } catch {
        return fallback;
    }
}

function configurePreviewBaseUrl() {
    const current = getPreviewBaseUrl();
    const value = window.prompt(
        'Enter the same-origin URL that serves the workspace root. Example: /workspace/',
        current
    );
    if (value === null) return;

    try {
        const baseUrl = normalizeBaseUrl(value.trim());
        localStorage.setItem(BASE_URL_KEY, baseUrl);
        setStatus(`Workspace URL: ${new URL(baseUrl).pathname}`);
        if (previewWindow && !previewWindow.closed) publishPreview();
    } catch (error) {
        setStatus(error.message, true);
        window.alert(error.message);
    }
}

function findPreviewEntry() {
    const htmlTab = tab => tab && /\.html?$/i.test(tab.name);
    const active = getActiveTab();
    if (htmlTab(active)) return { entry: normalizePath(active.path || active.name), tab: active };

    const openHtml = [...state.tabs].reverse().find(htmlTab);
    if (openHtml) return { entry: normalizePath(openHtml.path || openHtml.name), tab: openHtml };

    const workspaceHtml = (state.workspace.fileIndex || []).find(item => /\.html?$/i.test(item.name));
    if (workspaceHtml) return { entry: normalizePath(workspaceHtml.path), tab: null };
    return { entry: '', tab: null };
}

async function makePayload() {
    const sequence = ++buildSequence;
    const { entry, tab } = findPreviewEntry();
    if (!entry) {
        return { type: 'NO_ENTRY', message: 'Open an HTML file or choose a workspace containing an HTML file.' };
    }

    const baseUrl = getPreviewBaseUrl();
    const entryUrl = new URL(entry, baseUrl).href;
    try {
        const response = await fetch(entryUrl, { method: 'HEAD', cache: 'no-store' });
        if (!response.ok) {
            return {
                type: 'PREVIEW_ERROR',
                message: `Static entry not found (${response.status}): ${entryUrl}. Configure the workspace URL or start its local static server.`
            };
        }
    } catch {
        return {
            type: 'PREVIEW_ERROR',
            message: `Cannot reach ${entryUrl}. Start the local static server and check the workspace URL.`
        };
    }

    if (sequence !== buildSequence) return null;
    return {
        type: 'RENDER',
        version: 1,
        engine: 'static-workspace',
        entry,
        entryUrl,
        html: tab?.model?.getValue(),
        sentAt: Date.now()
    };
}

async function publishPreview() {
    const payload = await makePayload();
    if (!payload) return;
    lastPayload = payload;
    if (channel) channel.postMessage(payload);
    if (payload.type === 'PREVIEW_ERROR') setStatus('Workspace URL unavailable', true);
    else if (previewWindow && !previewWindow.closed) setStatus('Preview connected');
}

function openPreviewTab() {
    if (previewWindow && !previewWindow.closed) {
        previewWindow.focus();
        publishPreview();
        return;
    }
    const url = new URL('./preview-tab.html', window.location.href);
    url.searchParams.set('channel', CHANNEL);
    url.searchParams.set('engine', 'static-workspace');
    previewWindow = window.open(url.href, 'monacoPreviewV8');
    if (!previewWindow) {
        setStatus('Popup blocked — allow pop-ups', true);
        return;
    }
    setStatus('Opening preview…');

    let attempts = 0;
    const retry = setInterval(() => {
        attempts += 1;
        if (!previewWindow || previewWindow.closed || attempts > 12) {
            clearInterval(retry);
            return;
        }
        if (lastPayload) channel?.postMessage(lastPayload);
        else publishPreview();
    }, 350);
    previewWindow.focus();
}

function initBridge() {
    if (!('BroadcastChannel' in window)) {
        setStatus('BroadcastChannel unsupported', true);
        return;
    }
    channel = new BroadcastChannel(CHANNEL);
    channel.addEventListener('message', event => {
        const message = event.data || {};
        if (message.type === 'READY') {
            setStatus('Preview connected');
            publishPreview();
        } else if (message.type === 'PREVIEW_ERROR') {
            setStatus('Preview error — see console', true);
            console.error('Preview error:', message.error);
        } else if (message.type === 'PREVIEW_LOG') {
            console.info('[Preview]', message.message);
        }
    });

    const button = document.getElementById('openFullPreviewBtn');
    if (button) button.addEventListener('click', openPreviewTab);
    const configureButton = document.getElementById('configurePreviewBaseUrlBtn');
    if (configureButton) configureButton.addEventListener('click', configurePreviewBaseUrl);

    const update = () => {
        clearTimeout(updateTimer);
        updateTimer = setTimeout(publishPreview, 180);
    };
    eventBus.on('model:contentChanged', update);
    eventBus.on('tab:activated', update);
    eventBus.on('workspace:opened', update);
    eventBus.on('file:saved', update);

    closedTimer = setInterval(() => {
        if (previewWindow && previewWindow.closed) {
            previewWindow = null;
            setStatus('Preview closed — click Full Preview');
        }
    }, 1000);

    window.addEventListener('beforeunload', () => {
        if (closedTimer) clearInterval(closedTimer);
        if (channel) channel.close();
    });
}

initBridge();
