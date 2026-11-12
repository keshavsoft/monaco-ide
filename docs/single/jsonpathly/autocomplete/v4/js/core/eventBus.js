class EventBus {
    constructor() { this.listeners = new Map(); }
    on(event, handler) {
        if (!this.listeners.has(event)) this.listeners.set(event, new Set());
        this.listeners.get(event).add(handler);
        return () => this.off(event, handler);
    }
    off(event, handler) {
        const set = this.listeners.get(event);
        if (set) { set.delete(handler); if (set.size === 0) this.listeners.delete(event); }
    }
    emit(event, payload) {
        const set = this.listeners.get(event);
        if (set) { for (const handler of set) { try { handler(payload); } catch (e) { console.error(e); } } }
    }
}
export const eventBus = new EventBus();
export default eventBus;

