/**
 * Chapter 1.3: Virtual File Reader
 * Retrieves stored file records and lists available workspace paths from IndexedDB.
 */

async function getStoredFile(filePath) {
    const db = await openDatabase();
    return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(filePath);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
    });
}

async function getAllStoredPaths() {
    const db = await openDatabase();
    return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAllKeys();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
    });
}

