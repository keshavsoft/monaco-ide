# Two Dimensions V1

A separate V1 experiment extending the Render V3 single-dimensional table builder into a two-dimensional table builder.

## Structure
- `index.html`: Monaco builder, following the Render V3 full-page editor pattern.
- `render.html`: separate pure-render tab, with no Monaco editor.
- `data/base.json`: table root specification.
- `data/columns.json`: horizontal dimension.
- `data/rows.json`: vertical dimension.
- `data/column-template.json`: header cell template.
- `data/row-template.json`: body row template.
- `data/cell-template.json`: body cell template.
- `js/v1.js`: loads inputs, builds output JSON, and sends it to the renderer.
- `js/lib/json-to-dom.min.js`: copied from Render V3.

## Run
From the repository's `docs` directory, serve with an HTTP server. This folder is intended to be placed at `docs/two-dimensions/V1`.
Open `/two-dimensions/V1/index.html`. Click Build Table, then Render Output.

Columns determine the number and order of cells in each row. Rows determine the number of body rows. Each body row is constructed by iterating over the columns and reading the matching property from that row.
