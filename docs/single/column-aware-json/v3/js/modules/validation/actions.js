import { state } from '../../core/state.js';

let moduleContext = null;

function readErrors(monaco, editor) {
  const model = editor.getModel();
  if (!model) return [];
  return monaco.editor.getModelMarkers({ resource: model.uri })
    .filter(({ severity }) => severity === monaco.MarkerSeverity.Error);
}

function paint(statusId, messageId, errors) {
  const status = document.getElementById(statusId);
  const message = document.getElementById(messageId);
  if (!status || !message) return;

  status.textContent = errors.length ? 'Needs attention' : 'Valid JSON';
  status.classList.toggle('invalid', errors.length > 0);
  message.textContent = errors.length
    ? errors.map(({ message: text }) => text).join(' · ')
    : 'The object follows the column definitions.';
}

export const actions = {
  validate: (input) => {
    const errors = readErrors(input.monaco, input.editor);
    paint(input.statusId, input.messageId, errors);
    return errors;
  },

  watch: (input) => {
    moduleContext = input;
    input.editor.onDidChangeModelContent(() => {
      window.setTimeout(() => {
        paint(input.statusId, input.messageId, readErrors(input.monaco, input.editor));
      }, 100);
    });
  },

  validateFromClick: () => {
    if (moduleContext) actions.validate(moduleContext);
  }
};
