/**
 * Monaco IDE V5 - Live Split Preview with Virtual Asset Resolver
 * Inlines relative workspace CSS, resolves local scripts & images,
 * and renders real-time HTML, JSON AST, and Markdown.
 */

import { eventBus } from '../core/eventBus.js';
import { state, getActiveTab, resolveWorkspaceFile } from '../core/state.js';

let isPreviewOpen = false;
let debounceTimer = null;

export function togglePreview(editor) {
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

    if (editor) {
        setTimeout(() => editor.layout(), 50);
    }
}

/**
 * Virtual Workspace Asset Resolver
 * Resolves relative <link rel="stylesheet">, <script>, and <img> from local workspace files.
 */
async function resolveHtmlAssets(rawHtml, contextPath = '') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');

    // 1. Resolve relative CSS stylesheets
    const links = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'));
    for (const link of links) {
        const href = link.getAttribute('href');
        if (!href) continue;

        // Skip absolute/external CDN URLs
        if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
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

    // 2. Resolve relative <img> src tags
    const images = Array.from(doc.querySelectorAll('img[src]'));
    for (const img of images) {
        const src = img.getAttribute('src');
        if (!src || src.startsWith('http') || src.startsWith('data:') || src.startsWith('//')) {
            continue;
        }

        const resolved = await resolveWorkspaceFile(src, contextPath);
        if (resolved && resolved.file) {
            const blobUrl = URL.createObjectURL(resolved.file);
            img.setAttribute('src', blobUrl);
        }
    }

    // 3. Resolve relative <script src="..."> tags
    const scripts = Array.from(doc.querySelectorAll('script[src]'));
    for (const script of scripts) {
        const src = script.getAttribute('src');
        if (!src || src.startsWith('http') || src.startsWith('//')) continue;

        const resolved = await resolveWorkspaceFile(src, contextPath);
        if (resolved && resolved.text) {
            const inlineScript = doc.createElement('script');
            inlineScript.setAttribute('data-resolved-from', src);
            inlineScript.textContent = `/* [Resolved from workspace: ${src}] */\n${resolved.text}`;
            script.replaceWith(inlineScript);
        }
    }

    return doc.documentElement.outerHTML;
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
        container.innerHTML = '<iframe id="htmlPreviewFrame" class="w-full h-full border-0 bg-white" sandbox="allow-scripts allow-modals"></iframe>';
        const frame = document.getElementById('htmlPreviewFrame');
        if (frame) {
            // Apply Virtual Asset Resolver to inline local workspace CSS and scripts
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

export function initPreview(editor, monaco) {
    const splitBtn = document.getElementById('splitPreviewBtn');
    const closePreviewBtn = document.getElementById('closePreviewBtn');

    if (splitBtn) splitBtn.addEventListener('click', () => togglePreview(editor));
    if (closePreviewBtn) closePreviewBtn.addEventListener('click', () => togglePreview(editor));

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Backslash, () => {
        togglePreview(editor);
    });

    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
            e.preventDefault();
            togglePreview(editor);
        }
    });

    // React to EventBus signals
    eventBus.on('tab:activated', () => {
        if (isPreviewOpen) renderPreview();
    });

    eventBus.on('model:contentChanged', () => {
        schedulePreviewUpdate();
    });

    eventBus.on('file:saved', () => {
        if (isPreviewOpen) renderPreview();
    });
}

