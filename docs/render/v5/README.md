# Monaco IDE Render V5 — Pure Output Live Renderer

V5 streamlines the decoupled two-tab live renderer to focus strictly on the `output.json` specification:

- **Tab 1 (Supplier - `tab1/`)**: Pure Monaco IDE loaded with `output.json`. Single output tab, syntax highlighted, editable, beams live JSON specification to Tab 2 via `BroadcastChannel('keshavsoft-render-v5')`.
- **Tab 2 (Consumer - `tab2/`)**: Isolated canvas with zero header/footer noise. Pre-loaded with Bootstrap 5.3 & Tailwind CSS, directly mounts the JSON spec into `<body id="app">` using the standalone `jsonToDom` engine.
- **Strict Isolation**: No shared scripts or files between `tab1/` and `tab2/`. The browser communication bus is the only interface.
