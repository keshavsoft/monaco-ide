import { state } from '../../core/state.js';
import { eventBus } from '../../core/eventBus.js';

export const actions = {
    createEditorsFromInstructions: async (monaco, instructions = []) => {
        for (const spec of instructions) {
            const container = document.getElementById(spec.containerId);
            if (!container) continue;
            container.innerHTML = '';

            const editorInstance = monaco.editor.create(container, {
                ...spec.options,
                readOnly: !!spec.readOnly
            });

            if (spec.initialFile) {
                try {
                    const res = await fetch(spec.initialFile);
                    if (res.ok) {
                        const json = await res.json();
                        const formatted = JSON.stringify(json, null, 2) + '\n';
                        const model = monaco.editor.createModel(formatted, 'json');
                        editorInstance.setModel(model);
                    }
                } catch (err) {
                    console.warn(`[Editors] Failed to load ${spec.initialFile}:`, err);
                }
            } else if (spec.initialContent) {
                const model = monaco.editor.createModel(spec.initialContent, 'json');
                editorInstance.setModel(model);
            }

            if (spec.role === 'source') state.sourceEditor = editorInstance;
            else if (spec.role === 'result') state.resultEditor = editorInstance;
        }

        state.sourceEditor?.layout();
        state.resultEditor?.layout();
        setTimeout(() => {
            state.sourceEditor?.layout();
            state.resultEditor?.layout();
        }, 100);

        window.addEventListener('resize', () => {
            state.sourceEditor?.layout();
            state.resultEditor?.layout();
        });

        eventBus.emit('editors:ready');
    }
};
export default actions;

