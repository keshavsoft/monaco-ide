/**
 * Computes the normalized RFC 9535 JSONPath from root down to a given line number in JSON text.
 */
export function resolveJsonPathAtLine(text, targetLine) {
    if (!text || targetLine < 1) return '$';
    const lines = text.split('\n').slice(0, targetLine);
    const stack = [];

    let targetKey = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isTarget = (i === targetLine - 1);

        const keyMatch = line.match(/"([^"\\]+)"\s*:/);
        const currentKey = keyMatch ? keyMatch[1] : null;
        if (isTarget && currentKey) {
            targetKey = currentKey;
        }

        for (let j = 0; j < line.length; j++) {
            const ch = line[j];
            if (ch === '{') {
                stack.push({ type: 'object', key: currentKey });
            } else if (ch === '[') {
                stack.push({ type: 'array', key: currentKey, index: 0 });
            } else if (ch === '}') {
                if (stack.length > 0 && stack[stack.length - 1].type === 'object') {
                    stack.pop();
                }
            } else if (ch === ']') {
                if (stack.length > 0 && stack[stack.length - 1].type === 'array') {
                    stack.pop();
                }
            } else if (ch === ',') {
                if (stack.length > 0 && stack[stack.length - 1].type === 'array') {
                    stack[stack.length - 1].index++;
                }
            }
        }
    }

    // Assemble path
    const parts = ['$'];
    for (const item of stack) {
        if (item.key && parts[parts.length - 1] !== item.key) {
            parts.push(item.key);
        }
        if (item.type === 'array' && typeof item.index === 'number') {
            parts.push(`[${item.index}]`);
        }
    }

    if (targetKey && parts[parts.length - 1] !== targetKey) {
        parts.push(targetKey);
    }

    let resultPath = '$';
    for (let k = 1; k < parts.length; k++) {
        const p = parts[k];
        if (p.startsWith('[')) {
            resultPath += p;
        } else {
            resultPath += '.' + p;
        }
    }

    return resultPath;
}

export default resolveJsonPathAtLine;

