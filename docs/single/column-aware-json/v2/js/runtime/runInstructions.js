import { setValue } from '../core/state.js';
import { actions } from '../actions/index.js';
import { resolveBindings } from './resolveBindings.js';
import { eventBus } from '../core/eventBus.js';

export async function runInstructions(instructions) {
  for (const instruction of instructions.sequence || []) {
    const action = actions[instruction.action];

    if (typeof action !== 'function') {
      throw new Error(`Instruction action not found: ${instruction.action}`);
    }

    const input = resolveBindings(instruction.input || {});
    const result = await action(input);

    if (instruction.output) {
      setValue(instruction.output, result);
    }

    eventBus.emit('instruction:completed', {
      action: instruction.action,
      output: instruction.output || null
    });
  }

  eventBus.emit('application:ready');
}
