import { state } from '../../core/state.js';
import { eventBus } from '../../core/eventBus.js';

export const actions = {
    openFile: async () => {
        if (window.showOpenFilePicker) {
            try {
                const [fileHandle] = await window.showOpenFilePicker({
                    types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'], 'text/plain': ['.txt'] } }],
                    multiple: false
                });
                if (fileHandle) {
                    const file = await fileHandle.getFile();
                    const text = await file.text();
                    actions.loadContentIntoSource(text, file.name);
                    return;
                }
            } catch (err) {
                if (err.name === 'AbortError') return;
            }
        }
        const fileInput = document.getElementById('fileInput');
        if (fileInput) { fileInput.value = ''; fileInput.click(); }
    },

    handleFileInputChange: async (e, matchEl) => {
        const file = matchEl.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            actions.loadContentIntoSource(text, file.name);
        } catch (err) {
            console.error(err);
        }
    },

    loadContentIntoSource: (content, fileName = 'file.json') => {
        if (!state.sourceEditor) return;
        let formatted = content;
        try {
            const parsed = JSON.parse(content);
            formatted = JSON.stringify(parsed, null, 2) + '\n';
        } catch {}
        state.sourceEditor.setValue(formatted);
        eventBus.emit('file:loaded', { name: fileName, size: content.length });

        // Reset active pill to idle
        const container = document.getElementById('activePathContainer');
        if (container) {
            container.innerHTML = `
                <span class="text-zinc-500 font-mono text-xs flex items-center gap-1.5 select-none">
                    <i class="bi bi-cursor-fill text-amber-400"></i>
                    <span>Right-click or Alt+Click any node on Left Editor to inspect</span>
                </span>
            `;
        }
        if (state.resultEditor) {
            state.resultEditor.setValue('[\n  // ⚡ Right-click any node on the left or Alt+Click\n  // to instantly extract and inspect its subtree here!\n]\n');
        }
    },

    copyOutput: async () => {
        if (!state.resultEditor) return;
        const text = state.resultEditor.getValue();
        try {
            await navigator.clipboard.writeText(text);
            const btn = document.getElementById('btnCopyOutput');
            if (btn) {
                const originalHtml = btn.innerHTML;
                btn.innerHTML = '<i class="bi bi-check text-emerald-400"></i><span>Copied!</span>';
                setTimeout(() => { btn.innerHTML = originalHtml; }, 1500);
            }
        } catch (err) {
            console.error('Failed to copy output:', err);
        }
    }
};

export default actions;

