import instructions from './instructions.json' with { type: 'json' };
import bindings from './bindings.json' with { type: 'json' };
import { bindEvents } from '../../core/bindEvents.js';
import { runInstructions } from '../../core/runInstructions.js';
import { actions } from './actions.js';
export async function initColumns(context) {
  await runInstructions(instructions, actions, context);
  bindEvents(document, bindings, actions);
}
