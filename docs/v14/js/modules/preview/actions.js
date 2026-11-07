import { togglePreview } from './index.js';
import { openFullPreviewTab } from '../previewTab.js';

export const actions = {
    closePreview: () => {
        togglePreview();
    },
    popoutPreview: () => {
        openFullPreviewTab();
    }
};

export default actions;

