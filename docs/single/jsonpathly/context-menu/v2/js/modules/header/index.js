import { bindEvents } from '../../core/bindings.js';
import bindings from './bindings.json' with { type: 'json' };
import actions from './actions.js';

export function initHeader() {
    const headerEl = document.querySelector('header');
    if (headerEl) {
        bindEvents(headerEl, bindings, actions);
    }
}

export default initHeader;

