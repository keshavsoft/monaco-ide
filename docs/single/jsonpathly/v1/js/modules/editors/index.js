import { state } from '../../core/state.js';
import instructions from './instructions.json' with { type: 'json' };
import actions from './actions.js';

export async function initEditors(monaco) {
    state.monaco = monaco;
    await actions.createEditorsFromInstructions(monaco, instructions);
    console.log('[Editors Module] Initialized dual Monaco editors from instructions.json');
}

export default initEditors;

