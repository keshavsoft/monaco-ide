/**
 * Monaco IDE V9 - Studio Status Bar Module
 * Powered by declarative dom-primitive-bindings.
 */

import { bindEvents } from '../../core/bindings.js';
import { eventBus } from '../../core/eventBus.js';
import { state } from '../../core/state.js';
import bindings from './bindings.json' with { type: 'json' };
import actions from './actions.js';

let isWordWrap = false;
let isMinimap = false;

export function toggleWordWrap() {
    isWordWrap = !isWordWrap;
    if (state.sourceEditor) {
        state.sourceEditor.updateOptions({ wordWrap: isWordWrap ? 'on' : 'off' });
    }
    if (state.resultEditor) {
        state.resultEditor.updateOptions({ wordWrap: isWordWrap ? 'on' : 'off' });
    }

    const btn = document.getElementById('toggleWordWrapBtn');
    if (btn) {
        btn.classList.toggle('text-sky-400', isWordWrap);
        btn.classList.toggle('text-zinc-400', !isWordWrap);
        btn.textContent = isWordWrap ? 'Wrap: On' : 'Wrap: Off';
    }
}

export function toggleMinimap() {
    if (!state.editor) return;
    isMinimap = !isMinimap;
    state.editor.updateOptions({ minimap: { enabled: isMinimap } });

    const btn = document.getElementById('toggleMinimapBtn');
    if (btn) {
        btn.classList.toggle('text-sky-400', isMinimap);
        btn.classList.toggle('text-zinc-400', !isMinimap);
        btn.textContent = isMinimap ? 'Map: On' : 'Map: Off';
    }
}

function updateCursorPosition() {
    if (!state.editor) return;
    const lnColEl = document.getElementById('cursorPos');
    const pos = state.editor.getPosition();
    if (pos && lnColEl) {
        lnColEl.textContent = `Ln ${pos.lineNumber}, Col ${pos.column}`;
    }
}

export function initStatusBar() {
    const footerEl = document.querySelector('footer');
    if (footerEl) {
        bindEvents(footerEl, bindings, actions);
    }

    if (state.editor) {
        state.editor.onDidChangeCursorPosition(updateCursorPosition);
        if (state.monaco) {
            state.editor.addCommand(state.monaco.KeyMod.Alt | state.monaco.KeyCode.KeyZ, toggleWordWrap);
        }
    }

    eventBus.on('tab:activated', (tab) => {
        updateCursorPosition();
        const langEl = document.getElementById('statusLanguage');
        if (langEl && tab && tab.model) {
            langEl.textContent = tab.model.getLanguageId().toUpperCase();
        }
    });

    window.addEventListener('keydown', (e) => {
        if (e.altKey && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            toggleWordWrap();
        }
    });

    updateCursorPosition();
}

export default initStatusBar;

