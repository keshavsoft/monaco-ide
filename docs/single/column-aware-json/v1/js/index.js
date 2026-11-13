import { createSchema } from './schema.js';
import { createJsonEditor, loadMonaco } from './editor.js';

const columns = [
  { name: 'col1', type: 'string' },
  { name: 'col2', type: 'number' },
  { name: 'col3', type: 'boolean' }
];

const columnList = document.querySelector('#columnList');
const status = document.querySelector('#status');
const validationMessage = document.querySelector('#validationMessage');

function renderColumns() {
  columnList.innerHTML = columns.map(({ name, type }) => `
    <div class="column">
      <span class="column-name">${name}</span>
      <span class="type">${type}</span>
    </div>
  `).join('');
}

function setStatus(isValid, message) {
  status.textContent = isValid ? 'Valid JSON' : 'Needs attention';
  status.classList.toggle('invalid', !isValid);
  validationMessage.textContent = message;
}

async function boot() {
  renderColumns();
  const monaco = await loadMonaco();
  const schema = createSchema(columns);
  const editor = createJsonEditor(monaco, document.querySelector('#editor'), schema);

  const validate = () => {
    const model = editor.getModel();
    const markers = monaco.editor.getModelMarkers({ resource: model.uri });
    const errors = markers.filter(({ severity }) => severity === monaco.MarkerSeverity.Error);
    setStatus(errors.length === 0, errors.length
      ? errors.map(({ message }) => message).join(' · ')
      : 'The object follows the column definitions.');
  };

  editor.onDidChangeModelContent(validate);
  document.querySelector('#validateButton').addEventListener('click', validate);
  document.querySelector('#resetButton').addEventListener('click', () => {
    editor.setValue('{}');
    editor.focus();
    validate();
  });

  validate();
  editor.focus();
  editor.setPosition({ lineNumber: 1, column: 2 });
}

boot().catch((error) => {
  console.error('Unable to initialize the column-aware JSON editor:', error);
  setStatus(false, 'Monaco could not be loaded. Check the network connection and reload.');
});
