import instructions from './instructions.json' with { type: 'json' };
import bindings from './bindings.json' with { type: 'json' };
import { actions } from './actions.js';
import { runInstructions } from '../../core/runInstructions.js';
import { bindEvents } from '../../core/bindEvents.js';

export async function initValidation(context) {
  await runInstructions(instructions, actions, context);
  bindEvents(document, bindings, actions);
}
