/**
 * Monaco IDE V4 - Live Split-Screen Preview Manager
 * Renders real-time HTML, formatted JSON, and Markdown in a split pane.
 * Toggle with Ctrl+\ or the Preview button.
 */

let isPreviewOpen = false;
let editorInstance = null;
let debounceTimer = null;

function renderPreview() {
    if (!isPreviewOpen || !editorInstance) return;

    const model = editorInstance.getModel();
    if (!model) return;

    const lang = model.getLanguageId();
    const content = model.getValue();

    const container = document.getElementById('previewContainer');
    const badge = document.getElementById('previewLangBadge');
    if (!container) return;

    if (badge) badge.textContent = lang.toUpperCase();

    if (lang === 'html') {
        container.innerHTML = '<iframe id="htmlPreviewFrame" class="w-full h-full border-0 bg-white" sandbox="allow-scripts"></iframe>';
        const frame = document.getElementById('htmlPreviewFrame');
        if (frame) {
            frame.srcdoc = content;
        }
    } else if (lang === 'json') {
        try {
            const parsed = JSON.parse(content);
            const formatted = JSON.stringify(parsed, null, 2);
            container.innerHTML = `<pre class="p-4 text-xs font-mono text-zinc-300 overflow-auto h-full leading-relaxed">${escapeHtml(formatted)}</pre>`;
        } catch (err) {
            container.innerHTML = `<div class="p-4 text-xs font-mono text-red-400 bg-red-950/30 border border-red-800 m-3 rounded">Invalid JSON: ${escapeHtml(err.message)}</div>`;
        }
    } else if (lang === 'markdown') {
        container.innerHTML = `<div class="p-6 text-sm text-zinc-200 overflow-auto h-full space-y-3 leading-relaxed font-sans">${simpleMarkdownToHtml(content)}</div>`;
    } else {
        container.innerHTML = `<pre class="p-4 text-xs font-mono text-zinc-400 overflow-auto h-full">${escapeHtml(content)}</pre>`;
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
        .replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-sky-500 pl-3 italic text-zinc-400">$1</blockquote>')
        .replace(/\*\*(.*)\*\*/gim, '<strong class="font-bold text-white">$1</strong>')
        .replace(/\*(.*)\*/gim, '<em class="italic text-zinc-300">$1</em>')
        .replace(/`([^`]+)`/gim, '<code class="bg-zinc-800 text-sky-300 px-1 py-0.5 rounded font-mono text-xs">$1</code>')
        .replace(/\n$/gim, '<br />');
}

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

export function schedulePreviewUpdate() {
    if (!isPreviewOpen) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(renderPreview, 150);
}

export function initPreviewManager(editor, monaco) {
    editorInstance = editor;

    const splitBtn = document.getElementById('splitPreviewBtn');
    const closePreviewBtn = document.getElementById('closePreviewBtn');

    if (splitBtn) {
        splitBtn.addEventListener('click', () => togglePreview(editor));
    }

    if (closePreviewBtn) {
        closePreviewBtn.addEventListener('click', () => togglePreview(editor));
    }

    // Ctrl+\ keyboard shortcut for split preview
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Backslash, () => {
        togglePreview(editor);
    });

    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
            e.preventDefault();
            togglePreview(editor);
        }
    });

    // Re-render when active model changes or content changes
    editor.onDidChangeModel(() => {
        if (isPreviewOpen) renderPreview();
    });

    editor.onDidChangeModelContent(() => {
        schedulePreviewUpdate();
    });
}

