# Column-aware JSON — V4: Load Intelligence on Demand

A deliberately small experiment demonstrating that Monaco editors can exist before domain knowledge is registered.

## Run

Serve the repository with any static HTTP server from the repository root, then open:

`/docs/single/column-aware-json/v4/`

For example:

```bash
npx serve .
```

Internet access is required because Monaco 0.52.2 is loaded from cdnjs.

## Experiment

1. Two Monaco JSON editors load.
2. The left editor contains column definitions.
3. The right editor starts as `{}` with no column-specific schema registered.
4. Click **Load Intelligence**.
5. In the right editor, press Ctrl+Space inside the object to request column suggestions.
6. Try entering a property with the wrong type or an unknown property.
7. Change the left definitions and click **Load Intelligence** again.
8. Observe that the right editor's text and editor instance are preserved while its schema knowledge is replaced.

## Deliberate scope

This version uses straightforward JavaScript event listeners and a small schema-generation function. It does not yet use the instruction/bindings architecture. The purpose is to prove the live knowledge handoff first; we can transfer the proven behavior into the modular JSON-driven architecture afterward.

The schema is registered against the right editor's specific model URI, not every JSON model.
