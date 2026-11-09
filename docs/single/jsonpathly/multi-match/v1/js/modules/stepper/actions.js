import { state } from '../../core/state.js';

export const actions = {
    setMatches: (matches = [], paths = []) => {
        state.matches = matches;
        state.matchedPaths = paths;
        state.currentMatchIndex = 0;

        const container = document.getElementById('stepperContainer');
        if (!container) return;

        if (Array.isArray(matches) && matches.length > 1) {
            container.classList.remove('hidden');
            actions.updateStepperUI();
            actions.syncActiveMatch();
        } else {
            container.classList.add('hidden');
            if (state.sourceEditor && state.currentDecorations) {
                state.currentDecorations = state.sourceEditor.deltaDecorations(state.currentDecorations, []);
            }
        }
    },

    stepNext: () => {
        if (!state.matches || state.matches.length <= 1) return;
        state.currentMatchIndex = (state.currentMatchIndex + 1) % state.matches.length;
        actions.updateStepperUI();
        actions.syncActiveMatch();
    },

    stepPrev: () => {
        if (!state.matches || state.matches.length <= 1) return;
        state.currentMatchIndex = (state.currentMatchIndex - 1 + state.matches.length) % state.matches.length;
        actions.updateStepperUI();
        actions.syncActiveMatch();
    },

    updateStepperUI: () => {
        const label = document.getElementById('stepperLabel');
        if (label && state.matches) {
            label.textContent = `${state.currentMatchIndex + 1} of ${state.matches.length}`;
        }
    },

    syncActiveMatch: () => {
        if (!state.sourceEditor || !state.monaco) return;
        const currentPath = state.matchedPaths?.[state.currentMatchIndex];
        if (!currentPath) return;

        // Find match in source document
        const model = state.sourceEditor.getModel();
        if (!model) return;

        // Path can be e.g. ["$", "rawAst", "program", "body", 0]
        const segments = Array.isArray(currentPath) ? currentPath : String(currentPath).split('.');
        const lastPart = segments[segments.length - 1];

        // Find key or index in source model
        const searchTarget = typeof lastPart === 'number' ? `[` : `"${lastPart}"`;
        const found = model.findMatches(searchTarget, true, false, true, null, true);
        if (found && found.length > 0) {
            const targetLine = found[0].range.startLineNumber;
            state.currentDecorations = state.sourceEditor.deltaDecorations(state.currentDecorations, [
                {
                    range: new state.monaco.Range(targetLine, 1, targetLine, 100),
                    options: {
                        isWholeLine: true,
                        className: 'highlight-stepped-match'
                    }
                }
            ]);
            state.sourceEditor.revealLineInCenter(targetLine);
        }
    }
};

export default actions;

