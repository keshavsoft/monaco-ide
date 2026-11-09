import {
  $,
  FILES,
  models,
  pretty,
  loadJSON,
  setStatus,
  channel,
  activeModel,
  setEditor
} from './state.js';
import { initBindings } from './showInMonaco/reader.js';

async function start() {
  const monaco = await new Promise((resolve, reject) => {
    require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs' } });
    require(['vs/editor/editor.main'], () => resolve(window.monaco), reject);
  });

  const entries = await Promise.all(
    Object.entries(FILES).map(async ([key, path]) => [key, await loadJSON(path)])
  );

  for (const [key, value] of entries) {
    models[key] = pretty(value);
  }

  const editorInstance = monaco.editor.create($('editor'), {
    value: models.columns,
    language: 'json',
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 14,
    tabSize: 2,
    scrollBeyondLastLine: false
  });

  setEditor(editorInstance);

  editorInstance.onDidChangeModelContent(() => {
    models[activeModel] = editorInstance.getValue();
    setStatus('Edited in memory. Tab 2 receives the current editor contents when it requests.');
  });

  initBindings(document.body);

  channel.onmessage = ({ data: message }) => {
    if (!message || message.type !== 'REQUEST_DATA') return;
    import('./showInMonaco/actions.js').then(({ default: actions }) => actions.handleRequestData(message));
  };

  $('openTab2').disabled = false;
  $('connection').textContent = 'Source ready · listening for Tab 2';
  $('connection').classList.add('ready');

  setStatus('Loaded 3 shared JSON files. Tab 1 is now listening.');
}

start().catch((error) => {
  $('connection').textContent = 'Source failed to load';
  setStatus(error.message, true);
  console.error(error);
});
