# Column-aware JSON — V5: Three editors, V3 modular architecture

V5 preserves the three-editor experiment and applies the module contract established in V3. V3 remains unchanged.

## Three-editor story

1. **Columns JSON** is the editable source of knowledge.
2. **Data JSON** is the target document. Loading intelligence registers a generated JSON Schema against this editor's model URI.
3. **Retrieved Schema** is read-only and displays the registered schema configuration read back from Monaco.

## Module flow

```text
modules/monaco       -> monaco
modules/columns      -> initialColumns
modules/schema       -> schema (on demand from current columns)
modules/schemaBinding-> register / pull / clear schema in Monaco
modules/editor       -> columnsEditor + dataEditor + returnedEditor
modules/controls     -> Load Intelligence / Pull Schema Back / Reset
```

Every module has `instructions.json`, `bindings.json`, `actions.js`, and `index.js`. Shared instruction execution, event delegation, and state storage live in `js/core/`. The page entry point only initializes modules in dependency order.

## Run

Serve the repository root over HTTP and open `docs/single/column-aware-json/v5/`. Monaco Editor 0.52.2 is loaded from CDN.

## Behavior

- The schema is initially cleared.
- Load Intelligence reads and validates the live contents of editor 1, generates a schema, and registers it for editor 2 without recreating editors or models.
- Pull Schema Back reads Monaco's configured schema entry by its URI and displays `uri`, `fileMatch`, and inline `schema` in editor 3.
- Reset restores the initial columns and data, clears editor 3, and removes the registered column schema.

The read-back exposes the schema configuration registered with Monaco's JSON defaults; it does not export Monaco's internal language-service implementation.
