export const actions = {
  load: async ({ url }) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Cannot load ${url}: ${response.status}`);

    const columns = await response.json();
    if (!Array.isArray(columns) || !columns.length) {
      throw new Error('columns.json must contain at least one column.');
    }

    const names = new Set();
    const supportedTypes = new Set(['string', 'number', 'boolean', 'object', 'array']);

    for (const column of columns) {
      if (!column?.name || typeof column.name !== 'string') {
        throw new Error('Every column needs a name.');
      }
      if (!supportedTypes.has(column.type)) {
        throw new Error(`Unsupported type "${column.type}" for ${column.name}.`);
      }
      if (names.has(column.name)) throw new Error(`Duplicate column: ${column.name}`);
      names.add(column.name);
    }

    return columns;
  },

  render: ({ containerId, columns }) => {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Missing #${containerId}`);

    container.replaceChildren();
    for (const column of columns) {
      const row = document.createElement('div');
      row.className = 'column';
      const name = document.createElement('span');
      name.className = 'column-name';
      name.textContent = column.name;
      const type = document.createElement('span');
      type.className = 'type';
      type.textContent = column.type;
      row.append(name, type);
      container.append(row);
    }
  }
};
