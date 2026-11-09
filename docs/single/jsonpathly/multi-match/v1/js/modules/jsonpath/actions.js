import { state } from '../../core/state.js';
import { eventBus } from '../../core/eventBus.js';
import { query, paths } from 'https://esm.sh/jsonpathly';

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
            state.resultEditor.setValue('[\n  // Query an array (e.g. $.rawAst.program.body[*]) to activate match stepper\n]\n');
            eventBus.emit('jsonpath:matches', { matches: [], paths: [] });
            return;
        }
        if (!state.sourceEditor) return;
        let parsed = null;
        try {
            parsed = JSON.parse(state.sourceEditor.getValue());
        } catch (err) {
            state.resultEditor.setValue(`/* JSON Parse Error in Source Document:\n   ${err.message}\n*/\n`);
            eventBus.emit('jsonpath:matches', { matches: [], paths: [] });
            return;
        }

        try {
            const matches = query(parsed, expr);
            let matchedPaths = [];
            try {
                matchedPaths = paths(parsed, expr);
            } catch {
                matchedPaths = [];
            }

            if (matches === undefined || (Array.isArray(matches) && matches.length === 0)) {
                state.resultEditor.setValue(`// Zero matches found for: ${expr}\n[]\n`);
                eventBus.emit('jsonpath:matches', { matches: [], paths: [] });
                return;
            }

            state.resultEditor.setValue(JSON.stringify(matches, null, 2) + '\n');
            eventBus.emit('jsonpath:matches', {
                matches: Array.isArray(matches) ? matches : [matches],
                paths: matchedPaths
            });
        } catch (err) {
            state.resultEditor.setValue(`/* JSONPath Evaluation Error:\n   ${err.message}\n*/\n`);
            eventBus.emit('jsonpath:matches', { matches: [], paths: [] });
        }
    },
    clearQuery: () => {
        const input = document.getElementById('txtQuery');
        if (input) { input.value = ''; input.focus(); }
        if (state.resultEditor) {
            state.resultEditor.setValue('[\n  // Query an array (e.g. $.rawAst.program.body[*]) to activate match stepper\n]\n');
        }
        eventBus.emit('jsonpath:matches', { matches: [], paths: [] });
    }
};
export default actions;

