/**
 * Monaco IDE V5 - Studio Status Bar Module
 * Displays cursor position, language, encoding, and toggles Word Wrap & Minimap.
 */

import { eventBus } from '../core/eventBus.js';
import { state, getActiveTab } from '../core/state.js';

let isWordWrap = false;
let isMinimap = false;

export function initStatusBar(editor, monaco) {
    const lnColEl = document.getElementById('cursorPos');
    const wordWrapBtn = document.getElementById('toggleWordWrapBtn');
    const minimapBtn = document.getElementById('toggleMinimapBtn');
    const langEl = document.getElementById('statusLanguage');

    function updateCursorPosition() {
        if (!editor || !lnColEl) return;
        const pos = editor.getPosition();
        if (pos) {
            lnColEl.textContent = `Ln ${pos.lineNumber}, Col ${pos.column}`;
        }
    }

    function toggleWordWrap() {
        if (!editor) return;
        isWordWrap = !isWordWrap;
        editor.updateOptions({ wordWrap: isWordWrap ? 'on' : 'off' });
        if (wordWrapBtn) {
            wordWrapBtn.classList.toggle('text-sky-400', isWordWrap);
            wordWrapBtn.classList.toggle('text-zinc-400', !isWordWrap);
            wordWrapBtn.textContent = isWordWrap ? 'Wrap: On' : 'Wrap: Off';
        }
    }

    function toggleMinimap() {
        if (!editor) return;
        isMinimap = !isMinimap;
        editor.updateOptions({ minimap: { enabled: isMinimap } });
        if (minimapBtn) {
            minimapBtn.classList.toggle('text-sky-400', isMinimap);
            minimapBtn.classList.toggle('text-zinc-400', !isMinimap);
            minimapBtn.textContent = isMinimap ? 'Map: On' : 'Map: Off';
        }
    }

    editor.onDidChangeCursorPosition(updateCursorPosition);

    eventBus.on('tab:activated', (tab) => {
        updateCursorPosition();
        if (langEl && tab && tab.model) {
            langEl.textContent = tab.model.getLanguageId().toUpperCase();
        }
    });

    if (wordWrapBtn) wordWrapBtn.addEventListener('click', toggleWordWrap);
    if (minimapBtn) minimapBtn.addEventListener('click', toggleMinimap);

    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyZ, toggleWordWrap);
    window.addEventListener('keydown', (e) => {
        if (e.altKey && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            toggleWordWrap();
        }
    });

    updateCursorPosition();
}

