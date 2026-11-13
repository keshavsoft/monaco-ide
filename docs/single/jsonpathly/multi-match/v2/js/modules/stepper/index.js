import { bindEvents } from '../../core/bindings.js';
import { eventBus } from '../../core/eventBus.js';
import bindings from './bindings.json' with { type: 'json' };
import actions from './actions.js';

export function initStepper() {
    const stepperContainer = document.getElementById('stepperContainer');
    if (stepperContainer) bindEvents(stepperContainer, bindings, actions);

    eventBus.on('jsonpath:matches', ({ matches, paths }) => {
        actions.setMatches(matches, paths);
    });

    // Keyboard shortcuts F3 (next) and Shift+F3 (prev)
    window.addEventListener('keydown', (e) => {
        if (e.key === 'F3') {
            e.preventDefault();
            if (e.shiftKey) actions.stepPrev();
            else actions.stepNext();
        }
    });
}

export default initStepper;

