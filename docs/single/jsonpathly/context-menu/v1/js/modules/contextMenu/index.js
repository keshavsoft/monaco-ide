import { eventBus } from '../../core/eventBus.js';
import actions from './actions.js';

export function initContextMenu() {
    eventBus.on('editors:ready', () => {
        actions.attachContextMenu();
    });
}

export default initContextMenu;

