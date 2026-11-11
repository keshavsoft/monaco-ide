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
    playHtml: () => {
        const editor = getEditor();
        if (editor) {
            models.output = editor.getValue();
        }

        try {
            // Ensure Tab 2 is open
            if (!renderWindow || renderWindow.closed) {
                const url = new URL('../tab2/', location.href);
                const win = window.open(url.href, 'keshavsoft_render_tab2');
                if (!win) {
                    setStatus('Popup blocked. Allow popups for localhost.', true);
                    return;
                }
                setRenderWindow(win);
            } else {
                renderWindow.focus();
            }

            // Beam payload
            sendPayload();
        } catch (err) {
            setStatus(err.message, true);
            console.error('[Play HTML Error]', err);
        }
    },

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
