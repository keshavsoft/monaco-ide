/**
 * Computes the normalized RFC 9535 JSONPath from root down to a given line number in JSON text.
 *
 * Strategy: scan every character up to (but NOT including brackets on) the target line.
 * We maintain a path stack. Each frame is:
 *   { type: 'object' | 'array', key: string | null, index: number }
 *
 * Key insight: a key like  "body": [   means the "[" belongs to key "body".
 * We capture the pending key BEFORE we push a bracket. When a "{" or "["
 * is encountered, whatever key was declared immediately before is attached
 * to that frame.
 *
 * We stop BEFORE processing any opening bracket on the target line —
 * we only want the path TO that node, not into it.
 *
 * We also skip characters inside string literals so that "{", "[", etc.
 * inside JSON string values are not misinterpreted as structure.
 */
export function resolveJsonPathAtLine(text, targetLine) {
    if (!text || targetLine < 1) return '$';

    const lines = text.split('\n');

    // Stack frames: { type:'object'|'array', key:string|null, index:number }
    const stack = [];

    // The key parsed from the most-recent "key": occurrence (not yet consumed by a bracket)
    let pendingKey = null;
    // Key parsed specifically on the clicked target line
    let targetLineKey = null;

    for (let i = 0; i < targetLine; i++) {
        const line = lines[i];
        if (line === undefined) break;
        const isTargetLine = (i === targetLine - 1);

        // Detect "key": pattern on this line (first quoted key followed by colon)
        const keyMatch = line.match(/^\s*"([^"\\]+)"\s*:/);
        if (keyMatch) {
            pendingKey = keyMatch[1];
            if (isTargetLine) targetLineKey = pendingKey;
        }

        for (let j = 0; j < line.length; j++) {
            const ch = line[j];

            // Skip over JSON string literals character-by-character
            if (ch === '"') {
                j++;
                while (j < line.length) {
                    if (line[j] === '\\') { j += 2; continue; } // escaped char
                    if (line[j] === '"') break;                  // end of string
                    j++;
                }
                continue;
            }

            if (ch === '{' || ch === '[') {
                // On the target line: an opening bracket means we are AT this container.
                // Don't descend into it — stop processing this line's brackets.
                if (isTargetLine) break;

                const keyForFrame = pendingKey;
                pendingKey = null; // consumed by this bracket
                if (ch === '{') {
                    stack.push({ type: 'object', key: keyForFrame, index: 0 });
                } else {
                    stack.push({ type: 'array', key: keyForFrame, index: 0 });
                }
            } else if (ch === '}' || ch === ']') {
                if (stack.length > 0) {
                    stack.pop();
                    pendingKey = null; // closing a container clears any dangling key
                }
            } else if (ch === ',') {
                // A top-level comma inside the current array advances the array index
                if (stack.length > 0 && stack[stack.length - 1].type === 'array') {
                    stack[stack.length - 1].index++;
                }
            }
        }
    }

    // Build the JSONPath string from the stack
    let path = '$';
    for (const frame of stack) {
        if (frame.key !== null) {
            // Bracket-notation for keys with special chars; dot-notation otherwise
            if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(frame.key)) {
                path += '.' + frame.key;
            } else {
                path += '["' + frame.key + '"]';
            }
        }
        if (frame.type === 'array') {
            path += '[' + frame.index + ']';
        }
    }

    // Append the key that was clicked if it is a plain property (not an opening bracket)
    if (targetLineKey) {
        const suffix = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(targetLineKey)
            ? '.' + targetLineKey
            : '["' + targetLineKey + '"]';
        if (!path.endsWith(suffix)) {
            path += suffix;
        }
    }

    return path;
}

export default resolveJsonPathAtLine;
