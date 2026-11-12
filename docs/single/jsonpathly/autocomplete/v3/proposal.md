# Architectural Proposal: Dynamic Schema-Aware Autocomplete

> **Document Status**: Active Implementation  
> **Location**: `monaco-ide/docs/single/jsonpathly/autocomplete/v1/proposal.md`  
> **Feature Origin**: Isolated Task Laboratory (KeshavSoft)  
> **Philosophy**: *"Never break your head guessing deep AST keys."*

---

## 1. Problem Statement

Developers shouldn't have to memorize or hunt down obscure AST property names like `declarations`, `program`, `callee`, `specifiers`. If you make one typo, the query fails with `[]`.

## 2. The Solution: Dynamic In-Memory Key Introspection

1. **Live Introspection**:
   As the user types in `#txtQuery`:
   - Typing `$` or `$.` introspects the loaded JSON root object and suggests root keys (`project`, `version`, `rawAst`).
   - Typing `$.rawAst.` navigates down the AST object and suggests its child properties (`type`, `start`, `end`, `loc`, `program`).
   - Typing `$.rawAst.program.body[0].` introspects array item #0!
2. **Floating Dropdown**:
   A clean, keyboard-navigable palette appears underneath the search input:
   - `ArrowDown` / `ArrowUp` to cycle.
   - `Enter` or `Tab` to complete.
   - `Escape` to close.
   - Vanishes completely when Enter is pressed to run the query.

---

## 3. Verification URL

Live test URL:
`http://localhost:3000/docs/single/jsonpathly/autocomplete/v1/`

