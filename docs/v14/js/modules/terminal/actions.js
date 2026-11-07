import { eventBus } from '../../core/eventBus.js';

export const actions = {
    clearTerminal: () => {
        eventBus.emit('terminal:clear');
    },
    closeTerminal: () => {
        eventBus.emit('terminal:close');
    },
    toggleMaximizeTerminal: () => {
        eventBus.emit('terminal:toggleMaximize');
    },
    newTerminal: () => {
        eventBus.emit('terminal:new');
    },
    switchShell: (e) => {
        const shell = e && e.target ? e.target.value : 'cmd';
        eventBus.emit('terminal:switchShell', shell);
    },
    selectTerminalTab: () => {
        eventBus.emit('terminal:selectTab', 'terminal');
    },
    selectOutputTab: () => {
        eventBus.emit('terminal:selectTab', 'output');
    },
    selectProblemsTab: () => {
        eventBus.emit('terminal:selectTab', 'problems');
    },
    selectDebugTab: () => {
        eventBus.emit('terminal:selectTab', 'debug');
    }
};

export default actions;

