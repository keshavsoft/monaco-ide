/**
 * Chapter 4.2: Route Matcher & Path Normalizer
 * Identifies /virtual-server/* requests and normalizes relative resource paths.
 */

function getVirtualRoutePrefix() {
    return new URL('virtual-server/', self.registration.scope).pathname;
}

function isVirtualServerRequest(url) {
    const virtualRoutePrefix = getVirtualRoutePrefix();
    return url.origin === self.location.origin && url.pathname.startsWith(virtualRoutePrefix);
}

function normalizeVirtualPath(pathname) {
    const virtualRoutePrefix = getVirtualRoutePrefix();
    let relativePath = decodeURIComponent(pathname.slice(virtualRoutePrefix.length));

    if (!relativePath || relativePath.endsWith('/')) {
        relativePath += 'index.html';
    }

    return relativePath.replace(/^\/+/, '');
}

