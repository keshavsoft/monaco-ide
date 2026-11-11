# Monaco IDE V12 — Clean Studio Architecture

Monaco IDE V12 is a clean, modular version of the IDE featuring an in-browser Virtual Server that controls Tab 2 directly from Tab 1 with zero backend.

---

### Architecture & Modules

```
docs/v12/
├── index.html                  # 42px Compact Studio Shell & Layout
├── sample.json                 # Initial buffer
├── style.css                   # IDE styles
├── workspace-preview-sw.js     # Virtual Server Service Worker (intercepts /virtual-server/*)
└── js/
    ├── index.js                # App bootstrapper
    ├── core/
    │   ├── state.js            # Central State Store (workspace, tabs, activeTabId)
    │   ├── eventBus.js         # Decoupled Event Bus (pub/sub)
    │   └── bindings.js         # Declarative DOM Primitive Bindings engine
    └── modules/
        ├── header/             # Brand, File/Folder buttons, Ctrl+S, Format
        ├── explorer/           # Workspace Directory Tree (showDirectoryPicker)
        ├── tabs/               # Multi-document buffer strip & model isolation
        ├── preview/            # Split Live Preview Pane (Ctrl+\)
        ├── previewTab.js       # Virtual Server bridge (Full Preview in Tab 2)
        ├── statusBar/          # Compact 22px status bar (Ln/Col, UTF-8, Alt+Z Wrap)
        └── quickOpen/          # Fuzzy file search palette (Ctrl+P)
```

---

### How to Run

1. Open your browser to:
   **[http://localhost:3000/docs/v12/](http://localhost:3000/docs/v12/)**
2. Click **Folder** and choose a local folder (e.g. `spec-repo`).
3. Click any HTML file to open it in Monaco.
4. Click **Full Preview** to launch Tab 2.
5. Edits in Tab 1 auto-sync and live-reload Tab 2!

