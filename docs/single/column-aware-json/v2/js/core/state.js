export const state = {
  context: Object.create(null),
  monaco: null,
  editor: null,
  columns: [],
  schema: null
};

export function setValue(name, value) {
  state.context[name] = value;
  if (name === 'monaco') state.monaco = value;
  if (name === 'editor') state.editor = value;
  if (name === 'columns') state.columns = value;
  if (name === 'schema') state.schema = value;
}

export function getValue(name) {
  return state.context[name];
}
