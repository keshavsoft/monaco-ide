import { loadColumns } from './columns/loadColumns.js';
import { createColumnSchema } from './schema/createColumnSchema.js';
import { bindSchemaToMonaco } from './bindings/bindSchemaToMonaco.js';
import { loadMonaco } from './editor/loadMonaco.js';
import { createEditor } from './editor/createEditor.js';
import { readValidation } from './validation/readValidation.js';
import { renderColumns } from './ui/renderColumns.js';
import { renderStatus } from './ui/renderStatus.js';

async function start() {
  const elements = {
    columnList: document.querySelector('#columnList'),
    editor: document.querySelector('#editor'),
    status: document.querySelector('#status'),
    message: document.querySelector('#validationMessage'),
    validate: document.querySelector('#validateButton'),
    reset: document.querySelector('#resetButton')
  };

  // 1. Read the only source of column knowledge.
  const columns = await loadColumns();
  renderColumns(elements.columnList, columns);

  // 2. Translate column definitions into a JSON Schema.
  const schema = createColumnSchema(columns);

  // 3. Bind that schema to Monaco's built-in JSON language service.
  const monaco = await loadMonaco();
  bindSchemaToMonaco(monaco, schema);

  // 4. Create the JSON editor after the schema binding is in place.
  const editor = createEditor(monaco, elements.editor);

  // 5. Read diagnostics and present them in the page.
  const validate = () => {
    renderStatus(
      elements.status,
      elements.message,
      readValidation(monaco, editor)
    );
  };

  editor.onDidChangeModelContent(validate);
  elements.validate.addEventListener('click', validate);
  elements.reset.addEventListener('click', () => {
    editor.setValue('{}');
    editor.focus();
    validate();
  });

  validate();
  editor.focus();
  editor.setPosition({ lineNumber: 1, column: 2 });
}

start().catch((error) => {
  console.error('Column-aware JSON V2 failed to start:', error);
  const status = document.querySelector('#status');
  const message = document.querySelector('#validationMessage');
  status.textContent = 'Unable to start';
  status.classList.add('invalid');
  message.textContent = error.message;
});
