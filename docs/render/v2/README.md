# Monaco IDE Render V1 — Tab 1 to Tab 2 JSON-to-DOM Live Renderer

Monaco IDE Render V1 connects the Monaco code editor (Tab 1) directly to a standalone preview tab (Tab 2) via `BroadcastChannel` and `localStorage`, compiling declarative JSON specifications into native DOM elements via `@keshavsoft/json-to-dom` (v42).

---

### Core Concept & Workflow

1. **Tab 1: Monaco Editor (`docs/render/v1/index.html`)**:
   - Single-file editor buffer (defaulting to `sample.json`).
   - Click the **Render** button (or press `Ctrl+Enter`):
     - Opens Tab 2 (`render.html`) in a dedicated browser tab.
     - Persists content to `localStorage` for instant load.
     - Broadcasts real-time live updates over `BroadcastChannel('keshavsoft-render-v1')`.
     - Displays `Tab 2 Live` status pill in the header.

2. **Tab 2: Standalone Live Renderer (`docs/render/v1/render.html`)**:
   - Bundles `@keshavsoft/json-to-dom` v42 (`./js/lib/json-to-dom.min.js`).
   - Connects to `BroadcastChannel('keshavsoft-render-v1')` and `localStorage`.
   - On receiving JSON:
     - Converts declarative JSON into live browser DOM nodes via `jsonToDom({ jsonSpec, targetHtmlId: 'app' })`.
     - Mounts directly into `#app` with zero Virtual DOM overhead.
   - On receiving HTML:
     - Renders native HTML into `#app`.
   - On syntax errors:
     - Displays a clear error banner without crashing the preview tab.

3. **Live Sync**:
   - As you type in Monaco in Tab 1, changes stream automatically to Tab 2 (debounced by 150ms).
   - Tab 2 re-compiles and mutates the DOM in real-time.

---

### Folder Structure

```
docs/render/v1/
├── index.html                  # Tab 1: Monaco Editor interface
├── render.html                 # Tab 2: JSON-to-DOM standalone renderer
├── sample.json                 # Sample declarative JSON specification
├── style.css                   # Editor styles
├── README.md                   # Architecture documentation
└── js/
    ├── index.js                # Tab 1 bootstrapper
    ├── lib/
    │   └── json-to-dom.min.js  # KeshavSoft JSON-to-DOM engine (v42)
    ├── core/
    │   ├── bindings.js         # KeshavSoft dom-primitive-bindings
    │   ├── eventBus.js         # Reactive event bus
    │   └── state.js            # State store
    └── modules/
        ├── header/             # Header bindings & Render button action
        ├── tabs/               # Single-file buffer manager & disk save (Ctrl+S)
        ├── preview/            # Tab 1 -> Tab 2 BroadcastChannel controller
        └── statusBar/          # Status bar controls
```
