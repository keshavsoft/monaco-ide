/**
 * Chapter 1.2: Virtual Disk Connection
 * Opens and initializes the IndexedDB instance in the Service Worker.
 */

function openDatabase() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'path' });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error || new Error('Could not open IndexedDB in Service Worker'));
    });
}

