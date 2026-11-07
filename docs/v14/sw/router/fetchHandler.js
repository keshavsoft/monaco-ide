/**
 * Chapter 4.3: Master Fetch Handler & Response Assembler
 * Coordinates route resolution, storage lookup, live-reload injection, and HTTP responses.
 */

async function handleVirtualServerFetch(event) {
    const url = new URL(event.request.url);

    if (!isVirtualServerRequest(url)) {
        return; // Normal asset requests pass through
    }

    event.respondWith((async () => {
        const relativePath = normalizeVirtualPath(url.pathname);

        // 1. Exact match lookup in IndexedDB
        let fileRecord = await getStoredFile(relativePath);

        // 2. Directory fallback: check path/index.html
        if (!fileRecord && !relativePath.endsWith('.html') && !relativePath.includes('.')) {
            fileRecord = await getStoredFile(relativePath + '/index.html');
        }

        // 3. Not found -> Serve styled 404 with directory listing
        if (!fileRecord) {
            const allKeys = await getAllStoredPaths();
            return generate404Response(relativePath, allKeys, url.href);
        }

        // 4. Content negotiation & headers
        const mime = fileRecord.contentType || guessMimeType(relativePath);
        const headers = new Headers({
            'Content-Type': mime,
            'Cache-Control': 'no-store',
            'X-Served-By': 'Monaco-IDE-V13-Virtual-Server'
        });

        // 5. If HTML, decode body and inject live-reload bridge
        if (mime.includes('text/html')) {
            let htmlText = '';
            if (typeof fileRecord.body === 'string') {
                htmlText = fileRecord.body;
            } else if (fileRecord.body instanceof Blob) {
                htmlText = await fileRecord.body.text();
            } else if (fileRecord.body instanceof ArrayBuffer) {
                htmlText = new TextDecoder().decode(fileRecord.body);
            }

            const transformedHtml = injectLiveReload(htmlText);
            return new Response(transformedHtml, { status: 200, headers });
        }

        // 6. Non-HTML static assets (CSS, JS, images, wasm, fonts)
        return new Response(fileRecord.body, { status: 200, headers });
    })());
}

