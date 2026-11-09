import { eventBus } from '../../core/eventBus.js';
import actions from './actions.js';

export function initJsonPath() {
    eventBus.on('jsonpath:execute', (expr) => {
        actions.executeSearch(expr);
    });
}

export default initJsonPath;

