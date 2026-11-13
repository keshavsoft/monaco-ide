export const actions = {
  create: ({ columns }) => {
    const properties = {};
    for (const { name, type } of columns) properties[name] = { type };
    return { $schema: 'https://json-schema.org/draft/2020-12/schema', title: 'Live column knowledge', type: 'object', properties, additionalProperties: false };
  }
};
