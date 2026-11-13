export function renderColumns({ containerId, source }) {
  const container = document.getElementById(containerId);
  if (!container) throw new Error(`Missing element: #${containerId}`);

  container.replaceChildren();

  for (const column of source) {
    const item = document.createElement('div');
    item.className = 'column';

    const name = document.createElement('span');
    name.className = 'column-name';
    name.textContent = column.name;

    const type = document.createElement('span');
    type.className = 'type';
    type.textContent = column.type;

    item.append(name, type);
    container.append(item);
  }
}
