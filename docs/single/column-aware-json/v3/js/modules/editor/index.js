import instructions from './instructions.json' with { type: 'json' };
import bindings from './bindings.json' with { type: 'json' };
import { bindEvents } from '../../core/bindEvents.js';
import { actions } from './actions.js';
import { runInstructions } from '../../core/runInstructions.js';

export async function initEditor(context) {
  await runInstructions(instructions, actions, context);
  bindEvents(document, bindings, actions);
}
