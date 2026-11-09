import { state } from '../../core/state.js';
import { eventBus } from '../../core/eventBus.js';

export const actions = {
    openFile: async () => {
        // Prefer File System Access API
        if (window.showOpenFilePicker) {
            try {
                const [fileHandle] = await window.showOpenFilePicker({
                    types: [
                        {
                            description: 'JSON Files',
                            accept: { 'application/json': ['.json'], 'text/plain': ['.txt', '.json'] }
                        }
                    ],
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
                console.warn('[Header] showOpenFilePicker failed, falling back to input:', err);
            }
        }

        // Fallback to traditional file input
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.value = '';
            fileInput.click();
        }
    },

    handleFileInputChange: async (event, matchEl) => {
        const file = matchEl.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            actions.loadContentIntoSource(text, file.name);
        } catch (err) {
            console.error('[Header] Failed reading file:', err);
        }
    },

    loadContentIntoSource: (content, fileName = 'file.json') => {
        if (!state.sourceEditor) return;

        let formatted = content;
        try {
            const parsed = JSON.parse(content);
            formatted = JSON.stringify(parsed, null, 2) + '\n';
        } catch {
            // Keep raw if not parseable JSON
        }

        state.sourceEditor.setValue(formatted);
        eventBus.emit('file:loaded', { name: fileName, size: content.length });
    }
};

export default actions;

