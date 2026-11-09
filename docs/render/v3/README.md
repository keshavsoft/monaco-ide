# Monaco IDE Render V3

V3 extends V2 without changing its architecture. `index.html` is a full-width Monaco editor. `render.html` opens in a separate browser tab and uses the V2 JSON-to-DOM engine. No embedded preview or iframe. Base, Columns and Template load at startup; Build creates Output. Render Base opens the renderer tab; Render Output updates the existing #PR element in that same tab. V2 BroadcastChannel and localStorage identifiers are retained.
