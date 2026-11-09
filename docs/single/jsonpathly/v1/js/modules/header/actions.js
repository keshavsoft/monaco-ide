import { eventBus } from '../../core/eventBus.js';

export const actions = {
    openFiles: () => {
        eventBus.emit('ui:openFiles');
    }
};

export default actions;
