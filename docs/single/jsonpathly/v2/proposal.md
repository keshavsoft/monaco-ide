# Architectural Decision Record & Evolution Blueprint: Monaco JSONPathly V2

> **Document Status**: Approved Specification  
> **Author**: Antigravity (Pair Programming with Boss / KeshavSoft)  
> **Location**: `monaco-ide/docs/single/jsonpathly/v2/proposal.md`  
> **Scope**: Elimination of UI cognitive overload, declarative dual-Monaco architecture, browser-native RFC 9535 JSONPath integration, and strict KeshavSoft folder discipline.

---

## 1. Executive Summary & Problem Context

When dealing with large ASTs, enterprise schemas, and deep configuration structures (such as `raw-ast.json` containing **11,375 lines** / **453 KB** of Babel AST tokens), developers face severe cognitive fatigue:
- Navigating and scrolling a multi-megabyte JSON file manually in an editor is slow, inefficient, and error-prone.
- Developers don't want to scan 11,000 lines; they want to ask a targeted question (e.g., *"What is the ending line?"* or `$.rawAst.end`, *"Where are all the variable declarations?"* or `$.rawAst.program.body[*]`).
- Traditional solutions rely on heavy Node.js CLI tools (`jq`, custom AST traversers) or third-party web tools that leak sensitive code to remote servers.

### The Opportunity
Bring **RFC 9535 standard JSONPath** directly inside the browser using **Monaco Editor** and **`jsonpathly`** (a zero-dependency, Peggy AST-powered in-memory evaluator), providing instantaneous (sub-millisecond) data extraction completely client-side.

---

## 2. The Journey & Evolution (Chronicle of Dialogue)

### Stage 1: The Single-File Suite & The 404 Audit
- **Context**: The `monaco-ide` suite had fragmented sub-folders (`v1`, `v2`, `v3`), and direct URLs produced 404s when landing on directory roots lacking index files.
- **Action**: Created the centralized portal `monaco-ide/docs/single/index.html` narrating the single-file Monaco evolution, while guaranteeing that `v3` remains 100% pristine and untouched.

### Stage 2: Introducing `jsonpathly`
- **Question**: *"Where is jsonpathly?"*
- **Investigation**: We verified that `jsonpathly` is an RFC 9535 standard parser published on npm with zero runtime Node dependencies (no `fs`, `path`, `vm`, or `eval`).
- **Integration**: Imported directly in modern browsers via native ESM:
  ```javascript
  import { JSONPath } from 'https://esm.sh/jsonpathly';
  ```

### Stage 3: The V1 Prototype & Boss's Critical Review
An initial prototype was assembled in `v1`. However, Boss provided an immediate, vital architectural course-correction that reshaped the entire product philosophy:

> **Boss's Critique**:
> 1. *"Emma was I frankly dont like your approach. What you did is, after loading the json, that heavy agency, you have predicted some of the patterns, and you have showed something. I wish I really see two flaws. Why are you confusing the user? See so much information. Let him ask what he was."*
> 2. *"Second, one, you have shown something on the right side, and that can be a mammapo editor again. Its very unclear what it is. So the conclusion what I would like to say is, instead of you going ahead this way, however, we have a json dried and right at the top, we have a search engine At Jason Patlicki sets our find Analyse something like that. Then you will try to understand what the result is coming and how to show that result after Searching that thing."*

### Stage 4: The 50/50 Dual Monaco Vision
Boss formulated the definitive layout structure:
> *"divide the whole external into 5050. Right side, one monocreditor. Left side, two different monarch editors, not two, not same. Two different Both will be loaded under dumb on the formula. Left side, you will load adjacent, and right side is a place. Every time you will try to convey the information, whatever we got So I think this will give you a good launchpad."*

- **Left 50%**: Source Monaco Editor (Input: raw JSON loaded from disk or pasted).
- **Right 50%**: Result Monaco Editor (Output: whatever matches the JSONPath query).
- **Form Load**: Both editors must be activated declaratively on page load.

