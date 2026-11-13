# Architectural Proposal: Multi-Match Stepper & Traversal

> **Document Status**: Active Implementation  
> **Location**: `monaco-ide/docs/single/jsonpathly/multi-match/v1/proposal.md`  
> **Feature Origin**: Isolated Task Laboratory (KeshavSoft)  
> **Philosophy**: *"Never get overwhelmed by 100+ AST matches. Step through with precision."*

---

## 1. Problem Statement

When an AST query returns a collection (e.g. `$.rawAst.program.body[*]`), the right editor dumps 14 or 50 items in a big array. The user has no easy way to navigate through item #1, #2, #3, or see which item in the array corresponds to which line in the left source AST.

## 2. The Solution: Contextual Match Stepper

1. **Contextual Stepper Pill**:
   When matches > 1, a subtle stepper appears in the header:
   `[ ◄ ] [ 1 / 14 ] [ ► ]` (along with `F3` / `Shift+F3` keyboard shortcuts).
   When matches <= 1, the stepper remains completely hidden.
2. **Synchronized Stepping**:
   Clicking `Next` (or `F3`):
   - Right Editor scrolls smoothly to item #N.
   - Left Editor scrolls and highlights statement #N in the source tree!

---

## 3. Verification URL

Live test URL:
`http://localhost:3000/docs/single/jsonpathly/multi-match/v1/`

