import { bindEvents } from '../../core/bindings.js';
import { eventBus } from '../../core/eventBus.js';
import { state } from '../../core/state.js';
import bindings from './bindings.json' with { type: 'json' };
import actions from './actions.js';

export function initStatusBar() {
    const footerEl = document.querySelector('footer');
    if (footerEl) bindEvents(footerEl, bindings, actions);
    eventBus.on('editors:ready', () => {
        state.sourceEditor?.onDidChangeCursorPosition((e) => actions.updateCursor(e.position));
        state.resultEditor?.onDidChangeCursorPosition((e) => actions.updateCursor(e.position));
    });
}
export default initStatusBar;

