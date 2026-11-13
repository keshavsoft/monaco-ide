class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(name, callback) {
    if (!this.listeners.has(name)) this.listeners.set(name, new Set());
    this.listeners.get(name).add(callback);
    return () => this.off(name, callback);
  }

  off(name, callback) {
    const listeners = this.listeners.get(name);
    if (!listeners) return;
    listeners.delete(callback);
    if (listeners.size === 0) this.listeners.delete(name);
  }

  emit(name, payload) {
    for (const callback of this.listeners.get(name) || []) {
      callback(payload);
    }
  }
}

export const eventBus = new EventBus();
