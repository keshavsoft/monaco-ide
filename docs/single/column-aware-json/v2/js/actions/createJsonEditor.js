export function createJsonEditor({ monaco, containerId, initialValue, options }) {
  const container = document.getElementById(containerId);
  if (!container) throw new Error(`Missing editor container: #${containerId}`);

  const editor = monaco.editor.create(container, {
    ...options,
    value: initialValue
  });

  editor.focus();
  editor.setPosition({ lineNumber: 1, column: 2 });
  return editor;
}
