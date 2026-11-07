import { eventBus } from '../../core/eventBus.js';
import { refreshExplorer, openWorkspace } from './index.js';

export const actions = {
    refreshWorkspace: () => {
        refreshExplorer();
    },
    openFolder: () => {
        openWorkspace();
    },
    openTreeFile: async (event, matchElement) => {
        const path = matchElement.dataset.path;
        if (!path) return;

        eventBus.emit('explorer:fileClicked', { path, element: matchElement });
    }
};

export default actions;

