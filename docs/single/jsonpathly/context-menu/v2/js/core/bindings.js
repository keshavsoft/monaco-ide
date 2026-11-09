function getContainer(c) {
    if (typeof c === 'string') return document.querySelector(c);
    return c || document.body;
}
export function bindEvents(containerOrId, bindings = [], actions = {}) {
    const container = getContainer(containerOrId);
    if (!container || !Array.isArray(bindings) || bindings.length === 0) return null;
    const eventGroups = new Map();
    for (const b of bindings) {
        if (!b.event || !b.selector || !b.action) continue;
        if (!eventGroups.has(b.event)) eventGroups.set(b.event, []);
        eventGroups.get(b.event).push(b);
    }
    for (const [evt, evBindings] of eventGroups.entries()) {
        container.addEventListener(evt, (e) => {
            for (const b of evBindings) {
                const matchEl = e.target?.closest?.(b.selector);
                if (!matchEl || !container.contains(matchEl)) continue;
                const fn = actions[b.action];
                if (typeof fn === 'function') fn(e, matchEl);
            }
        });
    }
    return container;
}
export default bindEvents;

