import actions from './actions.js';

export function initAutocomplete() {
    const input = document.getElementById('txtQuery');
    const clearButton = document.getElementById('btnClear');
    if (!input) return;

    input.addEventListener('input', actions.handleInput);
    input.addEventListener('keydown', actions.handleKeydown);
    input.addEventListener('blur', () => {
        setTimeout(actions.hideDropdown, 200);
    });

    if (clearButton) {
        clearButton.addEventListener('click', () => {
            input.value = '';
            actions.hideDropdown();
            input.focus();
        });
    }
}

export default initAutocomplete;
