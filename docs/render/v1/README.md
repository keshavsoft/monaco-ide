# Monaco IDE Single V3 — Strict Single File Editor (No Multi-Tabs)

Monaco IDE Single V3 is a pure, distraction-free code editor strictly displaying **one file at any point in time**.

---

### Highlights in V3

* **Zero Multi-Tabs**: The multi-document tab strip (`tabStripContainer`) has been removed.
* **Always One File**: Opening a file immediately replaces the active editor buffer with the chosen file.
* **Direct Disk Persistence (`Ctrl+S`)**:
  * Saves changes directly back to your local file via the native File System Access API (`FileSystemFileHandle.createWritable()`).
* **Active File Status Pill**:
  * The compact header displays the exact active file name, file icon, dirty dot indicator, and formatted file size.
* **Inline Live Preview (`Ctrl+\`)**:
  * Easily toggle the side-by-side preview pane for HTML, Markdown, and JSON syntax.

---

### Architecture & Active Modules

```
docs/single/v3/
├── index.html                  # Full-height single-file canvas layout
├── sample.json                 # Initial single-file buffer
├── style.css                   # IDE styling
├── README.md                   # Documentation
└── js/
    ├── index.js                # App bootstrapper
    ├── core/
    │   ├── bindings.js         # Declarative DOM bindings engine
    │   ├── eventBus.js         # Event bus
    │   └── state.js            # Active file model state
    └── modules/
        ├── header/             # Open file action
        ├── tabs/               # Single-file loader & direct disk save
        ├── preview/            # Split preview pane (Ctrl+\)
        └── statusBar/          # Compact status bar (Ln/Col, Wrap, Language)
```
