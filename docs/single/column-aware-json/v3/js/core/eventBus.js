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
    const group = this.listeners.get(name);
    if (!group) return;
    group.delete(callback);
    if (!group.size) this.listeners.delete(name);
  }

  emit(name, payload) {
    for (const callback of this.listeners.get(name) || []) {
      try { callback(payload); }
      catch (error) { console.error(`[eventBus:${name}]`, error); }
    }
  }
}

export const eventBus = new EventBus();
