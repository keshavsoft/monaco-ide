const SCHEMA_URI = 'inmemory://keshavsoft/live-column-knowledge.json';
const DATA_URI = 'inmemory://keshavsoft/data.json';
export const actions = {
  register: ({ monaco, schema }) => {
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({ validate: true, allowComments: false, schemas: [{ uri: SCHEMA_URI, fileMatch: [DATA_URI], schema }] });
    return true;
  },
  pull: ({ monaco, editor }) => {
    const options = monaco.languages.json.jsonDefaults.diagnosticsOptions;
    const entry = (options.schemas || []).find((item) => item.uri === SCHEMA_URI);
    const result = entry ? { found: true, uri: entry.uri, fileMatch: entry.fileMatch, schema: entry.schema ?? null } : { found: false, message: 'No schema registered for this experiment yet.' };
    editor.setValue(JSON.stringify(result, null, 2));
    return result;
  },
  clear: ({ monaco }) => monaco.languages.json.jsonDefaults.setDiagnosticsOptions({ validate: true, allowComments: false, schemas: [] })
};
