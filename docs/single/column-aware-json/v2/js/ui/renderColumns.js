export function renderColumns(container, columns) {
  container.innerHTML = columns.map(({ name, type }) => `
    <div class="column">
      <span class="column-name">${escapeHtml(name)}</span>
      <span class="type">${escapeHtml(type)}</span>
    </div>
  `).join('');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}
