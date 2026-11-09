# Monaco IDE Single — jsonpathly V1 (Dual Monaco Split Architecture)

**Monaco IDE Single • jsonpathly V1** provides a clean, 50/50 dual Monaco Editor workspace designed specifically for querying, inspecting, and transforming complex JSON documents (such as Babel ASTs like `raw-ast.json`) using the **RFC 9535 JSONPath** standard.

---

### Architectural Discipline

Built strictly following KeshavSoft modular domain discipline:
* **Zero inline `onclick` or imperative DOM loops**.
* **Form Load Module (`modules/editors/`)**: Dual Monaco editors are declared in `instructions.json` and stamped out onto `#sourceEditorContainer` and `#resultEditorContainer`.
* **Search & Output Engine (`modules/jsonpath/`)**: Binds query execution via `bindings.json` and evaluates expressions with native browser ESM `jsonpathly`.
* **Clean 50/50 Split Canvas**:
  * **Left (50%)**: Source Document (`state.sourceEditor`) — interactive input buffer.
  * **Right (50%)**: Query Output (`state.resultEditor`) — full Monaco instance with syntax coloring, code folding, and formatting.
* **Outside Bootstrapper (`js/index.js`)**: Lean orchestrator that imports domain modules and wires them together from the outside.

---

### Modular Directory Structure

```
docs/single/jsonpathly/v1/
├── index.html                           # Clean 50/50 layout (Left Source ↔ Right Result)
├── sample.json                          # Babel AST sample with location markers
├── README.md                            # Architecture & documentation
└── js/
    ├── index.js                         # Outside Orchestrator (Wires modules from outside)
    │
    ├── core/
    │   ├── bindings.js                  # KeshavSoft DOM primitive bindings engine
    │   ├── eventBus.js                  # Decoupled pub/sub broker
    │   └── state.js                     # Central store (sourceEditor, resultEditor, monaco)
    │
    └── modules/
        ├── editors/                     # 1. FORM LOAD MODULE (Dual Editors Activation)
        │   ├── instructions.json        # Declarative specs for Left & Right Monaco editors
        │   ├── actions.js               # Pure action stamping out Monaco instances
        │   └── index.js                 # Exports initEditors(monaco)
        │
        ├── jsonpath/                    # 2. SEARCH ENGINE MODULE (RFC 9535 Querying)
        │   ├── bindings.json            # DOM event bindings (Enter key, Find click, Clear, Copy)
        │   ├── actions.js               # Dispatches query via jsonpathly & updates resultEditor
        │   └── index.js                 # Exports initJsonPath()
        │
        ├── header/                      # 3. HEADER & FILE OPERATIONS MODULE
        │   ├── bindings.json            # Open file button & keyboard Ctrl+O
        │   ├── actions.js               # File System Access API handlers
        │   └── index.js                 # Exports initHeader()
        │
        ├── tabs/                        # 4. SINGLE BUFFER PERSISTENCE MODULE
        │   ├── bindings.json            # Disk save bindings (Ctrl+S)
        │   ├── actions.js               # Disk write actions
        │   └── index.js                 # Buffer management & language detection
        │
        └── statusBar/                   # 5. STATUS BAR MODULE
            ├── bindings.json            # Word wrap, cursor bindings
            ├── actions.js               # Dual-editor wrap toggle
            └── index.js                 # Exports initStatusBar()
```

---

### Flavours of Query Output (Right Editor)

1. **Tree (JSON)**: Formatted sub-tree of all matched AST nodes / objects.
2. **Paths**: Normalized RFC 9535 path strings (`$['rawAst']['program']['body'][0]`).
