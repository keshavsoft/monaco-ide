# Monaco IDE V10 — In-Browser Virtual Server & Multi-Tab Controller

This prototype demonstrates **Tab 1 (IDE) controlling Tab 2 (Preview)** entirely on the client side with **zero backend**, suitable for GitHub Pages or local static hosting.

---

### How It Works

1. **Folder Selection (`showDirectoryPicker`)**:
   - Tab 1 accesses a local folder on your computer via the native browser File System Access API.
   - Files and directory trees are read into memory.
2. **In-Browser Virtual Server (`sw.js`)**:
   - Files are stored in client-side storage (`IndexedDB`).
   - A Service Worker (`sw.js`) intercepts all HTTP requests under `/virtual-server/*`.
   - Tab 2 can request `index.html`, `./css/style.css`, `./js/app.js`, and relative images — the Service Worker intercepts each request and serves the file directly from browser memory!
3. **Live Sync & Reload (`BroadcastChannel`)**:
   - When you edit code in Monaco Editor in Tab 1, it writes the changes to IndexedDB and broadcasts a `RELOAD` event.
   - Tab 2 instantly updates without touching any backend server.
4. **Direct Disk Persistence (`Ctrl+S`)**:
   - Clicking **Save** or pressing `Ctrl+S` writes the modified buffer directly back to the actual file on your computer via `FileSystemFileHandle.createWritable()`.

---

### Quick Test

1. Navigate to: [http://localhost:3000/docs/v10/](http://localhost:3000/docs/v10/)
2. Click **Folder** in the top bar.
3. Select any project folder on your computer (e.g. `spec-repo` or any web project).
4. Select the HTML file you want to view from the **Entry** dropdown (e.g. `docs/index.html`).
5. Click **Preview in New Tab**.
6. Tab 2 opens and displays the page completely served by Tab 1's Virtual Server!
7. Edit any text or HTML in Tab 1 — watch Tab 2 update live!

