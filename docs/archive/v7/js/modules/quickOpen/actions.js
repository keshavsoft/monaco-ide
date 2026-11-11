import {
    updateResults,
    navigateList,
    selectActiveItem,
    selectItemByIndex,
    closeQuickPalette
} from './index.js';

export const actions = {
    handleSearchInput: (event, matchElement) => {
        updateResults(matchElement.value);
    },
    handleSearchKeydown: (event) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            navigateList(1);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            navigateList(-1);
        } else if (event.key === 'Enter') {
            event.preventDefault();
            selectActiveItem();
        } else if (event.key === 'Escape') {
            event.preventDefault();
            closeQuickPalette();
        }
    },
    closeQuickOpen: () => {
        closeQuickPalette();
    },
    selectQuickOpenItem: (event, matchElement) => {
        const index = parseInt(matchElement.dataset.index, 10);
        if (!isNaN(index)) {
            selectItemByIndex(index);
        }
    }
};

export default actions;

