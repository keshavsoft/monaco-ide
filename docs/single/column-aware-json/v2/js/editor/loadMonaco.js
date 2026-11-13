const MONACO_BASE = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/';

export function loadMonaco() {
  return new Promise((resolve, reject) => {
    if (!window.require) {
      reject(new Error('Monaco loader is unavailable.'));
      return;
    }

    window.require.config({ paths: { vs: `${MONACO_BASE}vs` } });
    window.require(['vs/editor/editor.main'], () => resolve(window.monaco), reject);
  });
}
