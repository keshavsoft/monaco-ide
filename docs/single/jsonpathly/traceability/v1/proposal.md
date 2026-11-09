# Architectural Proposal: Two-Way Traceability & Highlighting

> **Document Status**: Active Implementation  
> **Location**: `monaco-ide/docs/single/jsonpathly/traceability/v1/proposal.md`  
> **Feature Origin**: Isolated Task Laboratory (KeshavSoft)  
> **Philosophy**: *"Never leave the user wondering where extracted data came from."*

---

## 1. Problem Statement

In an 11,375-line AST document, querying `$.rawAst.loc.start` displays `{ "line": 1, "column": 0 }` in the right editor. But the user has zero visual confirmation of where that object lives within the 11,000 lines of code on the left. The two editors feel isolated.

## 2. The Solution: Synchronized Source Highlighting

1. **Automatic Query Highlight**:
   Upon executing any query, the engine uses `jsonpathly.paths()` to determine the exact path of the matched node, locates its starting line in the Left Source Editor, scrolls to it via `revealLineInCenter()`, and highlights it with a radiant blue line decoration.
2. **Click-to-Locate from Right Editor**:
   Clicking anywhere inside the Right Result Editor immediately triggers a synchronization pass that jumps the Left Editor directly to that line in the source tree.

---

## 3. Verification URL

Live test URL:
`http://localhost:3000/docs/single/jsonpathly/traceability/v1/`

