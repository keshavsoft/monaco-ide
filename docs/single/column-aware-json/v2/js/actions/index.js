import { loadColumns } from './loadColumns.js';
import { renderColumns } from './renderColumns.js';
import { createColumnSchema } from './createColumnSchema.js';
import { loadMonaco } from './loadMonaco.js';
import { bindSchemaToMonaco } from './bindSchemaToMonaco.js';
import { createJsonEditor } from './createJsonEditor.js';
import { validateAndRender } from './validateAndRender.js';
import { bindEditorEvents } from './bindEditorEvents.js';
import { bindButtonEvents } from './bindButtonEvents.js';

export const actions = {
  loadColumns,
  renderColumns,
  createColumnSchema,
  loadMonaco,
  bindSchemaToMonaco,
  createJsonEditor,
  validateAndRender,
  bindEditorEvents,
  bindButtonEvents
};

export default actions;
