(function () {
  const initialColumns = [
    { name: 'col1', type: 'string' },
    { name: 'col2', type: 'number' },
    { name: 'col3', type: 'boolean' }
  ];

  const columnsText = JSON.stringify(initialColumns, null, 2);
  const dataText = '{}';
  const schemaUri = 'inmemory://keshavsoft/live-column-knowledge.json';
  let columnsEditor;
  let dataEditor;
  let monacoApi;

  const editorOptions = {
    language: 'json',
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on',
    tabSize: 2,
    scrollBeyondLastLine: false,
    formatOnPaste: true,
    formatOnType: true,
    quickSuggestions: { other: true, strings: true, comments: false },
    suggest: { showProperties: true, showWords: false }
  };

  function setStatus(loaded, message) {
    const status = document.getElementById('intelligenceStatus');
    status.textContent = loaded ? 'Intelligence loaded' : 'Intelligence not loaded';
    status.className = loaded ? 'status active' : 'status inactive';
    document.getElementById('message').textContent = message;
  }

  function createSchema(columns) {
    const properties = {};
    for (const column of columns) {
      if (!column || typeof column.name !== 'string' || !column.name.trim()) {
        throw new Error('Every column must have a non-empty name.');
      }
      if (!['string', 'number', 'boolean', 'object', 'array', 'null'].includes(column.type)) {
        throw new Error('Unsupported type for column "' + column.name + '": ' + column.type);
      }
      if (Object.prototype.hasOwnProperty.call(properties, column.name)) {
        throw new Error('Duplicate column name: ' + column.name);
      }
      properties[column.name] = { type: column.type };
    }

    return {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      title: 'Live column knowledge',
      type: 'object',
      properties,
      additionalProperties: false
    };
  }

  function loadIntelligence() {
    try {
      const columns = JSON.parse(columnsEditor.getValue());
      if (!Array.isArray(columns)) {
        throw new Error('Columns JSON must be an array.');
      }
      const schema = createSchema(columns);

      // Replace only the registered knowledge. Do not recreate either editor or model.
      monacoApi.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        allowComments: false,
        schemas: [{
          uri: schemaUri,
          fileMatch: ['inmemory://keshavsoft/data.json'],
          schema
        }]
      });

      setStatus(true, 'Loaded ' + columns.length + ' column definitions. Try Ctrl+Space in the data editor.');
      dataEditor.focus();
    } catch (error) {
      setStatus(false, error.message);
    }
  }

  function resetExperiment() {
    columnsEditor.setValue(columnsText);
    dataEditor.setValue(dataText);
    monacoApi.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      schemas: []
    });
    setStatus(false, 'Reset complete. No column schema is registered.');
  }

  function start() {
    require.config({
      paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs' }
    });

    require(['vs/editor/editor.main', 'vs/language/json/monaco.contribution'], function (monaco) {
      monacoApi = monaco;

      const columnsModel = monaco.editor.createModel(
        columnsText, 'json', monaco.Uri.parse('inmemory://keshavsoft/columns.json')
      );
      const dataModel = monaco.editor.createModel(
        dataText, 'json', monaco.Uri.parse('inmemory://keshavsoft/data.json')
      );

      columnsEditor = monaco.editor.create(
        document.getElementById('columnsEditor'),
        { ...editorOptions, model: columnsModel }
      );
      dataEditor = monaco.editor.create(
        document.getElementById('dataEditor'),
        { ...editorOptions, model: dataModel }
      );

      // Deliberately start with no column-specific schema.
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        allowComments: false,
        schemas: []
      });

      document.getElementById('loadButton').addEventListener('click', loadIntelligence);
      document.getElementById('resetButton').addEventListener('click', resetExperiment);
      setStatus(false, 'Both editors are ready. Click Load Intelligence when you are ready.');
    }, function (error) {
      setStatus(false, 'Monaco could not load. Check your internet connection and CDN access.');
      console.error(error);
    });
  }

  window.addEventListener('load', start);
})();
