# Query Explorations — V1

This directory is a controlled research lab for existing JSON editors and JSONPath tools. It does not replace or modify the existing `docs/single/jsonpathly` experiments.

## Structure

- `nifty-json/v1/` — VS Code JSON editing extension and JSONPath commands
- `jsonlab/v1/` — Monaco-based web JSON editor with query mode
- `jsonstudio/v1/` — Monaco-based editor with synchronized source/tree/grid editing
- `json-editor-online/v1/` — established code/tree JSON editor
- `jsonpath-tools/v1/` — specialist RFC 9535 query-editor component
- `jsonpath-playground/v1/` — RFC 9535 query/evaluate/modify workbench
- `shared/sample.json` — one common fixture copied from `docs/single/jsonpathly/v1/sample.json`

## Comparison rule

Use the same `shared/sample.json` and the same query cases in every project. Record observed behavior, not assumed capabilities. Each V1 page links to the external project and its source/project information. The external products are not embedded, cloned, or redistributed here. Before porting any implementation, inspect its license, dependencies, and integration constraints.

## Common test expressions

```text
$.rawAst.program.body[*].type
$.rawAst.program.body[2]
$.rawAst.program.body[?@.type == "FunctionDeclaration"]
$.rawAst.program.body[2].id.name
$..type
```
