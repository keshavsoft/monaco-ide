export const state = { values: Object.create(null) };

export function setValue(key, value) { state.values[key] = value; }
export function getValue(key) { return state.values[key]; }
