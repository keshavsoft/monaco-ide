import { state } from '../../core/state.js';

export const actions = {
    toggleWordWrap: () => {
        state.isWrapping = !state.isWrapping;
        const wrapValue = state.isWrapping ? 'on' : 'off';

        state.sourceEditor?.updateOptions({ wordWrap: wrapValue });
        state.resultEditor?.updateOptions({ wordWrap: wrapValue });

        const btn = document.getElementById('btnWrap');
        if (btn) {
            btn.textContent = `Wrap: ${state.isWrapping ? 'On' : 'Off'}`;
        }
    },

    updateCursorPosition: (pos) => {
        const cursorEl = document.getElementById('statusCursor');
        if (cursorEl && pos) {
            cursorEl.textContent = `Ln ${pos.lineNumber}, Col ${pos.column}`;
        }
    }
};

export default actions;

