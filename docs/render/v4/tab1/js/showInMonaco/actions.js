import {
    $,
    getEditor,
    models,
    activeView,
    setActiveView,
    buildOutputSpec,
    sendPayload,
    setStatus,
    updateTab2Badge,
    renderWindow,
    setRenderWindow
} from '../state.js';

let wordWrapState = false;
let minimapState = false;

export const actions = {
    switchView: (event, matchElement) => {
        const editor = getEditor();
        if (!editor) return;

        // Save current editor state to model
        models[activeView] = editor.getValue();

        const nextView = matchElement.dataset.view;
        if (!nextView) return;

        // Auto-build output if requested and empty
        if (nextView === 'output' && !models.output) {
            try {
                buildOutputSpec();
            } catch (err) {
                setStatus(err.message, true);
                return;
            }
        }

        setActiveView(nextView);
        editor.setValue(models[nextView] || '');
        editor.updateOptions({ readOnly: false });

        document.querySelectorAll('[data-view]').forEach(item => {
            item.classList.toggle('active', item === matchElement);
        });

        const fn = $('fileName');
        if (fn) fn.textContent = `${nextView}.json`;
    },

    openTab2: () => {
        const url = new URL('../tab2/', location.href);
        const win = window.open(url.href, 'keshavsoft_render_tab2');
        if (!win) {
            setStatus('Popup blocked. Please allow popups for localhost.', true);
            return;
        }
        setRenderWindow(win);
        setStatus('Tab 2 opened in separate window');
    },

    playHtml: () => {
        const editor = getEditor();
        if (editor) {
            models[activeView] = editor.getValue();
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

    buildSpec: () => {
        const editor = getEditor();
        if (editor) {
            models[activeView] = editor.getValue();
        }
        try {
            buildOutputSpec();
            // Switch to output view
            const outputTab = document.querySelector('[data-view="output"]');
            if (outputTab) {
                actions.switchView(null, outputTab);
            }
            setStatus('Output spec built ✓');
        } catch (err) {
            setStatus(err.message, true);
            console.error('[Build Error]', err);
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
        setStatus(`Tab 2 rendered ${message.count} elements ✓`);
    },

    handleRenderError: (message) => {
        updateTab2Badge('Tab 2 Error', false);
        setStatus(`Tab 2 Error: ${message.message}`, true);
    }
};

export default actions;

