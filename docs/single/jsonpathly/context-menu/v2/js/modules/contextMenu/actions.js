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
            label: '⚡ Inspect Node (Extract to Right Editor) (Alt+I)',
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

        console.log('[Context Menu Module V2] Attached "Inspect Node" to Left Editor.');
    },

    inspectAtLine: (lineNumber) => {
        if (!state.sourceEditor) return;
        const text = state.sourceEditor.getValue();
        const path = resolveJsonPathAtLine(text, lineNumber);

        state.inspectedPath = path;

        // Render Active Node Path Pill in Header
        actions.renderActivePathPill(path);

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
    },

    renderActivePathPill: (path) => {
        const container = document.getElementById('activePathContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="inline-flex items-center gap-2 bg-zinc-950/90 border border-amber-500/70 text-amber-300 font-mono text-xs px-3 py-1 rounded-md shadow-md node-pill-glow transition">
                <i class="bi bi-bullseye text-amber-400 animate-pulse text-xs"></i>
                <span class="text-zinc-400 text-[10px] uppercase font-semibold tracking-wider">Node:</span>
                <span id="activePathText" class="text-amber-200 font-bold select-all">${path}</span>
                <button id="btnCopyPath" type="button" title="Copy JSONPath (Click)" class="text-zinc-400 hover:text-white transition ml-1 cursor-pointer">
                    <i class="bi bi-clipboard text-xs"></i>
                </button>
            </div>
        `;

        const btnCopy = document.getElementById('btnCopyPath');
        if (btnCopy) {
            btnCopy.addEventListener('click', (e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(path).then(() => {
                    const icon = btnCopy.querySelector('i');
                    if (icon) {
                        icon.className = 'bi bi-check text-emerald-400 text-xs font-bold';
                        setTimeout(() => {
                            icon.className = 'bi bi-clipboard text-xs';
                        }, 1500);
                    }
                });
            });
        }
    }
};

export default actions;

