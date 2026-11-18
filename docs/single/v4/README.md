# Monaco IDE Single V4 — Streamlined Single File Studio & Broadcast Supplier

Monaco IDE Single V4 is an ultra-lean, distraction-free code editor designed for crafting and editing single files or JSON specifications with instant live synchronization across browser tabs.

---

### Highlights in V4

* **Ultra-Compact 42px Header**: Maximum vertical screen space allocated to the Monaco Editor.
* **Pure Single File Canvas**: Edits a single model in memory without tab strip confusion.
* **Instant Native File Open (`Ctrl+O`)**: Opens local files from disk with automatic active file indicator (`#fileName`).
* **Multi-Tab Live Broadcast Synchronization**:
  * Emits changes in real time or via keyboard shortcut (`Ctrl+Enter` / `Cmd+Enter`) across browser tabs using native `BroadcastChannel`.
  * Downstream renderer (Tab 2) live sync indicator (`#tab2SyncStatus`) confirms live connection.
* **Declarative DOM Primitive Bindings**:
  * Event wiring driven entirely by `bindings.json` and decoupled pure domain `actions.js`.

---

### Architecture & Active Modules

```
docs/single/v4/
├── index.html                  # 42px compact header single-file layout
├── style.css                   # Tailored Tailwind CSS stylesheet
├── README.md                   # Documentation
├── data/
│   └── output.json             # Default output specification
└── js/
    ├── index.js                # Bootstrap & Monaco initialization
    ├── state.js                # State model & BroadcastChannel supplier
    └── showInMonaco/
        ├── bindings.json       # Declarative DOM event bindings
        ├── actions.js          # Pure action handlers
        └── reader.js           # Declarative binding initializer
```
