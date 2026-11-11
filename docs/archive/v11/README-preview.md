# Monaco IDE V11 — Studio IDE with In-Browser Virtual Server

This is the complete, full-featured Monaco IDE Studio (copied from V9) powered by the **In-Browser Virtual Server** engine proven in V10.

---

### Features in V11

1. **Full Monaco Studio UI**:
   - Multi-document tab strip with dirty status indicators and isolated Monaco models.
   - Workspace directory tree explorer with native `showDirectoryPicker`.
   - Quick Open File Switcher (`Ctrl+P`) with fuzzy search across project files.
   - 22px Compact Status Bar (`Ln/Col`, `UTF-8`, `Spaces: 2`, Word Wrap toggle `Alt+Z`, Minimap toggle).
   - Direct Disk Save (`Ctrl+S`) via `FileSystemFileHandle.createWritable()`.
   - Code Formatter (`Shift+Alt+F`).
   - Side-by-side Split Live Preview (`Ctrl+\`).

2. **In-Browser Virtual Server (Full Preview)**:
   - When you click **Full Preview**, V11 writes the workspace files to `IndexedDB` (`v11-monaco-preview`).
   - Opens Tab 2 directly at `/docs/v11/virtual-server/${entryHtml}`.
   - The Service Worker (`workspace-preview-sw.js`) intercepts all HTTP requests under `/virtual-server/*` and serves HTML, CSS, JS, and images directly from browser memory.
   - Live editing in Monaco auto-syncs to the virtual server and live-reloads Tab 2 over `BroadcastChannel('v11-preview-channel')`.

---

### How to Run

1. Open your browser to:
   **[http://localhost:3000/docs/v11/](http://localhost:3000/docs/v11/)**
2. Click **Folder** and choose your local project (e.g. `spec-repo`).
3. Click any file to open it in Monaco tabs.
4. Click **Full Preview** in the top bar.
5. Tab 2 opens and displays your project live, served directly from your browser!
