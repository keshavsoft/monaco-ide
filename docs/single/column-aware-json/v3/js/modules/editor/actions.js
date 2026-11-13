export const actions = {
  create: ({ monaco, containerId, initialValue, options }) => {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Missing editor container #${containerId}`);

    const model = monaco.editor.createModel(
      initialValue,
      'json',
      monaco.Uri.parse('file:///column-aware-data.json')
    );

    const editor = monaco.editor.create(container, {
      ...options,
      model
    });

    editor.focus();
    editor.setPosition({ lineNumber: 1, column: 2 });
    return editor;
  }
};
