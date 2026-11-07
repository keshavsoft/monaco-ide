/**
 * Monaco IDE V14 - VS Code Integrated Terminal Module
 * Supports cmd (Command Prompt), powershell (Windows PowerShell), node, and bash.
 * Enables 1-click code execution for .js files with console output interception.
 */

import { bindEvents } from '../../core/bindings.js';
import { eventBus } from '../../core/eventBus.js';
import { state, getActiveTab } from '../../core/state.js';
import bindings from './bindings.json' with { type: 'json' };
import actions from './actions.js';

let isTerminalOpen = false;
let isMaximized = false;
let currentShell = 'cmd';
let activePanelTab = 'terminal';
let savedHeight = 240;

const commandHistory = [];
let historyIndex = -1;

const SHELL_CONFIGS = {
    cmd: {
        id: 'cmd',
        name: 'Command Prompt',
        icon: 'bi-terminal',
        getPrompt: (ws) => `C:\\Users\\SREE\\${ws}> `,
        banner: `Microsoft Windows [Version 10.0.22631.4317]\n(c) Microsoft Corporation. All rights reserved.\n`
    },
    powershell: {
        id: 'powershell',
        name: 'Windows PowerShell',
        icon: 'bi-terminal-fill',
        getPrompt: (ws) => `PS C:\\Users\\SREE\\${ws}> `,
        banner: `Windows PowerShell\nCopyright (C) Microsoft Corporation. All rights reserved.\n\nInstall the latest PowerShell for new features and improvements! https://aka.ms/PSWindows\n`
    },
    node: {
        id: 'node',
        name: 'Node.js REPL',
        icon: 'bi-code-square',
        getPrompt: () => `> `,
        banner: `Welcome to Node.js v20.18.0.\nType ".help" for more information.\n`
    },
    bash: {
        id: 'bash',
        name: 'Git Bash',
        icon: 'bi-terminal',
        getPrompt: (ws) => `user@monaco-ide MINGW64 /d/${ws} $ `,
        banner: `MINGW64 - Git Bash\n`
    }
};

function getWorkspaceName() {
    return (state.workspace && state.workspace.name) ? state.workspace.name : 'monaco-ide';
}

function getCurrentPrompt() {
    const config = SHELL_CONFIGS[currentShell] || SHELL_CONFIGS.cmd;
    return config.getPrompt(getWorkspaceName());
}

function updatePromptUI() {
    const promptEl = document.getElementById('terminalPromptLabel');
    if (promptEl) {
        promptEl.textContent = getCurrentPrompt();
        if (currentShell === 'powershell') {
            promptEl.className = 'text-sky-400 font-semibold shrink-0 select-none';
        } else if (currentShell === 'node') {
            promptEl.className = 'text-emerald-400 font-bold shrink-0 select-none';
        } else if (currentShell === 'bash') {
            promptEl.className = 'text-yellow-400 font-semibold shrink-0 select-none';
        } else {
            promptEl.className = 'text-emerald-400 font-bold shrink-0 select-none';
        }
    }
    const iconEl = document.getElementById('shellIcon');
    if (iconEl && SHELL_CONFIGS[currentShell]) {
        iconEl.className = `bi ${SHELL_CONFIGS[currentShell].icon} text-sky-400 text-xs`;
    }
    const selectEl = document.getElementById('shellSelect');
    if (selectEl && selectEl.value !== currentShell) {
        selectEl.value = currentShell;
    }
}

function scrollToBottom() {
    const body = document.getElementById('terminalBody');
    if (body) {
        body.scrollTop = body.scrollHeight;
    }
}

