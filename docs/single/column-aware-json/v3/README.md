# Column-aware JSON Editor — V3

V3 is a small, modular experiment. It is not the final product. The purpose is to prove the column-to-editor connection while keeping every responsibility small, named, and independently improvable.

## Start with the story

```text
data/columns.json
       |
       v
modules/columns
       |  publishes: columns
       v
modules/schema
       |  publishes: schema
       v
modules/monaco
       |  publishes: monaco
       v
modules/schemaBinding
       |  binds schema + monaco
       v
modules/editor
       |  publishes: editor
       v
modules/validation + modules/controls
```

`js/index.js` only initializes these modules in dependency order.

## Module contract

Every module has the same recognizable shape:

```text
module-name/
├── instructions.json
├── bindings.json
├── actions.js
└── index.js
```

- `instructions.json` declares the module's ordered work.
- `bindings.json` declares DOM events that should invoke module actions.
- `actions.js` contains small operations.
- `index.js` wires that module's instructions, actions, and bindings to the shared runtime.

Some modules currently have an empty `bindings.json` because they do not yet own DOM events. It is still present and consumed so the module contract stays predictable.

## Shared infrastructure

```text
js/core/
├── state.js
├── eventBus.js
├── bindEvents.js
└── runInstructions.js
```

These are generic utilities shared by all modules. They do not contain column, schema, editor, or validation business rules.

## Data flow and bindings

Each instruction can publish a named result with `output`. Later instructions consume it with a `$name` reference.

Example:

```json
{
  "action": "create",
  "input": { "columns": "$columns" },
  "output": "schema"
}
```

The shared instruction runner resolves `$columns` from the application context. The module doesn't need to import another module's internal action.

## Module responsibilities

| Folder | Single responsibility |
|---|---|
| `modules/columns` | Load and display column definitions |
| `modules/schema` | Convert columns into JSON Schema |
| `modules/monaco` | Load Monaco |
| `modules/schemaBinding` | Register the generated schema with Monaco JSON language support |
| `modules/editor` | Create the JSON editor and its model |
| `modules/validation` | Read and display Monaco diagnostics |
| `modules/controls` | Reset the editor |

## Run

Serve the repository root over HTTP and open:

`docs/single/column-aware-json/v3/`

The page loads Monaco 0.52.2 from the CDN, matching the existing project.

## Current behavior

- Editor starts with `{}`.
- The column list comes from `data/columns.json`.
- JSON Schema is generated from those columns.
- The schema is registered with Monaco before the editor model is created.
- Unknown properties are rejected.
- Required properties and their value types are validated.
- Validate and Reset buttons work through module-owned `bindings.json`.

## Intentionally not the final product

This version is a small foundation to discuss and extend. It does not yet implement the dynamic completion rule that removes a property after it has already been used. That will be a separate small module/action when we add it, rather than hiding that logic inside the editor or schema modules.
