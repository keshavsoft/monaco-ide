import { createTab, switchTab, closeTab, openOrSwitchTab } from './index.js';
import { state } from '../../core/state.js';

export const actions = {
    createNewTab: () => {
        createTab({
            name: `untitled-${state.tabs.length + 1}.json`,
            content: '{\n  \n}\n',
            language: 'json'
        });
    },
    switchTab: (event, matchElement) => {
        // If clicked on close button inside tab, let closeTab handle it
        if (event.target.closest('.tab-close-btn')) return;

        const tabId = matchElement.dataset.tabId;
        if (tabId) {
            switchTab(tabId);
        }
    },
    closeTab: (event, matchElement) => {
        event.stopPropagation();
        const tabEl = matchElement.closest('.tab-item');
        const tabId = tabEl?.dataset?.tabId;
        if (tabId) {
            closeTab(tabId);
        }
    },
    handleFileInput: async (event, matchElement) => {
        const files = matchElement.files;
        if (!files || files.length === 0) return;

        for (const file of files) {
            const text = await file.text();
            openOrSwitchTab({
                name: file.name,
                content: text,
                handle: null,
                path: file.name,
                size: file.size
            });
        }
        matchElement.value = '';
    }
};

export default actions;

