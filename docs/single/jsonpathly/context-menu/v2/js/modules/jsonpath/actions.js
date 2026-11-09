import { state } from '../../core/state.js';
import { query } from 'https://esm.sh/jsonpathly';

export const actions = {
    executeSearch: (expr) => {
        if (!state.resultEditor) return;
        if (!expr) {
            state.resultEditor.setValue('[\n  // ⚡ Right-click any node on the left or Alt+Click\n  // to instantly extract and inspect its subtree here!\n]\n');
            return;
        }
        if (!state.sourceEditor) return;
        let parsed = null;
        try {
            parsed = JSON.parse(state.sourceEditor.getValue());
        } catch (err) {
            state.resultEditor.setValue(`/* JSON Parse Error in Left Document:\n   ${err.message}\n*/\n`);
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
    }
};

export default actions;

