/**
 * V10 Storage & File System Manager
 * Manages IndexedDB for the Virtual Server and File System Access API
 */

const DB_NAME = 'v10-monaco-preview';
const DB_VERSION = 1;
const STORE_NAME = 'files';

export function openDatabase() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'path' });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error || new Error('Could not open IndexedDB'));
    });
}

export async function clearStorage() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function saveFileToVirtualServer(path, body, contentType) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put({
            path: cleanPath(path),
            body,
            contentType: contentType || guessMime(path),
            updatedAt: Date.now()
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function saveMultipleFilesToVirtualServer(fileRecords) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        for (const item of fileRecords) {
            store.put({
                path: cleanPath(item.path),
                body: item.body,
                contentType: item.contentType || guessMime(item.path),
                updatedAt: Date.now()
            });
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function readVirtualFile(path) {
    const db = await openDatabase();
    return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(cleanPath(path));
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
    });
}

export function cleanPath(path) {
    return String(path || '').replace(/\\/g, '/').replace(/^\/+/, '');
}

export function guessMime(path) {
    const ext = String(path).split('.').pop()?.toLowerCase();
    const map = {
        html: 'text/html; charset=utf-8',
        htm: 'text/html; charset=utf-8',
        css: 'text/css; charset=utf-8',
        js: 'text/javascript; charset=utf-8',
        mjs: 'text/javascript; charset=utf-8',
        json: 'application/json; charset=utf-8',
        svg: 'image/svg+xml',
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        webp: 'image/webp',
        ico: 'image/x-icon',
        txt: 'text/plain; charset=utf-8',
        xml: 'application/xml; charset=utf-8',
        wasm: 'application/wasm',
        woff: 'font/woff',
        woff2: 'font/woff2',
        ttf: 'font/ttf'
    };
    return map[ext] || 'application/octet-stream';
}

/**
 * Recursively read DirectoryHandle
 */
export async function scanDirectoryHandle(dirHandle, pathPrefix = '', onFileFound = null) {
    const files = [];
    const IGNORE_DIRS = new Set(['.git', 'node_modules', '.vscode', '.idea']);

    for await (const entry of dirHandle.values()) {
        const currentPath = pathPrefix ? `${pathPrefix}/${entry.name}` : entry.name;

        if (entry.kind === 'directory') {
            if (IGNORE_DIRS.has(entry.name)) continue;
            const subFiles = await scanDirectoryHandle(entry, currentPath, onFileFound);
            files.push(...subFiles);
        } else if (entry.kind === 'file') {
            const fileItem = {
                name: entry.name,
                path: currentPath,
                handle: entry
            };
            if (onFileFound) onFileFound(fileItem);
            files.push(fileItem);
        }
    }

    return files;
}

