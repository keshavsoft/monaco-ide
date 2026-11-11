/**
 * Monaco IDE V7 - Full-screen preview tab bridge.
 * The editor remains the workspace owner. Preview is a separate browser tab.
 */
import { eventBus } from '../core/eventBus.js';
import { state, getActiveTab } from '../core/state.js';

const CHANNEL = 'keshavsoft-monaco-preview-v7';
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
    el.className = `text-[9px] font-mono ${isError ? 'text-amber-400' : 'text-emerald-400'}`;
}

function normalizePath(path) {
    return String(path || '').replace(/\\/g, '/').replace(/^\/+/, '');
}

async function collectWorkspace() {
    const files = {};
    // Read indexed workspace files first. Unsaved Monaco models override these below.
    for (const item of (state.workspace.fileIndex || [])) {
        try {
            const file = await item.handle.getFile();
            const path = normalizePath(item.path);
            if (/\.(png|jpe?g|gif|webp|svg|ico)$/i.test(path) && !/\.svg$/i.test(path)) {
                const bytes = new Uint8Array(await file.arrayBuffer());
                let binary = '';
                for (let i = 0; i < bytes.length; i += 0x8000) {
                    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
                }
                const mime = file.type || 'application/octet-stream';
                files[path] = `data:${mime};base64,${btoa(binary)}`;
            } else {
                files[path] = await file.text();
            }
        } catch (error) {
            console.warn('Preview could not read workspace file:', item.path, error);
        }
    }
    for (const tab of state.tabs) {
        if (tab.model) files[normalizePath(tab.path || tab.name)] = tab.model.getValue();
    }

    const active = getActiveTab();
    let entry = active && /\.html?$/i.test(active.name) ? normalizePath(active.path || active.name) : '';
    if (!entry) {
        const openHtml = [...state.tabs].reverse().find(tab => /\.html?$/i.test(tab.name));
        if (openHtml) entry = normalizePath(openHtml.path || openHtml.name);
    }
    if (!entry) entry = Object.keys(files).find(path => /\.html?$/i.test(path)) || '';
    return { files, entry };
}

async function makePayload() {
    const sequence = ++buildSequence;
    const { files, entry } = await collectWorkspace();
    if (sequence !== buildSequence) return null;
    if (!entry || !files[entry]) {
        return { type: 'NO_ENTRY', message: 'Open an HTML file or choose a workspace containing an HTML file.' };
    }
    return {
        type: 'RENDER',
        version: 1,
        engine: 'native',
        entry,
        files,
        sentAt: Date.now()
    };
}

async function publishPreview() {
    const payload = await makePayload();
    if (!payload) return;
    lastPayload = payload;
    if (channel) channel.postMessage(payload);
    if (previewWindow && !previewWindow.closed) {
        // BroadcastChannel is primary; retrying also covers a newly opened preview tab.
        channel?.postMessage(payload);
        setStatus('Preview connected');
    }
}

function openPreviewTab() {
    if (previewWindow && !previewWindow.closed) {
        previewWindow.focus();
        publishPreview();
        return;
    }
    const url = new URL('./preview-tab.html', window.location.href);
    url.searchParams.set('channel', CHANNEL);
    url.searchParams.set('engine', 'native');
    previewWindow = window.open(url.href, 'monacoPreviewV7');
    if (!previewWindow) {
        setStatus('Popup blocked — allow pop-ups', true);
        return;
    }
    setStatus('Opening preview…');
    // Retry briefly to cover the preview page startup race.
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
            console.error('Preview runtime error:', message.error);
        } else if (message.type === 'PREVIEW_LOG') {
            console.info('[Preview]', message.message);
        }
    });

    const button = document.getElementById('openFullPreviewBtn');
    if (button) button.addEventListener('click', openPreviewTab);

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
