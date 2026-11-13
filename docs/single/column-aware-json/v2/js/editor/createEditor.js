export function createEditor(monaco, container) {
  return monaco.editor.create(container, {
    value: '{}',
    language: 'json',
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on',
    tabSize: 2,
    formatOnPaste: true,
    formatOnType: true,
    scrollBeyondLastLine: false,
    suggest: { showProperties: true, showWords: false },
    quickSuggestions: { other: true, strings: true, comments: false }
  });
}
