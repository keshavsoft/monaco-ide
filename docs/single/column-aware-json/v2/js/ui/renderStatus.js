export function renderStatus(statusElement, messageElement, result) {
  statusElement.textContent = result.isValid ? 'Valid JSON' : 'Needs attention';
  statusElement.classList.toggle('invalid', !result.isValid);

  messageElement.textContent = result.isValid
    ? 'The object follows the column definitions.'
    : result.messages.join(' · ');
}
