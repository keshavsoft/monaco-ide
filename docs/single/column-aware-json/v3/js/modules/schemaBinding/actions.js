const SCHEMA_URI = 'https://keshavsoft.local/schemas/column-aware-v3.json';

export const actions = {
  bind: ({ monaco, schema }) => {
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      schemas: [{
        uri: SCHEMA_URI,
        fileMatch: ['*'],
        schema
      }]
    });
  }
};
