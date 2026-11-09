import { eventBus } from '../../core/eventBus.js';

export const actions = {
    handleQueryKeydown: (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            actions.executeQuery();
        }
    },

    executeQuery: () => {
        eventBus.emit('jsonpath:execute');
    },

    clearQuery: () => {
        const input = document.getElementById('jsonPathQueryInput');
        if (input) {
            input.value = '';
            input.focus();
        }
        eventBus.emit('jsonpath:clear');
    },

    copyResult: () => {
        eventBus.emit('jsonpath:copy');
    },

    setFlavourTree: (event, matchEl) => {
        eventBus.emit('jsonpath:setFlavour', 'tree');
    },

    setFlavourPaths: (event, matchEl) => {
        eventBus.emit('jsonpath:setFlavour', 'paths');
    }
};

export default actions;
