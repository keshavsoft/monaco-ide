/**
 * Monaco IDE Render V1 - Tab 2 Controller Module
 * Controls Tab 2 directly from Tab 1 using BroadcastChannel & LocalStorage.
 * Seamlessly renders JSON specifications via KeshavSoft json-to-dom v42.
 */

import { eventBus } from '../../core/eventBus.js';
import { state, getActiveTab } from '../../core/state.js';

const CHANNEL_NAME = 'keshavsoft-render-v1';
const STORAGE_KEY_CONTENT = 'keshavsoft_render_v1_content';
const STORAGE_KEY_META = 'keshavsoft_render_v1_meta';

let channel = null;
let debounceTimer = null;
let isTab2Active = false;

function setupBroadcastChannel() {
    try {
        channel = new BroadcastChannel(CHANNEL_NAME);
        channel.onmessage = (event) => {
            const msg = event.data || {};
            if (msg.type === 'TAB_READY' || msg.type === 'REQUEST_CONTENT') {
                isTab2Active = true;
                updateTab2Indicator(true);
                // Immediately reply with live content
                broadcastCurrentContent('CONTENT_UPDATE');
            }
        };
    } catch (err) {
        console.warn('[Render V1] BroadcastChannel not supported:', err);
    }
}

function updateTab2Indicator(active) {
    const badge = document.getElementById('tab2SyncStatus');
    if (!badge) return;
    if (active) {
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function getCurrentData() {
    const tab = getActiveTab();
    const content = (tab && tab.model) ? tab.model.getValue() : (state.editor ? state.editor.getValue() : '');
    const filename = tab ? tab.name : 'sample.json';
    const language = tab ? tab.language : 'json';
    return { content, filename, language };
}

/**
 * Broadcasts current editor content to Tab 2 and persists to localStorage
 */
export function broadcastCurrentContent(type = 'CONTENT_UPDATE') {
    const { content, filename, language } = getCurrentData();

    // 1. Persist to localStorage for instant hydration on fresh tab open
    try {
        localStorage.setItem(STORAGE_KEY_CONTENT, content);
        localStorage.setItem(STORAGE_KEY_META, JSON.stringify({ filename, language, timestamp: Date.now() }));
    } catch (e) {
        console.warn('[Render V1] LocalStorage error:', e);
    }

    // 2. Broadcast to live Tab 2
    if (channel) {
        channel.postMessage({
            type,
            content,
            filename,
            language
        });
    }
}

/**
 * Opens Tab 2 (render.html) and supplies the content
 */
export function openRenderTab() {
    const { content, filename, language } = getCurrentData();

    // Persist latest state
    try {
        localStorage.setItem(STORAGE_KEY_CONTENT, content);
        localStorage.setItem(STORAGE_KEY_META, JSON.stringify({ filename, language, timestamp: Date.now() }));
    } catch (e) {
        console.warn('[Render V1] LocalStorage error:', e);
    }

    // Broadcast render event
    if (channel) {
        channel.postMessage({
            type: 'RENDER',
            content,
            filename,
            language
        });
    }

    // Open render.html in a dedicated tab
    const renderUrl = new URL('./render.html', window.location.href);
    const win = window.open(renderUrl.href, 'keshavsoft_render_tab');
    if (win) {
        win.focus();
        isTab2Active = true;
        updateTab2Indicator(true);
    } else {
        alert('Popup was blocked by your browser. Please allow popups for localhost / this site.');
    }
}

export function scheduleBroadcast() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        broadcastCurrentContent('CONTENT_UPDATE');
    }, 150);
}

export function initPreview() {
    setupBroadcastChannel();

    // Listen to editor content changes
    eventBus.on('model:contentChanged', scheduleBroadcast);
    eventBus.on('file:loaded', () => {
        broadcastCurrentContent('CONTENT_UPDATE');
    });
    eventBus.on('file:saved', () => {
        broadcastCurrentContent('CONTENT_UPDATE');
    });

    // Listen to UI open render action (from Render button click)
    eventBus.on('ui:openRenderTab', openRenderTab);

    // Keyboard shortcut Ctrl+Enter / Cmd+Enter
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            openRenderTab();
        }
    });

    if (state.editor && state.monaco) {
        state.editor.addCommand(state.monaco.KeyMod.CtrlCmd | state.monaco.KeyCode.Enter, openRenderTab);
    }
}

export default initPreview;
