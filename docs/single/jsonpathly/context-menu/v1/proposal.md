# Architectural Proposal: Left Editor Node Inspection (Context Menu & Alt+Click)

> **Document Status**: Active Implementation  
> **Location**: `monaco-ide/docs/single/jsonpathly/context-menu/v1/proposal.md`  
> **Feature Origin**: User Architectural Idea (KeshavSoft)  
> **Philosophy**: *"Zero-Typing AST Inspection — Point, Click, and Inspect."*

---

## 1. Problem Statement

In both V1 and V2, the user has to type JSONPath expressions manually into the search input (e.g., `$.rawAst.loc.start`).
For complex, deeply nested ASTs (like Babel trees with 11,375 lines):
- Users must manually read the tree, remember key hierarchies (`rawAst` -> `program` -> `body` -> `0` -> `declarations`), and type them without mistakes.
- If a user spots an interesting node on line 352 while scrolling the Left Editor, they have to stop and manually reconstruct the path to query it.

## 2. The Solution: Context Menu & Alt+Click Inspection

Instead of requiring manual typing in the search bar:
1. **Right-Click Context Menu**:
   Right-clicking on any property or line in the Left Monaco Editor surfaces a dedicated menu item:
   👉 **"Inspect Node with JSONPath"** (Shortcut: `Alt+I`).
2. **Alt + Click Gesture**:
   Holding `Alt` and clicking directly on any token in the Left Editor triggers instant inspection.
3. **Execution**:
   - The engine automatically resolves the RFC 9535 path from root down to that specific line/key.
   - The path is placed into the top search input.
   - The query executes instantly, rendering the extracted JSON node in the Right Monaco Editor.
   - The left editor flashes a subtle line highlight to confirm which node was inspected.

---

## 3. The Line-to-Path Resolver Algorithm (`pathResolver.js`)

Given the Monaco text model and a line number:
1. Scan preceding lines from line 1 to the target line.
2. Track open/close object scopes (`{` and `}`) and array scopes (`[` and `]`).
3. For objects, capture property keys matching `"([a-zA-Z0-9_$]+)"\s*:`.
4. For arrays, track element indices by counting object/array entries separated by commas.
5. On the target line, determine the most specific key under the cursor.
6. Assemble the normalized RFC 9535 path: e.g. `$.rawAst.program.body[0]`.

---

## 4. Verification URL

Live test URL:
`http://localhost:3000/docs/single/jsonpathly/context-menu/v1/`
