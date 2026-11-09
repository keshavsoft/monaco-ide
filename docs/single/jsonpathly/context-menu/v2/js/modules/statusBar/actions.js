import { state } from '../../core/state.js';

export const actions = {
    toggleWordWrap: () => {
        state.isWrapping = !state.isWrapping;
        const val = state.isWrapping ? 'on' : 'off';
        state.sourceEditor?.updateOptions({ wordWrap: val });
        state.resultEditor?.updateOptions({ wordWrap: val });
        const btn = document.getElementById('btnWrap');
        if (btn) btn.textContent = `Wrap: ${state.isWrapping ? 'On' : 'Off'}`;
    },
    updateCursor: (pos) => {
        const el = document.getElementById('statusCursor');
        if (el && pos) el.textContent = `Ln ${pos.lineNumber}, Col ${pos.column}`;
    }
};
export default actions;

