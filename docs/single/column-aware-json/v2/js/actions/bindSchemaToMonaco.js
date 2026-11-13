const SCHEMA_URI = 'https://keshavsoft.local/schemas/column-aware-object-v2.json';

export function bindSchemaToMonaco({ monaco, schema }) {
  // Bind the generated contract to Monaco's built-in JSON language service.
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
