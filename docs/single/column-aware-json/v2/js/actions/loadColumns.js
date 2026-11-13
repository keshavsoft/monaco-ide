export async function loadColumns({ url }) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Cannot load columns (${response.status}): ${url}`);
  }

  const columns = await response.json();
  if (!Array.isArray(columns) || columns.length === 0) {
    throw new Error('columns.json must contain a non-empty array.');
  }

  const names = new Set();
  const allowedTypes = new Set(['string', 'number', 'boolean', 'object', 'array']);

  for (const column of columns) {
    if (!column || typeof column.name !== 'string' || !column.name.trim()) {
      throw new Error('Every column must have a name.');
    }
    if (!allowedTypes.has(column.type)) {
      throw new Error(`Unsupported type "${column.type}" for ${column.name}.`);
    }
    if (names.has(column.name)) {
      throw new Error(`Duplicate column name: ${column.name}`);
    }
    names.add(column.name);
  }

  return columns;
}
