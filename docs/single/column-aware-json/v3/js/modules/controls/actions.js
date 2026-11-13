let editorInstance = null;
let resetValue = '{}';

export const actions = {
  configure: ({ editor, value }) => {
    editorInstance = editor;
    resetValue = value;
  },

  reset: () => {
    if (!editorInstance) return;
    editorInstance.setValue(resetValue);
    editorInstance.focus();
    editorInstance.setPosition({ lineNumber: 1, column: 2 });
  }
};
