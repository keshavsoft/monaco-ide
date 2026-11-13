export async function loadColumns() {
  const response = await fetch('./data/columns.json');
  if (!response.ok) {
    throw new Error(`Unable to load columns: ${response.status} ${response.statusText}`);
  }

  const columns = await response.json();
  validateColumns(columns);
  return columns;
}

function validateColumns(columns) {
  if (!Array.isArray(columns) || columns.length === 0) {
    throw new Error('The columns source must be a non-empty array.');
  }

  const names = new Set();
  const supportedTypes = new Set(['string', 'number', 'boolean', 'object', 'array']);

  for (const column of columns) {
    if (!column || typeof column.name !== 'string' || !column.name.trim()) {
      throw new Error('Every column must have a non-empty name.');
    }
    if (!supportedTypes.has(column.type)) {
      throw new Error(`Unsupported type for column "${column.name}": ${column.type}`);
    }
    if (names.has(column.name)) {
      throw new Error(`Duplicate column name: ${column.name}`);
    }
    names.add(column.name);
  }
}
