import { state } from '../../core/state.js';
import { eventBus } from '../../core/eventBus.js';
import { resolveJsonPathAtLine } from './pathResolver.js';

let currentDecorations = [];

export const actions = {
    attachContextMenu: () => {
        if (!state.sourceEditor || !state.monaco) return;

        // 1. Right-Click Context Menu Action in Monaco Editor
        state.sourceEditor.addAction({
            id: 'inspect-node-jsonpath',
            label: '⚡ Inspect Node with JSONPath (Alt+I)',
            keybindings: [
                state.monaco.KeyMod.Alt | state.monaco.KeyCode.KeyI
            ],
            contextMenuGroupId: 'navigation',
            contextMenuOrder: 1.0,
            run: (ed) => {
                const pos = ed.getPosition();
                if (!pos) return;
                actions.inspectAtLine(pos.lineNumber);
            }
        });

        // 2. Alt + Click Shortcut directly on text in Left Editor
        state.sourceEditor.onMouseDown((e) => {
            if (e.event.altKey && e.target?.position) {
                e.event.preventDefault();
                actions.inspectAtLine(e.target.position.lineNumber);
            }
        });

        console.log('[Context Menu Module] Attached "Inspect Node with JSONPath" to Left Editor.');
    },

    inspectAtLine: (lineNumber) => {
        if (!state.sourceEditor) return;
        const text = state.sourceEditor.getValue();
        const path = resolveJsonPathAtLine(text, lineNumber);

        // Populate search input
        const input = document.getElementById('txtQuery');
        if (input) {
            input.value = path;
        }

        // Highlight the inspected line in Left Editor
        currentDecorations = state.sourceEditor.deltaDecorations(currentDecorations, [
            {
                range: new state.monaco.Range(lineNumber, 1, lineNumber, 100),
                options: {
                    isWholeLine: true,
                    className: 'highlight-inspected-node'
                }
            }
        ]);

        // Execute query on Right Editor
        eventBus.emit('jsonpath:execute', path);
    }
};

export default actions;

