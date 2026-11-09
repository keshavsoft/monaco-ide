import { state } from '../../core/state.js';
import { eventBus } from '../../core/eventBus.js';

export const actions = {
    createEditorsFromInstructions: async (monaco, instructions = []) => {
        for (const spec of instructions) {
            const container = document.getElementById(spec.containerId);
            if (!container) {
                console.warn(`[Editors Module] Container #${spec.containerId} not found.`);
                continue;
            }

            // Clear any static placeholders
            container.innerHTML = '';

            // Create Monaco Editor Instance
            const editorInstance = monaco.editor.create(container, {
                ...spec.options,
                readOnly: !!spec.readOnly
            });

            // Load initial file or content
            if (spec.initialFile) {
                try {
                    const res = await fetch(spec.initialFile);
                    if (res.ok) {
                        const json = await res.json();
                        const formatted = JSON.stringify(json, null, 2) + '\n';
                        const model = monaco.editor.createModel(formatted, 'json');
                        editorInstance.setModel(model);

                        const lineCount = model.getLineCount();
                        const statsEl = document.getElementById(`${spec.id}Stats`);
                        if (statsEl) statsEl.textContent = `${lineCount} lines`;

                        // Initialize single tab state for source editor
                        const singleTab = {
                            id: 1,
                            name: spec.initialFile.split('/').pop() || 'sample.json',
                            model: model,
                            size: new Blob([formatted]).size,
                            isDirty: false,
                            lastSavedContent: formatted
                        };
                        state.tabs = [singleTab];
                        state.activeTabId = 1;
                        eventBus.emit('file:loaded', singleTab);
                    }
                } catch (err) {
                    console.warn(`[Editors Module] Failed to load ${spec.initialFile}:`, err);
                }
            } else if (spec.initialContent) {
                const model = monaco.editor.createModel(spec.initialContent, 'json');
                editorInstance.setModel(model);
            }

            // Register into central state
            if (spec.role === 'source') {
                state.sourceEditor = editorInstance;
                state.editor = editorInstance;
            } else if (spec.role === 'result') {
                state.resultEditor = editorInstance;
            }

            state[spec.id] = editorInstance;
        }

        // Trigger layout pass on both editors
        setTimeout(() => {
            state.sourceEditor?.layout();
            state.resultEditor?.layout();
        }, 50);

        window.addEventListener('resize', () => {
            state.sourceEditor?.layout();
            state.resultEditor?.layout();
        });

        // Broadcast that both editors are ready
        eventBus.emit('editors:ready', {
            source: state.sourceEditor,
            result: state.resultEditor
        });
    }
};

export default actions;

