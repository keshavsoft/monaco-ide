/**
 * Monaco IDE Single - jsonpathly Module
 * Executes RFC 9535 JSONPath expressions against state.sourceEditor
 * and updates state.resultEditor (Right Monaco instance).
 */

import { bindEvents } from '../../core/bindings.js';
import { eventBus } from '../../core/eventBus.js';
import { state } from '../../core/state.js';
import bindings from './bindings.json' with { type: 'json' };
import actions from './actions.js';

// Native browser-ready ESM import of RFC 9535 jsonpathly
import { query, paths } from 'https://esm.sh/jsonpathly';

let latestResults = {
    values: [],
    paths: [],
    expr: '',
    duration: 0,
    flavour: 'tree' // 'tree' | 'paths'
};

export function initJsonPath() {
    const toolbar = document.getElementById('jsonPathToolbar');
    const headerRight = document.getElementById('resultEditorHeader');

    if (toolbar) {
        bindEvents(toolbar, bindings, actions);
    }
    if (headerRight) {
        bindEvents(headerRight, bindings, actions);
    }

    // Wire event bus listeners
    eventBus.on('jsonpath:execute', executeQuery);
    eventBus.on('jsonpath:clear', handleClear);
    eventBus.on('jsonpath:copy', copyOutput);
    eventBus.on('jsonpath:setFlavour', setFlavour);
    eventBus.on('file:loaded', () => {
        const input = document.getElementById('jsonPathQueryInput');
        if (input && input.value.trim()) {
            executeQuery();
        }
    });

    console.log('[jsonpathly Module] Initialized and wired to dual Monaco editors.');
}

function executeQuery() {
    const input = document.getElementById('jsonPathQueryInput');
    const statsEl = document.getElementById('resultEditorStats');
    const toolbarStats = document.getElementById('searchStatsBadge');

    if (!input) return;
    const expr = input.value.trim();

    if (!expr) {
        if (state.resultEditor) {
            state.resultEditor.setValue('[\n  // Please enter a JSONPath expression above (e.g. $.rawAst.program.body[*] or $..type)\n]\n');
        }
        if (statsEl) statsEl.textContent = 'No query';
        if (toolbarStats) toolbarStats.textContent = 'No query';
        return;
    }

    if (!state.sourceEditor) {
        console.warn('[jsonpathly] Source editor not ready.');
        return;
    }

    const rawSource = state.sourceEditor.getValue();
    let parsedData = null;

    try {
        parsedData = JSON.parse(rawSource);
    } catch (parseErr) {
        if (state.resultEditor) {
            state.resultEditor.setValue(`/* JSON Syntax Error in Source Document:\n   ${parseErr.message}\n*/\n`);
        }
        if (statsEl) statsEl.textContent = 'Invalid Source JSON';
        if (toolbarStats) toolbarStats.textContent = 'Invalid Source JSON';
        return;
    }

    try {
        const t0 = performance.now();

        // Execute RFC 9535 JSONPath query & paths extraction
        const matchedValues = query(parsedData, expr);
        let matchedPaths = [];
        try {
            matchedPaths = paths(parsedData, expr);
        } catch {
            matchedPaths = [];
        }

        const duration = (performance.now() - t0).toFixed(1);

        latestResults = {
            values: matchedValues,
            paths: matchedPaths,
            expr,
            duration,
            flavour: latestResults.flavour || 'tree'
        };

        // Render current flavour into Right Monaco Editor
        renderOutputIntoResultEditor();

        // Update stats
        const count = matchedValues.length;
        const msg = `${count} ${count === 1 ? 'match' : 'matches'} (${duration}ms)`;
        if (statsEl) statsEl.textContent = msg;
        if (toolbarStats) toolbarStats.textContent = msg;

    } catch (queryErr) {
        if (state.resultEditor) {
            state.resultEditor.setValue(`/* JSONPath Evaluation Error:\n   ${queryErr.message}\n   Ensure the expression complies with RFC 9535 (e.g. $.rawAst.program.body[*] or $..type)\n*/\n`);
        }
        if (statsEl) statsEl.textContent = 'Query Error';
        if (toolbarStats) toolbarStats.textContent = 'Query Error';
    }
}

function renderOutputIntoResultEditor() {
    if (!state.resultEditor) return;

    if (latestResults.values.length === 0 && latestResults.expr) {
        state.resultEditor.setValue(`// Zero matches found for: ${latestResults.expr}\n[]\n`);
        return;
    }

    let outputString = '';
    if (latestResults.flavour === 'paths') {
        outputString = JSON.stringify(latestResults.paths, null, 2) + '\n';
    } else {
        outputString = JSON.stringify(latestResults.values, null, 2) + '\n';
    }

    state.resultEditor.setValue(outputString);
}

function setFlavour(flavour) {
    latestResults.flavour = flavour;

    // Toggle active styles on buttons
    const treeBtn = document.getElementById('flavourTreeBtn');
    const pathsBtn = document.getElementById('flavourPathsBtn');

    if (flavour === 'paths') {
        pathsBtn?.classList.add('bg-zinc-800', 'text-sky-300', 'font-bold');
        pathsBtn?.classList.remove('text-zinc-500');
        treeBtn?.classList.remove('bg-zinc-800', 'text-sky-300', 'font-bold');
        treeBtn?.classList.add('text-zinc-500');
    } else {
        treeBtn?.classList.add('bg-zinc-800', 'text-sky-300', 'font-bold');
        treeBtn?.classList.remove('text-zinc-500');
        pathsBtn?.classList.remove('bg-zinc-800', 'text-sky-300', 'font-bold');
        pathsBtn?.classList.add('text-zinc-500');
    }

    renderOutputIntoResultEditor();
}

function handleClear() {
    latestResults = { values: [], paths: [], expr: '', duration: 0, flavour: 'tree' };
    if (state.resultEditor) {
        state.resultEditor.setValue('[\n  // Cleared. Enter a query above to inspect output.\n]\n');
    }
    const statsEl = document.getElementById('resultEditorStats');
    const toolbarStats = document.getElementById('searchStatsBadge');
    if (statsEl) statsEl.textContent = '0 matches';
    if (toolbarStats) toolbarStats.textContent = 'Ready';
}

async function copyOutput() {
    if (!state.resultEditor) return;
    const content = state.resultEditor.getValue();
    if (!content) return;

    try {
        await navigator.clipboard.writeText(content);
        const copyBtn = document.getElementById('copyResultBtn');
        if (copyBtn) {
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="bi bi-check2 text-emerald-400"></i><span class="text-emerald-400">Copied!</span>';
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
            }, 1500);
        }
    } catch (err) {
        console.warn('Clipboard copy failed:', err);
    }
}

export default initJsonPath;
