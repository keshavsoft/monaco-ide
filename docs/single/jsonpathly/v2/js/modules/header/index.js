import { bindEvents } from '../../core/bindings.js';
import bindings from './bindings.json' with { type: 'json' };
import actions from './actions.js';

export function initHeader() {
    const headerEl = document.querySelector('header');
    if (headerEl) {
        bindEvents(headerEl, bindings, actions);
    }

    // Keyboard shortcut Ctrl+O to open file
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
            e.preventDefault();
            actions.openFile();
        }
    });
}

export default initHeader;
