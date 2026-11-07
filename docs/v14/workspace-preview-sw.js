/**
 * Monaco IDE V13 - Virtual Server Service Worker
 * ===============================================
 * An in-browser HTTP server powered by IndexedDB & Service Worker Fetch Interception.
 * Intercepts requests to /docs/v13/virtual-server/* and serves local workspace files.
 *
 * The Virtual Server Story (Modular Chapters):
 * --------------------------------------------
 * 1. Storage & Virtual Disk:
 *    - ./sw/storage/config.js       -> DB & Channel constants (v13-monaco-preview)
 *    - ./sw/storage/db.js           -> IndexedDB connection initializer
 *    - ./sw/storage/fileReader.js   -> File record lookup & path indexing
 *
 * 2. Content & MIME Negotiation:
 *    - ./sw/mime/guessMime.js       -> Accurate MIME-types & UTF-8 charsets
 *
 * 3. Live Reload Middleware:
 *    - ./sw/middleware/liveReloadBridge.js -> BroadcastChannel bridge & badge injection
 *
 * 4. Request Router & Handlers:
 *    - ./sw/router/notFoundHandler.js      -> Dark-themed 404 directory listing
 *    - ./sw/router/routeMatcher.js          -> Path normalization & route matching
 *    - ./sw/router/fetchHandler.js          -> Request coordinator & response builder
 *
 * 5. Daemon Lifecycle:
 *    - ./sw/lifecycle.js            -> install, activate, claim & fetch binding
 */

// Chapter 1: Storage & Virtual Disk
importScripts('./sw/storage/config.js');
importScripts('./sw/storage/db.js');
importScripts('./sw/storage/fileReader.js');

// Chapter 2: Content & MIME Negotiation
importScripts('./sw/mime/guessMime.js');

// Chapter 3: Live Reload Middleware
importScripts('./sw/middleware/liveReloadBridge.js');

// Chapter 4: Request Router & Response Engine
importScripts('./sw/router/notFoundHandler.js');
importScripts('./sw/router/routeMatcher.js');
importScripts('./sw/router/fetchHandler.js');

// Chapter 5: Daemon Lifecycle
importScripts('./sw/lifecycle.js');
