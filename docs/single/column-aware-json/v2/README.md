# Column-aware JSON Editor — V2 (Instruction-driven)

This version uses the project's instruction-driven architecture throughout the application behavior.

## The central contract

`data/columns.json` is the only source of column names and types. The application turns that definition into JSON Schema and binds the schema to Monaco's built-in JSON language service.

## Instruction flow

`instructions.json` is the application story. It declares the ordered actions, their inputs, and named outputs.

```text
instructions.json
       |
       v
runtime/runInstructions.js
       |
       +---- resolves $bindings from shared state
       |
       v
actions/index.js (action registry)
       |
       +--> loadColumns
       +--> renderColumns
       +--> createColumnSchema
       +--> loadMonaco
       +--> bindSchemaToMonaco
       +--> createJsonEditor
       +--> validateAndRender
       +--> bindEditorEvents
       +--> bindButtonEvents
```

## Where to look

1. `instructions.json` — read this first. It declares the complete application sequence.
2. `js/runtime/runInstructions.js` — generic instruction executor. It does not know the business meaning of individual actions.
3. `js/runtime/resolveBindings.js` — resolves `$columns`, `$schema`, `$monaco`, and `$editor` from shared state.
4. `js/actions/index.js` — registry mapping instruction action names to implementations.
5. `js/actions/*.js` — one implementation per action.
6. `data/columns.json` — single source of column knowledge.

## Instruction contract

Each instruction has:
- `action`: action registry key.
- `input`: literal parameters and/or `$name` bindings.
- `output`: optional shared-state name receiving the action result.

The executor runs instructions in order. Each output is stored for later instructions.

## Monaco binding

`createColumnSchema` generates JSON Schema from the columns. `bindSchemaToMonaco` registers it with Monaco's built-in JSON language service before `createJsonEditor` creates the model.

## V2 scope and limitation

- Starts with one empty object `{}`.
- Schema completion is sourced from the columns.
- Unknown properties are disallowed.
- Defined properties are required.
- Value types are validated.
- No additional npm package is required.

JSON Schema supports property suggestions and validation. The special rule to dynamically remove a property from suggestions immediately after it has been used still requires a custom completion provider; it is not falsely claimed as complete in this version.
