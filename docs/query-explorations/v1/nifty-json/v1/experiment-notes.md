# Nifty JSON — V1 Experiment Notes

Project: https://marketplace.visualstudio.com/items?itemName=nifty.nifty-json

Purpose: Closest editor-extension reference: formatting, JSONPath querying, copy-path-at-cursor, and large-file tree browsing.

## Test checklist
- [ ] Open the shared sample as a JSON document and verify editing/formatting.
- [ ] Place the cursor on rawAst → program → body → the FunctionDeclaration entry; use Copy Path at Cursor.
- [ ] Run $.rawAst.program.body[*].type and inspect how query results are presented.
- [ ] Check whether a result can navigate back to its exact source location.
- [ ] Check whether query results can safely modify the source document, or are read-only extracts.

## Findings

- Works well:
- Missing / difficult:
- Source mutation behavior:
- Exact source navigation:
- Ideas to borrow:
- Questions / risks:
