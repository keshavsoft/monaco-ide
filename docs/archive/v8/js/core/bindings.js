/**
 * Monaco IDE V8 - Declarative DOM Primitive Bindings Core Engine
 * Powered by KeshavSoft dom-primitive-bindings (v5).
 * Connects declarative bindings.json to pure action functions.
 */

function getContainer(containerOrId) {
    if (typeof containerOrId === 'string') {
        return document.querySelector(containerOrId);
    }
    return containerOrId || document.body;
}

export function bindEvents(containerOrId, bindings = [], actions = {}) {
    const container = getContainer(containerOrId);
    if (!container || !Array.isArray(bindings) || bindings.length === 0) return null;

    // Group bindings by event type
    const eventGroups = new Map();
    for (const binding of bindings) {
        if (!binding.event || !binding.selector || !binding.action) continue;
        if (!eventGroups.has(binding.event)) {
            eventGroups.set(binding.event, []);
        }
        eventGroups.get(binding.event).push(binding);
    }

    // Attach delegated listener per event type
    for (const [eventType, eventBindings] of eventGroups.entries()) {
        container.addEventListener(eventType, (event) => {
            for (const binding of eventBindings) {
                const matchElement = event.target?.closest?.(binding.selector);
                if (!matchElement || !container.contains(matchElement)) {
                    continue;
                }

                const actionFn = actions[binding.action];
                if (typeof actionFn === 'function') {
                    actionFn(event, matchElement);
                } else {
                    console.warn(`[DOM Bindings] Action "${binding.action}" not found in actions dictionary.`);
                }
            }
        });
    }

    // Register globally under window.ks
    if (typeof globalThis !== 'undefined') {
        globalThis.ks ??= {};
        globalThis.ks.bindEvents ??= bindEvents;
    }

    return container;
}

export default bindEvents;

