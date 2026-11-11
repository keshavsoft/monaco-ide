import { togglePreview, popoutPreview } from './index.js';

export const actions = {
    closePreview: () => {
        togglePreview();
    },
    popoutPreview: () => {
        popoutPreview();
    }
};

export default actions;

