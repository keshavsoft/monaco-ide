import { setValue } from './state.js';

function resolve(value, context) {
  if (typeof value === 'string' && /^\$[A-Za-z][\w]*$/.test(value)) {
    return context[value.slice(1)];
  }

  if (Array.isArray(value)) return value.map((item) => resolve(item, context));

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, resolve(item, context)])
    );
  }

  return value;
}

export async function runInstructions(instructions, actions, context = {}) {
  for (const instruction of instructions.sequence || []) {
    const action = actions[instruction.action];
    if (typeof action !== 'function') {
      throw new Error(`Unknown instruction action: ${instruction.action}`);
    }

    const result = await action(resolve(instruction.input || {}, context));
    if (instruction.output) {
      context[instruction.output] = result;
      setValue(instruction.output, result);
    }
  }

  return context;
}