export function appendOutput(text, type = 'stdout') {
    const outputContainer = document.getElementById('terminalOutput');
    if (!outputContainer) return;

    const line = document.createElement('div');
    if (type === 'cmd') {
        line.className = 'terminal-line-cmd text-zinc-100 font-semibold';
    } else if (type === 'stderr') {
        line.className = 'terminal-line-stderr text-rose-400';
    } else if (type === 'warn') {
        line.className = 'terminal-line-warn text-amber-400';
    } else if (type === 'info') {
        line.className = 'terminal-line-info text-sky-400';
    } else if (type === 'banner') {
        line.className = 'terminal-line-banner text-zinc-400 text-[11px]';
    } else {
        line.className = 'terminal-line-stdout text-zinc-200';
    }
    line.textContent = text;
    outputContainer.appendChild(line);
    scrollToBottom();
}

export function clearTerminal() {
    const outputContainer = document.getElementById('terminalOutput');
    if (outputContainer) {
        outputContainer.innerHTML = '';
    }
    const config = SHELL_CONFIGS[currentShell] || SHELL_CONFIGS.cmd;
    if (config.banner) {
        appendOutput(config.banner, 'banner');
    }
    focusInput();
}

export function openTerminal() {
    const panel = document.getElementById('terminalPanel');
    const resizer = document.getElementById('terminalResizer');
    const toggleBtn = document.getElementById('toggleTerminalBtn');
    if (!panel) return;

    panel.classList.remove('hidden');
    if (resizer) resizer.classList.remove('hidden');
    if (toggleBtn) {
        toggleBtn.classList.add('bg-zinc-700', 'text-sky-300');
    }
    isTerminalOpen = true;

    if (state.editor) {
        setTimeout(() => state.editor.layout(), 50);
    }
    focusInput();
}

export function closeTerminal() {
    const panel = document.getElementById('terminalPanel');
    const resizer = document.getElementById('terminalResizer');
    const toggleBtn = document.getElementById('toggleTerminalBtn');
    if (!panel) return;

    panel.classList.add('hidden');
    if (resizer) resizer.classList.add('hidden');
    if (toggleBtn) {
        toggleBtn.classList.remove('bg-zinc-700', 'text-sky-300');
    }
    isTerminalOpen = false;

    if (state.editor) {
        setTimeout(() => state.editor.layout(), 50);
    }
}

export function toggleTerminal() {
    if (isTerminalOpen) {
        closeTerminal();
    } else {
        openTerminal();
    }
}

export function toggleMaximizeTerminal() {
    const panel = document.getElementById('terminalPanel');
    const icon = document.getElementById('maxTerminalIcon');
    if (!panel) return;

    isMaximized = !isMaximized;
    if (isMaximized) {
        panel.style.height = '75%';
        if (icon) icon.className = 'bi bi-chevron-down text-xs';
    } else {
        panel.style.height = `${savedHeight}px`;
        if (icon) icon.className = 'bi bi-chevron-up text-xs';
    }

    if (state.editor) {
        setTimeout(() => state.editor.layout(), 50);
    }
}

export function switchShell(shellName) {
    if (!SHELL_CONFIGS[shellName]) shellName = 'cmd';
    currentShell = shellName;
    updatePromptUI();
    clearTerminal();
}

export function focusInput() {
    setTimeout(() => {
        const input = document.getElementById('terminalInput');
        if (input && isTerminalOpen) {
            input.focus();
        }
    }, 50);
}

function formatConsoleArg(arg) {
    if (arg === null) return 'null';
    if (arg === undefined) return 'undefined';
    if (typeof arg === 'object') {
        try {
            return JSON.stringify(arg, null, 2);
        } catch {
            return String(arg);
        }
    }
    return String(arg);
}

/**
 * Runs the active document inside the VS Code simulated terminal (cmd shell).
 */
