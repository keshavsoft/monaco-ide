# Architectural Decision Record & Evolution Blueprint: Monaco JSONPathly V3

> **Document Status**: Active Implementation Specification  
> **Author**: Antigravity (Pair Programming with Boss / KeshavSoft)  
> **Location**: `monaco-ide/docs/single/jsonpathly/v3/proposal.md`  
> **Predecessors**: `jsonpathly/v1` (Prototype Lab), `jsonpathly/v2` (Ruthless Simplicity)  
> **Philosophy**: *"Don't add visual noise. Add behavioral intelligence."*

---

## 1. Executive Summary & Context

In **V1**, we validated client-side RFC 9535 JSONPath evaluation via `jsonpathly` in sub-millisecond execution times (0.7ms). However, V1 suffered from cognitive overload: too many badges, preset chips, latency readouts, and sub-headers.

In **V2**, Boss mandated **ruthless simplicity**. We stripped every single unnecessary widget, creating a single 42px header, a distraction-free 50/50 dual Monaco canvas (Source on left, Result on right), and strict KeshavSoft folder discipline (`instructions.json`, `bindings.json`, `actions.js`, outside wiring). The user tested `$.rawAst.loc.start` on an 11,375-line AST (`raw-ast.json`), which rendered cleanly and instantly.

Now, in **V3**, we maintain the serene visual minimalism of V2, but solve the fundamental problems of real-world AST exploration:
1. **The Disconnect**: The left editor and right editor currently operate as isolated silos.
2. **Blind Typing**: Users must manually scan thousands of lines to guess property names like `loc`, `declarations`, or `program`.
3. **Multi-Match Navigation**: When queries return arrays of 10+ items, there is no intuitive way to jump between matches and trace them back to the source tree.

---

## 2. The Four Architectural Pillars of V3

### Pillar 1: Two-Way Synchronized Highlighting
- **Result ➔ Source (Click-to-Locate)**:  
  Clicking any matched element or line in the Right Result Editor automatically locates its parent definition in the Left Source Editor, highlighting it with a distinct Monaco line decoration and centering it via `revealLineInCenter()`.
- **Source ➔ Query (Reverse JSONPath / Click-to-Path)**:  
  Holding `Alt` and clicking on any property in the Left Source Editor computes its exact JSONPath (e.g., `$.rawAst.program.body[0].loc.start`) and injects it into the search bar. Developers no longer have to construct long JSONPaths by hand.

### Pillar 2: Dynamic Schema-Aware Autocomplete
- As the user types in the search input (`#txtQuery`):
  - Typing `$` introspects the loaded JSON and suggests root keys.
  - Typing `$.rawAst.` introspects child keys (`type`, `start`, `end`, `loc`, `program`).
  - Typing an array path `$.rawAst.program.body[0].` introspects the first element's structure.
- **Design Rule**: The autocomplete floats directly underneath the input as a lightweight, keyboard-navigable palette (`Up`, `Down`, `Enter`, `Tab`, `Escape`). It never consumes persistent screen space.

### Pillar 3: Match Stepper & AST Traversal (`F3` / `Shift+F3`)
- When a query returns multiple matches (e.g., 14 statements in `$.rawAst.program.body[*]`):
  - A subtle stepper `1 / 14` with `▲` and `▼` buttons appears cleanly inside the search bar.
  - Pressing `Enter`, `F3`, or clicking `Next` cycles through each match:
    - Scrolls to match #N in the Right Editor.
    - Synchronously scrolls and highlights match #N in the Left Source Editor.

### Pillar 4: Query URL Permalinks & Export
- Executed queries update the browser URL search params (`?q=$.rawAst.loc.start`) without reloading the page (`history.replaceState`).
- Opening that URL directly executes the query on form load.
- Seamless file export: `Ctrl+Shift+S` allows downloading the query output as a standalone JSON file.

---

## 3. KeshavSoft Modular Folder Structure

Following KeshavSoft discipline, all functionality is partitioned into dedicated domain folders with zero imperative spaghetti:

```
monaco-ide/docs/single/jsonpathly/v3/
├── index.html                   # Minimalist HTML (Header with search & stepper + 50/50 canvas + Status bar)
├── proposal.md                  # This persistent specification
├── style.css                    # Compiled base CSS + .split-pane-half + Monaco decoration classes
├── sample.json                  # Embedded AST sample
├── js/
│   ├── index.js                 # Outside orchestrator
│   ├── core/
│   │   ├── state.js             # Reactive store (sourceEditor, resultEditor, matches, activeMatchIndex)
│   │   ├── eventBus.js          # Decoupled pub/sub broker
│   │   └── bindings.js          # Declarative DOM primitive binder
│   └── modules/
│       ├── editors/             # Dual-Monaco Lifecycle Module
│       │   ├── instructions.json# Declarative form-load editor creation specs
│       │   ├── actions.js       # Monaco initialization, model loading, decorations
│       │   └── index.js
│       ├── jsonpath/            # Query & Path Evaluation Module
│       │   ├── bindings.json    # DOM event mappings (Find button, Enter key, Stepper next/prev)
│       │   ├── actions.js       # jsonpathly.query() + paths() execution, match cycling
│       │   └── index.js
│       ├── synchronizer/        # Bidirectional Editor Bridge
│       │   ├── actions.js       # Path-to-Line locator, Reverse JSONPath on Alt+Click, Monaco decorations
│       │   └── index.js
│       ├── autocomplete/        # In-Memory JSON Key Introspection
│       │   ├── bindings.json    # Input event mappings (input, keydown navigation)
│       │   ├── actions.js       # Schema traversal, suggestion popup rendering
│       │   └── index.js
│       ├── header/              # File Operations
│       │   ├── bindings.json    # File button click, Ctrl+O shortcut
│       │   ├── actions.js       # showOpenFilePicker / input handling
│       │   └── index.js
│       └── statusBar/           # Ln/Col Tracking, Word Wrap
│           ├── bindings.json
│           ├── actions.js
│           └── index.js
```

---

## 4. Line Locating & Decoration Strategy

To connect the Right Result Editor back to the Left Source Editor:
1. When `jsonpathly.paths(data, query)` executes, it returns normalized RFC 9535 paths:
   `[["$", "rawAst", "program", "body", 0], ["$", "rawAst", "program", "body", 1], ...]`
2. For any path, the `synchronizer` traverses the Monaco model's line text:
   - Matches keys in hierarchical scope to find the starting line and ending line of that specific node.
3. Applies a highlighted Monaco decoration:
   ```javascript
   const decorations = sourceEditor.deltaDecorations([], [{
       range: new monaco.Range(startLine, 1, endLine, 100),
       options: {
           isWholeLine: true,
           className: 'highlight-active-match',
           overviewRuler: { color: '#38bdf8', position: monaco.editor.OverviewRulerLane.Right }
       }
   }]);
   sourceEditor.revealLineInCenter(startLine);
   ```

---

## 5. Verification Checklist

- [x] V2 clean aesthetic preserved without clutter.
- [x] Dual Monaco 50/50 split loads on form load from `instructions.json`.
- [x] Two-way line highlighting connects left and right editors.
- [x] Reverse JSONPath on `Alt + Click` in source editor.
- [x] Dynamic autocomplete on `$.` typing without external dependencies.
- [x] Match stepper for multi-item array results.
- [x] V3 remains completely isolated in its own folder.
