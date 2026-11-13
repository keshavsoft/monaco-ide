# Column-aware JSON Editor — V1

A focused proof of concept for using an existing column collection as the single source of truth for constructing one JSON object in Monaco.

## Run

Serve the repository root over HTTP (for example, `npx serve .`) and open:

`docs/single/column-aware-json/v1/`

Monaco is loaded from the existing CDN pattern used elsewhere in this repository. No additional npm dependency is required.

## V1 behavior

- The data document starts as `{}` — there is no outer array.
- The three column definitions are `col1:string`, `col2:number`, and `col3:boolean`.
- Those definitions are converted into a JSON Schema at startup.
- Monaco's built-in JSON language service uses that schema for property completion and validation.
- Unknown properties and values of the wrong type are reported as errors.
- The schema marks all three properties as required and disallows properties outside the column collection.

## Deliberate scope

This version tests the smallest useful story: a single object guided by a column contract. It does not implement nested objects, arrays, data distribution, JSONPath, or custom completion code. The JSON language service is already included with Monaco's JSON language support, so no separate `vscode-json-languageservice` installation is needed for this proof.