export function runActiveFile() {
    openTerminal();

    // Switch to cmd shell as requested
    if (currentShell !== 'cmd') {
        currentShell = 'cmd';
        updatePromptUI();
    }

    const tab = getActiveTab();
    if (!tab) {
        appendOutput(`${getCurrentPrompt()}node`, 'cmd');
        appendOutput('Error: No active file currently open in editor.', 'stderr');
        focusInput();
        return;
    }

    const fileName = tab.name || 'samp.js';
    const code = (tab.model ? tab.model.getValue() : tab.content) || '';

    // Print command execution line
    appendOutput(`${getCurrentPrompt()}node ${fileName}`, 'cmd');

    // Check if it's a JS file
    const isJS = /\.(js|mjs|cjs|ts)$/i.test(fileName) || tab.language === 'javascript' || tab.language === 'typescript';

    if (!isJS) {
        if (/\.json$/i.test(fileName) || tab.language === 'json') {
            appendOutput(`[eval]:1\n${code.slice(0, 40)}...\n^\n\nSyntaxError: Unexpected token ':' in JSON file ${fileName}.\n(Tip: Open a .js JavaScript file like samp.js to execute in Node.js)`, 'stderr');
        } else if (/\.html$/i.test(fileName) || tab.language === 'html') {
            appendOutput(`[Node.js]: Cannot execute HTML file directly. Use Live Preview (Ctrl+\\) or Full Preview to view web pages.`, 'warn');
        } else {
            appendOutput(`[Node.js]: Execution of "${fileName}" skipped. Please select a .js file to run.`, 'info');
        }
        focusInput();
        return;
    }

    // Execute JavaScript with captured console
    const capturedLogs = [];
    const mockConsole = {
        log: (...args) => capturedLogs.push({ type: 'stdout', text: args.map(formatConsoleArg).join(' ') }),
        info: (...args) => capturedLogs.push({ type: 'info', text: args.map(formatConsoleArg).join(' ') }),
        warn: (...args) => capturedLogs.push({ type: 'warn', text: args.map(formatConsoleArg).join(' ') }),
        error: (...args) => capturedLogs.push({ type: 'stderr', text: args.map(formatConsoleArg).join(' ') }),
        table: (d) => capturedLogs.push({ type: 'stdout', text: typeof d === 'object' ? JSON.stringify(d, null, 2) : String(d) }),
        clear: () => clearTerminal()
    };

    const mockProcess = {
        version: 'v20.18.0',
        platform: 'win32',
        cwd: () => `C:\\Users\\SREE\\${getWorkspaceName()}`,
        env: { NODE_ENV: 'development' }
    };

    try {
        const executor = new Function('console', 'process', code);
        executor(mockConsole, mockProcess);

        if (capturedLogs.length === 0) {
            appendOutput(`[Process exited 0 with no console output]`, 'info');
        } else {
            for (const log of capturedLogs) {
                appendOutput(log.text, log.type);
            }
        }
    } catch (err) {
        appendOutput(`${err.name}: ${err.message}`, 'stderr');
        if (err.stack) {
            const stackLines = err.stack.split('\n').slice(1, 4).join('\n');
            if (stackLines) appendOutput(stackLines, 'stderr');
        }
    }

    focusInput();
}

/**
 * Handles terminal command submission
 */
function handleCommandSubmit(commandText) {
    const raw = commandText.trim();
    if (!raw) {
        appendOutput(getCurrentPrompt(), 'cmd');
        return;
    }

    commandHistory.push(raw);
    historyIndex = commandHistory.length;

    // Echo input
    appendOutput(`${getCurrentPrompt()}${raw}`, 'cmd');

    const [cmd, ...args] = raw.split(/\s+/);
    const cmdLower = cmd.toLowerCase();

    if (cmdLower === 'cls' || cmdLower === 'clear') {
        clearTerminal();
        return;
    }

    if (cmdLower === 'ver') {
        appendOutput('Microsoft Windows [Version 10.0.22631.4317]', 'stdout');
        return;
    }

    if (cmdLower === 'exit') {
        closeTerminal();
        return;
    }

    if (cmdLower === 'node') {
        if (args.length === 0) {
            switchShell('node');
            return;
        }
        if (args[0] === '-v' || args[0] === '--version') {
            appendOutput('v20.18.0', 'stdout');
            return;
        }
        // Run specific file, e.g. "node samp.js"
        const targetName = args[0].replace(/^["']|["']$/g, '');
        const foundTab = state.tabs.find(t => t.name.toLowerCase() === targetName.toLowerCase() || t.path?.toLowerCase().endsWith(targetName.toLowerCase()));
        if (foundTab) {
            const code = (foundTab.model ? foundTab.model.getValue() : foundTab.content) || '';
            try {
                const logs = [];
                const mockCon = {
                    log: (...a) => logs.push({ type: 'stdout', text: a.map(formatConsoleArg).join(' ') }),
                    error: (...a) => logs.push({ type: 'stderr', text: a.map(formatConsoleArg).join(' ') }),
                    warn: (...a) => logs.push({ type: 'warn', text: a.map(formatConsoleArg).join(' ') })
                };
                new Function('console', code)(mockCon);
                logs.forEach(l => appendOutput(l.text, l.type));
            } catch (e) {
                appendOutput(`${e.name}: ${e.message}`, 'stderr');
            }
        } else {
            appendOutput(`Error: Cannot find module '${targetName}'\n    at Function.Module._resolveFilename (internal/modules/cjs/loader.js:889:15)`, 'stderr');
        }
        return;
    }

    if (cmdLower === 'npm') {
        if (args[0] === '-v' || args[0] === '--version') {
            appendOutput('10.8.2', 'stdout');
        } else {
            appendOutput(`npm ${args.join(' ')}: executed in virtual environment.`, 'info');
        }
        return;
    }

    if (cmdLower === 'dir' || cmdLower === 'ls') {
        appendOutput(` Volume in drive C has no label.\n Directory of C:\\Users\\SREE\\${getWorkspaceName()}\n`, 'stdout');
        appendOutput(`11/07/2026  04:40 PM    <DIR>          .`, 'stdout');
        appendOutput(`11/07/2026  04:40 PM    <DIR>          ..`, 'stdout');
        for (const t of state.tabs) {
            const size = (t.content ? t.content.length : 0).toLocaleString();
            appendOutput(`11/07/2026  04:45 PM    ${size.padStart(12)} ${t.name}`, 'stdout');
        }
        return;
    }

    if (cmdLower === 'echo') {
        appendOutput(args.join(' '), 'stdout');
        return;
    }

    if (cmdLower === 'help') {
        appendOutput(`Available Terminal Commands:`, 'info');
        appendOutput(`  node <file.js>   Execute JavaScript file (like VS Code)`, 'stdout');
        appendOutput(`  node -v          Show Node.js version`, 'stdout');
        appendOutput(`  dir / ls         List workspace files`, 'stdout');
        appendOutput(`  cls / clear      Clear terminal screen`, 'stdout');
        appendOutput(`  echo <msg>       Print message to console`, 'stdout');
        appendOutput(`  ver              Display OS version`, 'stdout');
        appendOutput(`  exit             Close the terminal panel`, 'stdout');
        appendOutput(`  <expression>     Evaluate JavaScript expression (e.g. 2 + 2)`, 'stdout');
        return;
    }

    // Try evaluating as JavaScript expression if in node shell or direct expression
    try {
        const result = (new Function(`return (${raw});`))();
        if (result !== undefined) {
            appendOutput(formatConsoleArg(result), 'stdout');
        }
    } catch {
        if (currentShell === 'powershell') {
            appendOutput(`${cmd} : The term '${cmd}' is not recognized as the name of a cmdlet, function, script file, or operable program.\nAt line:1 char:1\n+ ${raw}\n+ ~~~~~\n    + CategoryInfo          : ObjectNotFound: (${cmd}:String) [], CommandNotFoundException\n    + FullyQualifiedErrorId : CommandNotFoundException`, 'stderr');
        } else {
            appendOutput(`'${cmd}' is not recognized as an internal or external command,\noperable program or batch file. Type "help" for available commands.`, 'stderr');
        }
    }
}

function initInputHandlers() {
    const input = document.getElementById('terminalInput');
    const body = document.getElementById('terminalBody');

    if (body) {
        body.addEventListener('click', () => {
            if (input) input.focus();
        });
    }

    if (input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const val = input.value;
                input.value = '';
                handleCommandSubmit(val);
                scrollToBottom();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (commandHistory.length > 0) {
                    if (historyIndex > 0) {
                        historyIndex--;
                        input.value = commandHistory[historyIndex] || '';
                    } else if (historyIndex === 0) {
                        input.value = commandHistory[0] || '';
                    }
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (historyIndex < commandHistory.length - 1) {
                    historyIndex++;
                    input.value = commandHistory[historyIndex] || '';
                } else {
                    historyIndex = commandHistory.length;
                    input.value = '';
                }
            }
        });
    }

    // Resizer implementation
    const resizer = document.getElementById('terminalResizer');
    const panel = document.getElementById('terminalPanel');
    if (resizer && panel) {
        let isResizing = false;
        let startY = 0;
        let startHeight = 0;

        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            startY = e.clientY;
            startHeight = panel.getBoundingClientRect().height;
            document.body.style.cursor = 'row-resize';
            document.body.style.userSelect = 'none';
        });

        window.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const dy = startY - e.clientY;
            const newHeight = Math.max(100, Math.min(window.innerHeight - 150, startHeight + dy));
            panel.style.height = `${newHeight}px`;
            savedHeight = newHeight;
            if (state.editor) {
                state.editor.layout();
            }
        });

        window.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                if (state.editor) {
                    state.editor.layout();
                }
            }
        });
    }

    // Global keyboard shortcuts: Ctrl+` (toggle terminal), F5 (Run active file)
    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === '`') {
            e.preventDefault();
            toggleTerminal();
        } else if (e.key === 'F5') {
            e.preventDefault();
            runActiveFile();
        }
    });
}

