import { state } from '../../core/state.js';
import { query } from 'https://esm.sh/jsonpathly';

export const actions = {
    handleKeydown: (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            actions.executeSearch();
        }
    },

    executeSearch: () => {
        const input = document.getElementById('txtQuery');
        if (!input) return;
        const expr = input.value.trim();

        if (!state.resultEditor) return;

        if (!expr) {
            state.resultEditor.setValue('[\n  // Please enter a JSONPath query above (e.g. $.rawAst.end or $..type)\n]\n');
            return;
        }

        if (!state.sourceEditor) return;

        const rawSource = state.sourceEditor.getValue();
        let parsedData = null;

        try {
            parsedData = JSON.parse(rawSource);
        } catch (parseErr) {
            state.resultEditor.setValue(`/* JSON Syntax Error in Source Document:\n   ${parseErr.message}\n*/\n`);
            return;
        }

        try {
            const matches = query(parsedData, expr);
            if (!matches || matches.length === 0) {
                state.resultEditor.setValue(`// Zero matches found for: ${expr}\n[]\n`);
                return;
            }

            state.resultEditor.setValue(JSON.stringify(matches, null, 2) + '\n');
        } catch (queryErr) {
            state.resultEditor.setValue(`/* JSONPath Evaluation Error:\n   ${queryErr.message}\n*/\n`);
        }
    },

    clearQuery: () => {
        const input = document.getElementById('txtQuery');
        if (input) {
            input.value = '';
            input.focus();
        }
        if (state.resultEditor) {
            state.resultEditor.setValue('[\n  // Type a JSONPath query above and click Find\n]\n');
        }
    }
};

export default actions;

