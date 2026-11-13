export function createColumnSchema(columns) {
  const properties = Object.fromEntries(
    columns.map(({ name, type }) => [
      name,
      {
        type,
        description: `Defined by columns.json · ${type}`
      }
    ])
  );

  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'Column-defined object',
    type: 'object',
    properties,
    required: columns.map(({ name }) => name),
    additionalProperties: false
  };
}
