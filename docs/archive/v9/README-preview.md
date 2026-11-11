# Monaco IDE V9 preview

1. In VS Code, open a terminal in the `monaco-ide` folder and run:

   ```powershell
   npx serve
   ```

2. Open the local address it prints, followed by `/docs/v9/` (for example, `http://localhost:3000/docs/v9/`).
3. In V9, click **Folder** and choose the project you want to view.
4. Click **Full Preview**. V9 shares the selected folder's files with the new preview tab in the browser. Its HTML, relative stylesheets, scripts, images, and other files are loaded from that shared copy. Edits in open Monaco tabs update the preview.

You only need to serve the Monaco IDE folder. You do not need to start a second server for the folder you select.
