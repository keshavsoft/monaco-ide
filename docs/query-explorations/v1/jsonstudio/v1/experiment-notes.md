# JsonStudio — V1 Experiment Notes

Project: https://jsonstudio.js.org/

Purpose: Strong reference for synchronized source, tree and grid editing, path copying, and JSONPath/JMESPath query modes.

## Test checklist
- [ ] Open/import the shared sample and edit a value in source mode.
- [ ] Switch to Tree View and locate rawAst.program.body.
- [ ] Edit a node in Tree View and verify the source editor stays synchronized.
- [ ] Copy a node path and compare it with the RFC 9535 normalized path.
- [ ] Run $.rawAst.program.body[*].type and inspect match highlighting/source navigation.

## Findings

- Works well:
- Missing / difficult:
- Source mutation behavior:
- Exact source navigation:
- Ideas to borrow:
- Questions / risks:
