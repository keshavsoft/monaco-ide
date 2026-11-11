/**
 * Monaco IDE V4 - Studio Status Bar
 * Displays cursor position, encoding, language mode,
 * and provides toggles for Word Wrap (Alt+Z) and Minimap.
 */

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
        editor.updateOptions({
            wordWrap: isWordWrap ? 'on' : 'off'
        });
        if (wordWrapBtn) {
            wordWrapBtn.classList.toggle('text-sky-400', isWordWrap);
            wordWrapBtn.classList.toggle('text-zinc-400', !isWordWrap);
            wordWrapBtn.textContent = isWordWrap ? 'Wrap: On' : 'Wrap: Off';
        }
    }

    function toggleMinimap() {
        if (!editor) return;
        isMinimap = !isMinimap;
        editor.updateOptions({
            minimap: { enabled: isMinimap }
        });
        if (minimapBtn) {
            minimapBtn.classList.toggle('text-sky-400', isMinimap);
            minimapBtn.classList.toggle('text-zinc-400', !isMinimap);
            minimapBtn.textContent = isMinimap ? 'Map: On' : 'Map: Off';
        }
    }

    // Bind Monaco cursor events
    editor.onDidChangeCursorPosition(updateCursorPosition);
    editor.onDidChangeModel(() => {
        updateCursorPosition();
        if (langEl) {
            const model = editor.getModel();
            if (model) {
                langEl.textContent = model.getLanguageId().toUpperCase();
            }
        }
    });

    // Word Wrap toggle button click & Alt+Z
    if (wordWrapBtn) {
        wordWrapBtn.addEventListener('click', toggleWordWrap);
    }

    // Minimap toggle button click
    if (minimapBtn) {
        minimapBtn.addEventListener('click', toggleMinimap);
    }

    // Alt+Z keyboard shortcut for Word Wrap
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyZ, toggleWordWrap);
    window.addEventListener('keydown', (e) => {
        if (e.altKey && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            toggleWordWrap();
        }
    });

    updateCursorPosition();
}

