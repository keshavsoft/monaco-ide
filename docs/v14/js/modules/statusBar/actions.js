import { toggleWordWrap, toggleMinimap } from './index.js';

export const actions = {
    toggleWordWrap: () => {
        toggleWordWrap();
    },
    toggleMinimap: () => {
        toggleMinimap();
    }
};

export default actions;

