import {
    $,
    getEditor,
    models,
    sendPayload,
    setStatus,
    updateTab2Badge,
    renderWindow,
    setRenderWindow
} from '../state.js';

let wordWrapState = false;
let minimapState = false;

export const actions = {
    openFile: () => {
        const fileInput = $('fileInput');
        if (fileInput) fileInput.click();
    },

    toggleWordWrap: () => {
        const editor = getEditor();
        if (!editor) return;
        wordWrapState = !wordWrapState;
        editor.updateOptions({ wordWrap: wordWrapState ? 'on' : 'off' });
        const btn = $('toggleWordWrapBtn');
        if (btn) btn.textContent = `Wrap: ${wordWrapState ? 'On' : 'Off'}`;
    },

    toggleMinimap: () => {
        const editor = getEditor();
        if (!editor) return;
        minimapState = !minimapState;
        editor.updateOptions({ minimap: { enabled: minimapState } });
        const btn = $('toggleMinimapBtn');
        if (btn) btn.textContent = `Map: ${minimapState ? 'On' : 'Off'}`;
    },

    handleTabReady: (message) => {
        updateTab2Badge('Tab 2 Connected ✓', true);
        try {
            sendPayload();
        } catch (e) { }
    },

    handleRenderAck: (message) => {
        updateTab2Badge(`Tab 2 Live (${message.count} elements) ✓`, true);
    },

    handleRenderError: (message) => {
        setStatus(`Tab 2 Error: ${message.message}`, true);
        updateTab2Badge('Tab 2 Error ⚠', false);
    }
};

export default actions;
