import { getValue } from '../core/state.js';

export function resolveBindings(value) {
  if (typeof value === 'string' && /^\$[A-Za-z][\w]*$/.test(value)) {
    return getValue(value.slice(1));
  }

  if (Array.isArray(value)) {
    return value.map(resolveBindings);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, resolveBindings(item)])
    );
  }

  return value;
}
