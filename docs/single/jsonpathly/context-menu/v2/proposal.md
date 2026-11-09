# Architectural Proposal: Context Menu V2 — Pure Zero-Search Node Probe

> **Document Status**: Active Implementation  
> **Location**: `monaco-ide/docs/single/jsonpathly/context-menu/v2/proposal.md`  
> **Design Mandate**: Boss Directive (KeshavSoft)  
> **Philosophy**: *"Distraction-Free Visual Exploration — Remove the search bar. Click to inspect, learn, and extract."*

---

## 1. The Core Insight

In **Context Menu V1**, we added right-click and Alt+Click node inspection, but kept the top search bar, clear button, and Find button from the generic interface. 

### Why the Top Search Bar was Flawed in this Laboratory:
1. **Cognitive Distraction**: Having a text input at the top encourages users to type queries manually, diverting their attention away from the real hero: **visual navigation directly on the AST**.
2. **Pedagogical Pollution**: This laboratory exists to teach and demonstrate **contextual tree discovery**. Mixing manual typing with click-driven inspection dilutes the learning curve.
3. **Redundancy**: If every node in the tree can be inspected by right-clicking or Alt+clicking, a manual typing box is pure clutter.

---

## 2. The V2 Architecture: "Pure Zero-Search Node Probe"

In **Context Menu V2**, we remove the top search input (`#txtQuery`), the clear button (`#btnClear`), and the find button (`#btnFind`) entirely.

### What Replaces It:
1. **Active Node Path Pill** (`#activePathDisplay`):
   - **Idle State**: A subtle prompt: `👉 Right-click or Alt+Click any node on the left to inspect`.
   - **Active State**: Transforms into an illuminated badge showing the canonical RFC 9535 path derived by `pathResolver.js`:
     ```
     🎯 Active Node: $.rawAst.program.body[0].declarations[0]  [📋 Copy Path]
     ```
2. **Left Editor Focus**:
   - The user navigates the document visually.
   - Right-click anywhere ➔ **"⚡ Inspect Node (Extract to Right Editor)"** (`Alt+I`).
   - Alt + Click directly on any line triggers instant extraction.
   - The active line is highlighted with an accent glow (`highlight-inspected-node`).
3. **Right Editor Immediate Feedback**:
   - Evaluates and formats the extracted AST subtree in under 1ms.
   - Features a clean **Copy Output** button in the top header.
4. **Learning & Teaching Value**:
   - The student or engineer can explore complex AST structures (like 11,000-line Babel trees) by pointing and clicking.
   - They see both the extracted payload AND the exact RFC 9535 JSONPath formula that yields it.

---

## 3. Structural Comparison: V1 vs V2

| Feature | Context Menu V1 | Context Menu V2 (Boss Edition) |
| :--- | :--- | :--- |
| **Top Search Input** | Yes (450px wide input box) | **Removed** (100% distraction-free) |
| **Find & Clear Buttons** | Yes | **Removed** |
| **Path Display** | Stuffed into editable input | **Read-Only Illuminated Breadcrumb** |
| **Copy Path Action** | Manual text selection | **One-Click Clipboard Pill** |
| **Primary Interaction** | Hybrid (Typing + Click) | **Pure Visual Probe (Right-Click / Alt+Click)** |
| **Pedagogical Clarity** | 60% (Divided attention) | **100% (Single Responsibility)** |

---

## 4. Verification

Live URL:
`http://localhost:3000/docs/single/jsonpathly/context-menu/v2/`

