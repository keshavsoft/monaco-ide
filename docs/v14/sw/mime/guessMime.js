/**
 * Chapter 2: Content & MIME Type Negotiation
 * Maps file extensions to accurate MIME types and character encodings.
 */

const MIME_MAP = {
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
    ttf: 'font/ttf',
    eot: 'application/vnd.ms-fontobject',
    map: 'application/json; charset=utf-8'
};

function guessMimeType(path) {
    const ext = String(path).split('.').pop()?.toLowerCase();
    return MIME_MAP[ext] || 'application/octet-stream';
}

