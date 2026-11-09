import { eventBus } from '../../core/eventBus.js';
import actions from './actions.js';

export function initTraceability() {
    eventBus.on('editors:ready', () => {
        actions.setupResultClickToLocate();
    });

    eventBus.on('jsonpath:executed', (query) => {
        actions.highlightPathInSource(query);
    });
}

export default initTraceability;

