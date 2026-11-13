import { actions } from './index.js';

export function bindButtonEvents({
  monaco, editor, validateButtonId, resetButtonId,
  statusId, messageId, resetValue
}) {
  const validateButton = document.getElementById(validateButtonId);
  const resetButton = document.getElementById(resetButtonId);

  validateButton?.addEventListener('click', () => {
    actions.validateAndRender({ monaco, editor, statusId, messageId });
  });

  resetButton?.addEventListener('click', () => {
    editor.setValue(resetValue);
    editor.focus();
    editor.setPosition({ lineNumber: 1, column: 2 });
    actions.validateAndRender({ monaco, editor, statusId, messageId });
  });
}
