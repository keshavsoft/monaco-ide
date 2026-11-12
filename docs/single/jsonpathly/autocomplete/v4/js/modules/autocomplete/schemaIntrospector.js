/**
 * Introspects in-memory JSON data to suggest immediate child property keys for a partial JSONPath.
 */
export function introspectKeys(data, currentQuery = '') {
    if (!data || typeof data !== 'object') return [];

    const query = currentQuery.trim();
    if (!query || query === '$') {
        return Object.keys(data).slice(0, 20);
    }

    // Split by dots and array indices
    // e.g. "$.rawAst.loc." -> ["rawAst", "loc"]
    const clean = query.replace(/^\$\.?/, '');
    const segments = clean.split('.').filter(Boolean);

    // If query ends with a dot, we want children of the last segment
    // e.g. "rawAst.loc." -> traverse to data.rawAst.loc and list keys
    const endsWithDot = query.endsWith('.');
    const pathSegments = endsWithDot ? segments : segments.slice(0, -1);
    const filterPrefix = endsWithDot ? '' : segments[segments.length - 1] || '';

    let curr = data;
    for (const seg of pathSegments) {
        // Handle array index like body[0]
        const arrayMatch = seg.match(/^([^\[]+)\[(\d+)\]$/);
        if (arrayMatch) {
            const key = arrayMatch[1];
            const idx = parseInt(arrayMatch[2], 10);
            if (curr && curr[key] && Array.isArray(curr[key])) {
                curr = curr[key][idx];
            } else {
                return [];
            }
        } else {
            if (curr && typeof curr === 'object' && seg in curr) {
                curr = curr[seg];
            } else {
                return [];
            }
        }
    }

    if (!curr || typeof curr !== 'object') return [];

    let keys = [];
    if (Array.isArray(curr)) {
        if (curr.length > 0 && typeof curr[0] === 'object') {
            keys = ['[*]', '[0]', ...Object.keys(curr[0] || {})];
        } else {
            keys = ['[*]'];
        }
    } else {
        keys = Object.keys(curr);
    }

    if (filterPrefix) {
        keys = keys.filter(k => k.toLowerCase().startsWith(filterPrefix.toLowerCase()));
    }

    return keys.slice(0, 15);
}

export default introspectKeys;