function selectPanelTab(tabName) {
    activePanelTab = tabName;
    const tabs = ['terminal', 'output', 'problems', 'debug'];
    tabs.forEach(t => {
        const btn = document.getElementById(`terminalTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
        if (btn) {
            if (t === tabName) {
                btn.className = 'text-[11px] font-semibold text-white uppercase tracking-wider flex items-center gap-1.5 h-full border-b-2 border-sky-400';
            } else {
                btn.className = 'text-[11px] font-medium text-zinc-400 hover:text-zinc-200 uppercase tracking-wider h-full border-b-2 border-transparent';
            }
        }
    });

    if (tabName !== 'terminal') {
        clearTerminal();
        appendOutput(`[${tabName.toUpperCase()}]: No diagnostic issues or logs found.`, 'info');
    } else {
        clearTerminal();
    }
}

export function initTerminal() {
    const panelEl = document.getElementById('terminalPanel');
    if (panelEl) {
        bindEvents(panelEl, bindings, actions);
    }

    // Register eventBus listeners
    eventBus.on('terminal:toggle', toggleTerminal);
    eventBus.on('terminal:open', openTerminal);
    eventBus.on('terminal:close', closeTerminal);
    eventBus.on('terminal:clear', clearTerminal);
    eventBus.on('terminal:toggleMaximize', toggleMaximizeTerminal);
    eventBus.on('terminal:new', () => {
        clearTerminal();
        appendOutput(`Started new ${currentShell} terminal session.`, 'info');
    });
    eventBus.on('terminal:switchShell', (shell) => switchShell(shell));
    eventBus.on('terminal:runActiveFile', runActiveFile);
    eventBus.on('terminal:selectTab', (tab) => selectPanelTab(tab));

    updatePromptUI();
    clearTerminal();
    initInputHandlers();
}

export default initTerminal;

