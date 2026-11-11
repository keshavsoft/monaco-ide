/**
 * Monaco IDE V8 - Live Split Preview Module
 * Resolves workspace CSS, scripts via importmap, and local assets.
 * Supports side-by-side preview and 1-click standalone pop-out tab.
 */

import { bindEvents } from '../../core/bindings.js';
import { eventBus } from '../../core/eventBus.js';
import { state, getActiveTab, resolveWorkspaceFile } from '../../core/state.js';
import bindings from './bindings.json' with { type: 'json' };
import actions from './actions.js';

let isPreviewOpen = false;
let debounceTimer = null;
let lastResolvedHtml = '';

export function togglePreview() {
    const pane = document.getElementById('previewPane');
    const btn = document.getElementById('splitPreviewBtn');
    if (!pane) return;

    isPreviewOpen = !isPreviewOpen;

    if (isPreviewOpen) {
        pane.classList.remove('hidden');
        if (btn) btn.classList.add('bg-zinc-800', 'text-sky-400');
        renderPreview();
    } else {
        pane.classList.add('hidden');
        if (btn) btn.classList.remove('bg-zinc-800', 'text-sky-400');
    }

    if (state.editor) {
        setTimeout(() => state.editor.layout(), 50);
    }
}

export function popoutPreview() {
    if (!lastResolvedHtml) {
        const tab = getActiveTab();
        if (tab && tab.model) {
            lastResolvedHtml = tab.model.getValue();
        }
    }
    if (!lastResolvedHtml) return;

    const blob = new Blob([lastResolvedHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
}

/**
 * Builds an Import Map mapping workspace JS files to Blob URLs
 * so relative ES module imports resolve natively in the browser.
 */
async function buildWorkspaceImportMap() {
    const imports = {};
    for (const item of state.workspace.fileIndex) {
        if (item.name.endsWith('.js') || item.name.endsWith('.mjs')) {
            try {
                const file = await item.handle.getFile();
                const blobUrl = URL.createObjectURL(file);
                imports[`./${item.name}`] = blobUrl;
                imports[item.path] = blobUrl;
                imports[`./${item.path}`] = blobUrl;
            } catch {
                // Ignore unreadable files
            }
        }
    }
    return imports;
}

/**
 * Resolves workspace CSS, scripts, and images.
 */
async function resolveHtmlAssets(rawHtml, contextPath = '') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');

    // 1. Resolve and inline relative CSS stylesheets
    const links = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'));
    for (const link of links) {
        const href = link.getAttribute('href');
        if (!href || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
            continue;
        }

        const resolved = await resolveWorkspaceFile(href, contextPath);
        if (resolved && resolved.text) {
            const styleEl = doc.createElement('style');
            styleEl.setAttribute('data-resolved-from', href);
            styleEl.textContent = `/* [Resolved from workspace: ${href}] */\n${resolved.text}`;
            link.replaceWith(styleEl);
        }
    }

    // 2. Resolve relative images to blob URLs
    const images = Array.from(doc.querySelectorAll('img[src]'));
    for (const img of images) {
        const src = img.getAttribute('src');
        if (!src || src.startsWith('http') || src.startsWith('data:') || src.startsWith('//')) {
            continue;
        }

        const resolved = await resolveWorkspaceFile(src, contextPath);
        if (resolved && resolved.file) {
            img.setAttribute('src', URL.createObjectURL(resolved.file));
        }
    }

    // 3. Inject Import Map for ES module imports
    if (state.workspace.fileIndex.length > 0) {
        const importMapData = await buildWorkspaceImportMap();
        if (Object.keys(importMapData).length > 0) {
            const importMapEl = doc.createElement('script');
            importMapEl.type = 'importmap';
            importMapEl.textContent = JSON.stringify({ imports: importMapData });
            doc.head.prepend(importMapEl);
        }
    }

    // 4. Resolve relative script tags
    const scripts = Array.from(doc.querySelectorAll('script[src]'));
    for (const script of scripts) {
        const src = script.getAttribute('src');
        if (!src || src.startsWith('http') || src.startsWith('//')) continue;

        const isModule = script.type === 'module';
        const resolved = await resolveWorkspaceFile(src, contextPath);
        if (resolved) {
            if (isModule && resolved.file) {
                // Point src directly to Blob URL preserving type="module"
                script.src = URL.createObjectURL(resolved.file);
            } else if (resolved.text) {
                const inlineScript = doc.createElement('script');
                if (isModule) inlineScript.type = 'module';
                inlineScript.setAttribute('data-resolved-from', src);
                inlineScript.textContent = resolved.text;
                script.replaceWith(inlineScript);
            }
        }
    }

    lastResolvedHtml = doc.documentElement.outerHTML;
    return lastResolvedHtml;
}

export async function renderPreview() {
    if (!isPreviewOpen || !state.editor) return;

    const tab = getActiveTab();
    if (!tab || !tab.model) return;

    const lang = tab.model.getLanguageId();
    const content = tab.model.getValue();

    const container = document.getElementById('previewContainer');
    const badge = document.getElementById('previewLangBadge');
    if (!container) return;

    if (badge) badge.textContent = lang.toUpperCase();

    if (lang === 'html') {
        container.innerHTML = '<iframe id="htmlPreviewFrame" class="w-full h-full border-0 bg-white" sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-downloads allow-popups"></iframe>';
        const frame = document.getElementById('htmlPreviewFrame');
        if (frame) {
            const resolvedHtml = await resolveHtmlAssets(content, tab.path || '');
            frame.srcdoc = resolvedHtml;
        }
    } else if (lang === 'json') {
        try {
            const parsed = JSON.parse(content);
            const formatted = JSON.stringify(parsed, null, 2);
            container.innerHTML = `
                <div class="h-full flex flex-col bg-zinc-950 overflow-hidden">
                    <div class="p-2 border-b border-zinc-800 text-[11px] text-zinc-400 font-mono flex items-center justify-between">
                        <span><i class="bi bi-check-circle-fill text-emerald-400 mr-1"></i> Valid JSON AST</span>
                        <span>${Object.keys(parsed).length} Root Keys</span>
                    </div>
                    <pre class="p-4 text-xs font-mono text-zinc-300 overflow-auto flex-1 leading-relaxed">${escapeHtml(formatted)}</pre>
                </div>`;
        } catch (err) {
            container.innerHTML = `
                <div class="p-4 text-xs font-mono text-red-400 bg-red-950/30 border border-red-800 m-3 rounded">
                    <i class="bi bi-exclamation-triangle-fill mr-1"></i> Invalid JSON: ${escapeHtml(err.message)}
                </div>`;
        }
    } else if (lang === 'markdown') {
        container.innerHTML = `
            <div class="p-6 text-sm text-zinc-200 overflow-auto h-full space-y-3 leading-relaxed font-sans bg-zinc-950">
                ${simpleMarkdownToHtml(content)}
            </div>`;
    } else {
        container.innerHTML = `<pre class="p-4 text-xs font-mono text-zinc-400 overflow-auto h-full bg-zinc-950">${escapeHtml(content)}</pre>`;
    }
}

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function simpleMarkdownToHtml(md) {
    return md
        .replace(/^### (.*$)/gim, '<h3 class="text-base font-bold text-sky-400 mt-4 mb-2">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold text-sky-300 mt-5 mb-2">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-xl font-extrabold text-white mt-6 mb-3 border-b border-zinc-800 pb-2">$1</h1>')
        .replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-sky-500 pl-3 italic text-zinc-400 my-2">$1</blockquote>')
        .replace(/\*\*(.*)\*\*/gim, '<strong class="font-bold text-white">$1</strong>')
        .replace(/\*(.*)\*/gim, '<em class="italic text-zinc-300">$1</em>')
        .replace(/`([^`]+)`/gim, '<code class="bg-zinc-800 text-sky-300 px-1 py-0.5 rounded font-mono text-xs">$1</code>')
        .replace(/\n$/gim, '<br />');
}

export function schedulePreviewUpdate() {
    if (!isPreviewOpen) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(renderPreview, 150);
}

export function initPreview() {
    const previewPaneEl = document.getElementById('previewPane');
    if (previewPaneEl) {
        bindEvents(previewPaneEl, bindings, actions);
    }

    eventBus.on('ui:togglePreview', togglePreview);
    eventBus.on('tab:activated', () => {
        if (isPreviewOpen) renderPreview();
    });
    eventBus.on('model:contentChanged', schedulePreviewUpdate);
    eventBus.on('file:saved', () => {
        if (isPreviewOpen) renderPreview();
    });

    if (state.editor && state.monaco) {
        state.editor.addCommand(state.monaco.KeyMod.CtrlCmd | state.monaco.KeyCode.Backslash, togglePreview);
    }

    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
            e.preventDefault();
            togglePreview();
        }
    });
}

export default initPreview;

