export function createSchema(columns) {
  const properties = Object.fromEntries(columns.map(({ name, type }) => [name, {
    type,
    description: `Column type: ${type}`
  }]));

  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'Column-defined data object',
    type: 'object',
    properties,
    required: columns.map(({ name }) => name),
    additionalProperties: false
  };
}
