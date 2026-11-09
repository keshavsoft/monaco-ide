import { bindEvents } from '../../core/bindings.js';
import { eventBus } from '../../core/eventBus.js';
import bindings from './bindings.json' with { type: 'json' };
import actions from './actions.js';

export function initJsonPath() {
    const headerEl = document.querySelector('header');
    if (headerEl) {
        bindEvents(headerEl, bindings, actions);
    }

    eventBus.on('file:loaded', () => {
        const input = document.getElementById('txtQuery');
        if (input && input.value.trim()) {
            actions.executeSearch();
        }
    });
}

export default initJsonPath;

