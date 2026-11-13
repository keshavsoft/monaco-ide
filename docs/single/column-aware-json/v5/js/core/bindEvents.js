export function bindEvents(containerOrSelector, bindings = [], actions = {}) {
  const container = typeof containerOrSelector === 'string' ? document.querySelector(containerOrSelector) : containerOrSelector;
  if (!container || !Array.isArray(bindings)) return null;
  const groups = new Map();
  for (const binding of bindings) {
    if (!binding.event || !binding.selector || !binding.action) continue;
    if (!groups.has(binding.event)) groups.set(binding.event, []);
    groups.get(binding.event).push(binding);
  }
  for (const [eventName, group] of groups) {
    container.addEventListener(eventName, (event) => {
      for (const binding of group) {
        const element = event.target?.closest?.(binding.selector);
        if (!element || !container.contains(element)) continue;
        const action = actions[binding.action];
        if (typeof action === 'function') action(event, element);
      }
    });
  }
  return container;
}
