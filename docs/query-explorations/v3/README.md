# Query Explorations — V3

V3 is a separate declarative rebuild. V1 and V2 are preserved.

## Single source of truth

`shared/sample.json` is byte-for-byte copied from `docs/single/jsonpathly/autocomplete/v4/sample.json`. Every playground fetches this same file at runtime using a URL resolved relative to its own `index.js`.

## Per-playground architecture

- `index.json` — declarative lab metadata and enabled capabilities.
- `bindings.json` — event/selector/action blueprint.
- `actions.js` — named behavior functions.
- `index.js` — wiring/orchestration; loads the sample and calls `bindEvents`.
- `index.html` — semantic host markup only.

Shared behavior lives in `assets/actions-core.js`; styling lives in `assets/style.css`. Event listeners are not attached individually in the lab code. Dynamic tree and result nodes work through delegated selectors.

## Why V2 failed to load

V2's shared script assumed elements such as `#tree` existed on every page. The Nifty JSON page did not contain that element. The resulting null dereference occurred after fetch succeeded, then the broad catch handler cleared the editor, making the sample appear not to load. V3's shell provides all required targets and keeps fetch errors separate from rendering errors.

## Run

Serve the repository over HTTP and open `docs/query-explorations/v3/index.html`. The browser needs network access to load the `dom-primitive-bindings` v7 module from the KeshavSoft GitHub Pages CDN.

## Scope

The JSONPath evaluator is a small educational subset for these experiments, not a full RFC 9535 implementation.
