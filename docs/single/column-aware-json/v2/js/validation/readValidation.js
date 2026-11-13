export function readValidation(monaco, editor) {
  const model = editor.getModel();
  if (!model) return { isValid: false, messages: ['Editor model is unavailable.'] };

  const markers = monaco.editor.getModelMarkers({ resource: model.uri });
  const errors = markers.filter(({ severity }) => severity === monaco.MarkerSeverity.Error);

  return {
    isValid: errors.length === 0,
    messages: errors.map(({ message }) => message)
  };
}
