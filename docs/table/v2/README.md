# Table V1 — Two-tab BroadcastChannel handshake

This is a new, isolated experiment under `docs/table/V1`. Existing render V1/V2/V3 files are not modified.

## Structure

- `tab1/`: source/supplier page. It fetches the three shared JSON files and keeps the current editor contents in memory.
- `tab2/`: consumer page. It does **not** fetch any shared JSON file. It requests a snapshot from Tab 1 over BroadcastChannel.
- `shared/`: source JSON files and common CSS.

## Run

Serve the repository's `docs` directory over HTTP (do not open the HTML files using `file://`).

For example, from the `monaco-ide` repository root:

```bash
npx http-server docs -p 8080
```

Then open:

`http://localhost:8080/table/V1/tab1/index.html`

Wait until Tab 1 says `Source ready`, then click **Open Tab 2**. Tab 2 requests data and displays the response. If Tab 1 is closed or not initialized, Tab 2 shows the unavailable message and offers Retry.

## Communication contract

Channel: `keshavsoft-table-v1`

- Request: `{ type: 'REQUEST_DATA', requestId, source: 'TAB2' }`
- Response: `{ type: 'SUPPLY_DATA', requestId, source: 'TAB1', payload, suppliedAt }`
- Error: `{ type: 'SUPPLY_ERROR', requestId, message }`

Tab 2 creates the request ID. Tab 1 echoes it so Tab 2 can match the response.

## Important behavior

BroadcastChannel is same-origin communication. Both tabs must be served with the same protocol, hostname and port. Messages are not queued for future tabs, so Tab 2 sends its request after installing its listener. A timeout detects the case where Tab 1 is not responding.

The three JSON files are fetched only by Tab 1. Tab 2 receives their parsed contents through the channel. Monaco is loaded from the CDN, so an internet connection is needed for the editor UI.
