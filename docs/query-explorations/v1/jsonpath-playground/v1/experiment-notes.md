# JSONPath Playground — V1 Experiment Notes

Project: https://jsonpath.dev/

Purpose: Useful reference for evaluating, replacing, modifying and deleting selected data with JSONPath, plus custom functions.

## Test checklist
- [ ] Load the shared sample as the JSON input.
- [ ] Run $.rawAst.program.body[*].type and compare the result order.
- [ ] Run $.rawAst.program.body[?@.type == "FunctionDeclaration"] and inspect filtering.
- [ ] Explore replace/modify/delete actions only on a disposable copy.
- [ ] Check whether result paths can be used to navigate or edit the original JSON.

## Findings

- Works well:
- Missing / difficult:
- Source mutation behavior:
- Exact source navigation:
- Ideas to borrow:
- Questions / risks:
