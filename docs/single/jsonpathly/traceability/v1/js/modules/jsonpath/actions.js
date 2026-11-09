import { state } from '../../core/state.js';
import { eventBus } from '../../core/eventBus.js';
import { query } from 'https://esm.sh/jsonpathly';

export const actions = {
    handleKeydown: (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            actions.executeSearch();
        }
    },
    executeSearch: () => {
        const input = document.getElementById('txtQuery');
        const expr = (input?.value || '').trim();
        if (!state.resultEditor) return;
        if (!expr) {
            state.resultEditor.setValue('[\n  // Enter a JSONPath query to trace source nodes\n]\n');
            return;
        }
        if (!state.sourceEditor) return;
        let parsed = null;
        try {
            parsed = JSON.parse(state.sourceEditor.getValue());
        } catch (err) {
            state.resultEditor.setValue(`/* JSON Parse Error in Source Document:\n   ${err.message}\n*/\n`);
            return;
        }

        try {
            const matches = query(parsed, expr);
            if (matches === undefined || (Array.isArray(matches) && matches.length === 0)) {
                state.resultEditor.setValue(`// Zero matches found for: ${expr}\n[]\n`);
                return;
            }
            state.resultEditor.setValue(JSON.stringify(matches, null, 2) + '\n');
            eventBus.emit('jsonpath:executed', expr);
        } catch (err) {
            state.resultEditor.setValue(`/* JSONPath Evaluation Error:\n   ${err.message}\n*/\n`);
        }
    },
    clearQuery: () => {
        const input = document.getElementById('txtQuery');
        if (input) { input.value = ''; input.focus(); }
        if (state.resultEditor) {
            state.resultEditor.setValue('[\n  // Enter a JSONPath query to trace source nodes\n]\n');
        }
        if (state.sourceEditor && state.currentDecorations) {
            state.currentDecorations = state.sourceEditor.deltaDecorations(state.currentDecorations, []);
        }
    }
};
export default actions;

