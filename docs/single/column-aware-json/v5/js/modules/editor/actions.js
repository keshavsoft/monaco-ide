const editorOptions = { language: 'json', theme: 'vs-dark', automaticLayout: true, minimap: { enabled: false }, fontSize: 14, lineNumbers: 'on', tabSize: 2, scrollBeyondLastLine: false, formatOnPaste: true, formatOnType: true, quickSuggestions: { other: true, strings: true, comments: false }, suggest: { showProperties: true, showWords: false } };
export const actions = {
  create: ({ monaco, containerId, value, uri, readOnly = false }) => {
    const model = monaco.editor.createModel(value, 'json', monaco.Uri.parse(uri));
    return monaco.editor.create(document.getElementById(containerId), { ...editorOptions, model, readOnly });
  },
  createAll: ({ monaco, initialColumns }) => ({
    columnsEditor: actions.create({ monaco, containerId: 'columnsEditor', value: JSON.stringify(initialColumns, null, 2), uri: 'inmemory://keshavsoft/columns.json' }),
    dataEditor: actions.create({ monaco, containerId: 'dataEditor', value: '{}', uri: 'inmemory://keshavsoft/data.json' }),
    returnedEditor: actions.create({ monaco, containerId: 'returnedEditor', value: '{}', uri: 'inmemory://keshavsoft/returned-schema.json', readOnly: true })
  })
};