### Stage 5: The KeshavSoft Engineering Discipline
Boss mandated strict architectural discipline against ad-hoc scripting:
> *"Just go ahead Try to create another monarchy editor. And in the process of monopoly editor, you need to understand, you need to follow our discipline. Dont write javascript functions every time. We need to follow our discipline of bindings actions. And hooking them So because what I mean to say in the form load, two monoclonal editors need to be activated. So here there is a scope. You can write an instruction JSA now Am I clear?"*
>
> *"Till now, we have got a single instructions. Jason right, everything is defined in bindings and actions. Everything happens. But in reality, this is not the case. In general, we do. You dont see this much simple Functionality So I really see multiple actions. Single binding. Single action multiple bindings, many to many in this way... divide it to small folders and try to keep separate gst. And only wire them from outside, just to make this first functioning."*

### Stage 6: The 50/50 Width Debugging Incident
In early tests of V1, the editors collapsed to ~300px each because Tailwind CSS AOT compilation in `style.css` had purged the `w-1/2` class.
- **Boss's Catch**: *"50 50 missing it seems ?"*
- **The Fix**: Added explicit styling `.split-pane-half { flex: 1 1 50% !important; width: 50% !important; max-width: 50% !important; min-width: 0 !important; }` and triggered `editor.layout()`.
- **Validation**: Tested against `$.rawAst.end` on the 11,375-line `raw-ast.json`. Query executed in **0.7ms**, and the output `3672` immediately rendered in the right editor!

### Stage 7: The V2 Call for Ruthless Simplicity
While V1 proved the engine works at sub-millisecond speeds, Boss observed the remaining UI visual noise:
> *"Boss, where you go? I really liked But I see a lot of Clutter around. I want you to clean this very, very simple file selection. Jason is loaded. Sh and a fine button. That's it. No data, no extra nothing, no valuations, anything. Those should be just those click events. So whatever is found, no analysis, nothing. I want you to prepare V2 so simple and clean. Am I clear? I should be impressed to see the simplicity. Please answer first."*

---

## 3. The V2 Manifesto: What We Cut vs. What We Keep

| Category | In V1 (Noise / Clutter) ❌ | In V2 (Pristine Simplicity) ✅ |
| :--- | :--- | :--- |
| **Top Bar** | Multiple rows, preset buttons (`Root Keys`, `AST Statements`, `All Types`), pills, badges | **Single slim header**: `[Monaco IDE v2]` + `[File]` + Clean Search Input + `[Find]` button |
| **Query Input** | Busy sub-bar with preset selectors and engine status badges | Unified input bar directly in the top header with placeholder `Enter JSONPath (e.g. $.rawAst.end)...` |
| **Sub-Headers** | Split pane sub-headers: "Source Document (Input) 11375 lines" & "Query Output (Result) Tree Paths 0 matches (0.7ms) Copy Output" | **None**. Total elimination of intermediate sub-headers. Editors take 100% of vertical height. |
| **Telemetry & Badges** | Latency readouts (`0.7ms`), match counters (`14 matches`), engine badges (`RFC 9535 Engine: jsonpathly`) | **Removed**. Fast execution is experienced, not shouted. |
| **Output Formats** | Flavour switcher tabs (`JSON Tree`, `Paths`), copy buttons | Clean Monaco JSON output directly rendered in the right editor. |
| **Canvas** | Shifting flex containers with potential shrink | **True 50/50 Split**: Exactly 50% Source Editor ↔ 50% Result Editor. |

---

## 4. KeshavSoft Architectural Architecture for V2

V2 strictly implements KeshavSoft's declarative separation of concerns across dedicated folders:

