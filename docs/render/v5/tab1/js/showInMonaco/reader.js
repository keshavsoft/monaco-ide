import actions from './actions.js';
import bindings from './bindings.json' with { type: 'json' };

function bindEvents(container, bindingList = [], actionMap = {}) {
  const grouped = new Map();

  for (const binding of bindingList) {
    if (!binding.event || !binding.selector || !binding.action) continue;
    if (!grouped.has(binding.event)) grouped.set(binding.event, []);
    grouped.get(binding.event).push(binding);
  }

  for (const [eventName, group] of grouped.entries()) {
    container.addEventListener(eventName, (event) => {
      for (const binding of group) {
        const matched = event.target?.closest?.(binding.selector);
        if (!matched || !container.contains(matched)) continue;
        const action = actionMap[binding.action];
        if (typeof action === 'function') action(event, matched);
      }
    });
  }
}

export function initBindings(container = document.body) {
  bindEvents(container, bindings, actions);
  return container;
}

export default initBindings;

