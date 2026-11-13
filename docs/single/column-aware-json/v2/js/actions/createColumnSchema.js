export function createColumnSchema({ source }) {
  const properties = {};

  for (const column of source) {
    properties[column.name] = {
      type: column.type,
      description: `Column contract: ${column.name} (${column.type})`
    };
  }

  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'Column-defined object',
    type: 'object',
    properties,
    required: source.map(({ name }) => name),
    additionalProperties: false
  };
}
