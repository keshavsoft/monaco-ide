const SCHEMA_URI = 'https://keshavsoft.local/schemas/column-object-v2.json';

export function bindSchemaToMonaco(monaco, schema) {
  // This is the binding: the schema generated from columns is attached
  // to Monaco's JSON language service before the editor model is created.
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    allowComments: false,
    schemas: [
      {
        uri: SCHEMA_URI,
        fileMatch: ['*'],
        schema
      }
    ]
  });
}
