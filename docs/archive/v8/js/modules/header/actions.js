import { eventBus } from '../../core/eventBus.js';

export const actions = {
    toggleSidebar: () => {
        eventBus.emit('ui:toggleSidebar');
    },
    openFiles: () => {
        eventBus.emit('ui:openFiles');
    },
    openFolder: () => {
        eventBus.emit('ui:openFolder');
    },
    openQuickOpen: () => {
        eventBus.emit('ui:openQuickOpen');
    },
    saveActiveFile: () => {
        eventBus.emit('ui:saveActiveFile');
    },
    formatActiveDocument: () => {
        eventBus.emit('ui:formatActiveDocument');
    },
    togglePreview: () => {
        eventBus.emit('ui:togglePreview');
    }
};

export default actions;

