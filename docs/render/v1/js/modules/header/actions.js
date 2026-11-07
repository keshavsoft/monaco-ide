import { eventBus } from '../../core/eventBus.js';

export const actions = {
    openFiles: () => {
        eventBus.emit('ui:openFiles');
    },
    openRenderTab: () => {
        eventBus.emit('ui:openRenderTab');
    }
};

export default actions;
