export const actions = {
  createInitial: () => [
    { name: 'col1', type: 'string' },
    { name: 'col2', type: 'number' },
    { name: 'col3', type: 'boolean' }
  ],
  read: ({ editor }) => {
    const columns = JSON.parse(editor.getValue());
    if (!Array.isArray(columns) || !columns.length) throw new Error('Columns JSON must be a non-empty array.');
    const names = new Set(); const types = new Set(['string','number','boolean','object','array','null']);
    for (const column of columns) {
      if (!column || typeof column.name !== 'string' || !column.name.trim()) throw new Error('Every column needs a non-empty name.');
      if (!types.has(column.type)) throw new Error(`Unsupported type for ${column.name}: ${column.type}`);
      if (names.has(column.name)) throw new Error(`Duplicate column: ${column.name}`);
      names.add(column.name);
    }
    return columns;
  }
};
