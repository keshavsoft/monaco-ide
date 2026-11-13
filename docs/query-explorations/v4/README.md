# Query Explorations — V4

V4 preserves V1, V2 and V3 and adds a separate technical story page for every playground.

## Navigation
- `index.html` is the V4 experiment hub.
- Each lab's `index.html` is the playground.
- Each lab's `story.html` explains the external product, our experiment's implementation, limitations and Monaco status.

## Shared data
Every lab loads `../shared/sample.json` at runtime from its `index.js`, using `new URL('../shared/sample.json', import.meta.url)`. There are no separate fixture copies per lab.

## Declarative implementation
Each lab keeps:
- `index.json` — configuration
- `bindings.json` — declarative event bindings
- `actions.js` — named actions
- `index.js` — startup/orchestration

The shared behavior remains in `assets/actions-core.js`.

## URL rule
Internal navigation to directories uses directory URLs ending in `/`. File URLs such as `story.html` and `index.js` remain file URLs. This works with static servers that serve a directory's `index.html` as its default document.

## Important scope note
The JSONPath evaluator is an educational subset, not a complete RFC 9535 implementation. The playgrounds are KeshavSoft learning experiments and are not copies of the external products.
