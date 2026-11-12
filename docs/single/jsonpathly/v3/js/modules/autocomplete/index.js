import actions from './actions.js';

export function initAutocomplete() {
    const input = document.getElementById('txtQuery');
    if (!input) return;

    input.addEventListener('input', actions.handleInput);
    input.addEventListener('keydown', actions.handleKeydown);
    input.addEventListener('blur', () => {
        setTimeout(actions.hideDropdown, 200);
    });
}

export default initAutocomplete;
