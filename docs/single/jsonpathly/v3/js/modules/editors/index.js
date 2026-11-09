import { state } from '../../core/state.js';
import instructions from './instructions.json' with { type: 'json' };
import actions from './actions.js';

export async function initEditors(monaco) {
    state.monaco = monaco;
    await actions.createEditorsFromInstructions(monaco, instructions);
}

export default initEditors;

