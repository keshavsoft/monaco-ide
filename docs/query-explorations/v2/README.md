# Query Explorations — V2

V2 is the hands-on playground layer. V1 remains the original external-reference catalog.

## Single source of truth

`shared/sample.json` is copied byte-for-byte from:

`docs/single/jsonpathly/autocomplete/v4/sample.json`

Every experiment loads this same file at runtime using `fetch('../shared/sample.json')`. Do not create per-product fixture copies. Update the shared file once when the common test document needs to change.

## Experiments

- `nifty-json/` — editor utilities, formatting, key sorting, tree navigation and path copying.
- `jsonlab/` — query results and applying results to the editable document.
- `jsonstudio/` — source, tree and grid views.
- `json-editor-online/` — structured object editing.
- `jsonpath-tools/` — query suggestions and validation.
- `jsonpath-playground/` — query execution, match inspection and result operations.

All pages share `assets/labs.js` and `assets/style.css`. The JSONPath evaluator is deliberately a focused experimental subset. It is not advertised as a complete RFC 9535 implementation and should be extended/tested independently.

## Run

Serve the repository with the existing local development server, then open:

`/docs/query-explorations/v2/`
