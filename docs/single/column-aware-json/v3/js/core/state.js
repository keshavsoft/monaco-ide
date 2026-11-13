export const state = {
  values: Object.create(null),
  monaco: null,
  editor: null
};

export function setValue(key, value) {
  state.values[key] = value;
  if (key === 'monaco') state.monaco = value;
  if (key === 'editor') state.editor = value;
}

export function getValue(key) {
  return state.values[key];
}
