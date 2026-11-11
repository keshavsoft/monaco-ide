# Monaco IDE V8 — static workspace preview

Start the local server from the `monaco-ide` folder:

```powershell
npm run dev:v8
```

Open `http://127.0.0.1:3001/docs/v8/`. The server mounts the sibling `spec-repo` folder at `/workspace/`, so V8 can load its HTML, CSS, JavaScript, and other relative assets from their real URLs.

By default, V8 uses `http://127.0.0.1:3001/workspace/` as the static workspace URL. Use the link icon beside **Full Preview** to change that base URL. The configured URL must use the same origin as V8 so the preview tab can keep communicating through `BroadcastChannel`.

The active HTML model is sent from Monaco, including unsaved edits. Linked CSS, scripts, and other assets load from the static workspace server, so save those files before expecting their changes in the preview.

To mount another folder, set `PREVIEW_WORKSPACE_ROOT` before starting the server. To use a different port, set `PORT`.
