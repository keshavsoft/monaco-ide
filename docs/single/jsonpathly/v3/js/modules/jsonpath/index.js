import { bindEvents } from '../../core/bindings.js';
import { eventBus } from '../../core/eventBus.js';
import bindings from './bindings.json' with { type: 'json' };
import actions from './actions.js';

export function initJsonPath() {
    // The query field moved to the right-side pane, so the JSONPath bindings must listen
    // at the document level rather than only the header.
    bindEvents(document.body, bindings, actions);

    eventBus.on('file:loaded', () => {
        const input = document.getElementById('txtQuery');
        if (input && input.value.trim()) {
            actions.executeSearch();
        }
    });
}

export default initJsonPath;

