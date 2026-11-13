const MONACO_BASE = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/';

export function loadMonaco() {
  return new Promise((resolve, reject) => {
    window.require.config({ paths: { vs: `${MONACO_BASE}vs` } });
    window.require(['vs/editor/editor.main'], () => resolve(window.monaco), reject);
  });
}

export function createJsonEditor(monaco, container, schema) {
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    allowComments: false,
    schemas: [{
      uri: 'https://keshavsoft.local/schemas/column-object-v1.json',
      fileMatch: ['*'],
      schema
    }]
  });

  const editor = monaco.editor.create(container, {
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

  return editor;
}
