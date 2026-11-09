import { state } from '../../core/state.js';
import { query } from 'https://esm.sh/jsonpathly';

export const actions = {
    handleKeydown: (e) => {
        // If dropdown is open, let autocomplete handle navigation
        const dropdown = document.getElementById('autocompleteDropdown');
        if (dropdown && !dropdown.classList.contains('hidden') && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Tab')) {
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            // Hide autocomplete on Enter and execute
            if (dropdown) dropdown.classList.add('hidden');
            actions.executeSearch();
        }
    },
    executeSearch: () => {
        const input = document.getElementById('txtQuery');
        const expr = (input?.value || '').trim();
        if (!state.resultEditor) return;
        if (!expr) {
            state.resultEditor.setValue('[\n  // Type a query above (e.g. $.rawAst or $.project)\n]\n');
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
        } catch (err) {
            state.resultEditor.setValue(`/* JSONPath Evaluation Error:\n   ${err.message}\n*/\n`);
        }
    },
    clearQuery: () => {
        const input = document.getElementById('txtQuery');
        if (input) { input.value = ''; input.focus(); }
        const dropdown = document.getElementById('autocompleteDropdown');
        if (dropdown) dropdown.classList.add('hidden');
        if (state.resultEditor) {
            state.resultEditor.setValue('[\n  // Type $ in search bar to see dynamic autocomplete suggestions\n]\n');
        }
    }
};
export default actions;

