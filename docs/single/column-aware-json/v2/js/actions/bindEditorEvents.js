import { eventBus } from '../core/eventBus.js';

export function bindEditorEvents({ monaco, editor, statusId, messageId }) {
  editor.onDidChangeModelContent(() => {
    // Give Monaco's JSON language service a moment to refresh diagnostics.
    queueMicrotask(() => {
      const model = editor.getModel();
      const markers = model
        ? monaco.editor.getModelMarkers({ resource: model.uri })
        : [];
      const errors = markers.filter(
        ({ severity }) => severity === monaco.MarkerSeverity.Error
      );

      const status = document.getElementById(statusId);
      const message = document.getElementById(messageId);
      if (!status || !message) return;

      status.textContent = errors.length ? 'Needs attention' : 'Valid JSON';
      status.classList.toggle('invalid', errors.length > 0);
      message.textContent = errors.length
        ? errors.map(({ message: text }) => text).join(' · ')
        : 'The object follows the column definitions.';

      eventBus.emit('editor:validation-changed', { valid: errors.length === 0, errors });
    });
  });
}
