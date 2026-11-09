import { state } from '../../core/state.js';

export const actions = {
    highlightPathInSource: (rawPath) => {
        if (!state.sourceEditor || !state.monaco) return;
        const model = state.sourceEditor.getModel();
        if (!model) return;

        const segments = String(rawPath).replace(/^\$\.?/, '').split('.').map(s => s.replace(/\[\d+\]/, '').trim()).filter(Boolean);
        const targetKey = segments[segments.length - 1];
        if (!targetKey) return;

        const searchStr = `"${targetKey}"`;
        const matches = model.findMatches(searchStr, true, false, true, null, true);
        if (matches && matches.length > 0) {
            const firstMatch = matches[0];
            const targetLine = firstMatch.range.startLineNumber;

            state.currentDecorations = state.sourceEditor.deltaDecorations(state.currentDecorations, [
                {
                    range: new state.monaco.Range(targetLine, 1, targetLine, 100),
                    options: {
                        isWholeLine: true,
                        className: 'highlight-active-match'
                    }
                }
            ]);

            state.sourceEditor.revealLineInCenter(targetLine);
        }
    },

    setupResultClickToLocate: () => {
        if (!state.resultEditor) return;
        state.resultEditor.onMouseDown((e) => {
            if (!e.target?.position) return;
            const line = e.target.position.lineNumber;
            const model = state.resultEditor.getModel();
            if (!model) return;
            const lineContent = model.getLineContent(line);
            const keyMatch = lineContent.match(/"([^"\\]+)"\s*:/);
            if (keyMatch) {
                actions.highlightPathInSource(keyMatch[1]);
            }
        });
    }
};

export default actions;