```
monaco-ide/docs/single/jsonpathly/v2/
├── index.html                   # Pure minimal HTML structure (Header + 50/50 canvas + Status bar)
├── proposal.md                  # This persistent ADR & Blueprint
├── style.css                    # Base theme + explicit .split-pane-half rules
├── sample.json                  # Built-in sample payload for immediate testing
├── js/
│   ├── index.js                 # Pure outside orchestrator (imports and initializes modules)
│   ├── core/
│   │   ├── state.js             # Reactive shared state (sourceJson, query, result, sourceEditor, resultEditor)
│   │   ├── eventBus.js          # Decoupled pub/sub messaging bus
│   │   └── bindings.js          # Generic DOM event primitive binder (bindEvent)
│   └── modules/
│       ├── editors/             # Dual-Monaco Lifecycle Module
│       │   ├── instructions.json# Declarative form-load editor creation specs
│       │   ├── actions.js       # Monaco initialization, model loading, layout recalculation
│       │   └── index.js         # Module entry point
│       ├── jsonpath/            # Query Evaluation Module
│       │   ├── bindings.json    # DOM event mappings (Find button click, Enter key on input)
│       │   ├── actions.js       # Pure jsonpathly.query execution and result injection
│       │   └── index.js         # Module entry point
│       ├── header/              # File Loading Module
│       │   ├── bindings.json    # File button click mapping
│       │   ├── actions.js       # File opening via showOpenFilePicker / input fallback
│       │   └── index.js         # Module entry point
│       └── statusBar/           # Clean status bar tracking cursor and word wrap
│           ├── bindings.json    # Status bar interactions
│           ├── actions.js       # Ln/Col and Wrap updates
│           └── index.js         # Module entry point
```

### 4.1. Declarative Editor Initialization (`modules/editors/instructions.json`)
The form-load creation of both editors is defined declaratively, not hardcoded into imperative JS:
```json
{
  "editors": [
    {
      "id": "sourceEditor",
      "containerId": "sourceEditorContainer",
      "options": {
        "language": "json",
        "theme": "vs-dark",
        "automaticLayout": true,
        "readOnly": false,
        "minimap": { "enabled": true },
        "fontSize": 13,
        "lineNumbers": "on",
        "scrollBeyondLastLine": false
      }
    },
    {
      "id": "resultEditor",
      "containerId": "resultEditorContainer",
      "options": {
        "language": "json",
        "theme": "vs-dark",
        "automaticLayout": true,
        "readOnly": true,
        "minimap": { "enabled": false },
        "fontSize": 13,
        "lineNumbers": "on",
        "scrollBeyondLastLine": false
      }
    }
  ]
}
```

### 4.2. Declarative Event Bindings (`modules/jsonpath/bindings.json`)
UI events are bound purely through declarative JSON mapping:
```json
[
  {
    "selector": "#btnFind",
    "event": "click",
    "action": "executeSearch"
  },
  {
    "selector": "#txtQuery",
    "event": "keydown",
    "filter": "Enter",
    "action": "executeSearch"
  }
]
```

### 4.3. The Outside Orchestrator (`js/index.js`)
Contains zero DOM event listeners or business logic. It acts solely as the wiring bridge:
```javascript
import { state } from './core/state.js';
import { initEditors } from './modules/editors/index.js';
import { initHeader } from './modules/header/index.js';
import { initJsonPath } from './modules/jsonpath/index.js';
import { initStatusBar } from './modules/statusBar/index.js';

async function boot() {
  await initEditors();
  initHeader();
  initJsonPath();
  initStatusBar();
}

window.addEventListener('DOMContentLoaded', boot);
```

---

## 5. User Experience Walkthrough

1. **First Impression**: The user opens the page. They see a dark, distraction-free environment.
2. **Top Navigation**:
   - `[Monaco IDE v2]` (Badge)
   - `[File]` (Loads any local JSON from disk via File System Access API)
   - Search bar (`[ $.rawAst.end                                     ]`)
   - `[Find]` button (Clean accent button)
3. **Workspace Canvas**:
   - Left 50%: The full source JSON is displayed with syntax highlighting, folding, and minimap.
   - Right 50%: The result editor waits silently.
4. **Interaction**:
   - The user types a JSONPath query (e.g. `$.rawAst.program.body[*].type`) and hits `Enter` or clicks `Find`.
   - The result appears immediately in the right editor as formatted JSON.
   - If no match is found, it renders `[]`.
   - If the query syntax is invalid, it shows a clean JSON error description without alert popups or breaking the page.

---

## 6. Persistence & Sign-off

This document is preserved permanently at:
`d:\KeshavSoftRepos\nov\9-2\monaco-ide\docs\single\jsonpathly\v2\proposal.md`

Every design requirement, architectural principle, and user instruction given by Boss has been enshrined here as our north star before writing a single line of V2 implementation code.

