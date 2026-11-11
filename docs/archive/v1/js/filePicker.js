function detectLanguage(fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'json':
            return 'json';
        case 'js':
        case 'mjs':
            return 'javascript';
        case 'ts':
            return 'typescript';
        case 'html':
        case 'htm':
            return 'html';
        case 'css':
            return 'css';
        case 'md':
            return 'markdown';
        case 'xml':
        case 'svg':
            return 'xml';
        default:
            return 'plaintext';
    }
}

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function initFilePicker(editor, monaco) {
    const btn = document.getElementById('selectFileBtn');
    const input = document.getElementById('fileInput');
    const nameEl = document.getElementById('fileName');
    const sizeEl = document.getElementById('fileSize');
    const iconEl = document.getElementById('fileIcon');

    if (!btn || !input) return;

    btn.addEventListener('click', () => {
        input.click();
    });

    input.addEventListener('change', async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const lang = detectLanguage(file.name);

            if (editor && monaco) {
                const model = editor.getModel();
                if (model) {
                    monaco.editor.setModelLanguage(model, lang);
                    model.setValue(text);
                } else {
                    const newModel = monaco.editor.createModel(text, lang);
                    editor.setModel(newModel);
                }
            }

            if (nameEl) nameEl.textContent = file.name;
            if (sizeEl) sizeEl.textContent = formatBytes(file.size);

            // Update icon according to language
            if (iconEl) {
                iconEl.className = lang === 'json'
                    ? 'bi bi-filetype-json text-warning'
                    : lang === 'javascript'
                        ? 'bi bi-filetype-js text-yellow-400'
                        : lang === 'html'
                            ? 'bi bi-filetype-html text-orange-400'
                            : lang === 'css'
                                ? 'bi bi-filetype-css text-blue-400'
                                : 'bi bi-file-earmark-code text-sky-400';
            }
        } catch (error) {
            console.error('Failed to read file:', error);
            alert(`Unable to open ${file.name}: ${error.message}`);
        } finally {
            // Reset input so re-selecting the same file fires change event
            input.value = '';
        }
    });
}

export default initFilePicker;

