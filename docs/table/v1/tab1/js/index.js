const CHANNEL_NAME = 'keshavsoft-table-v1';
const channel = new BroadcastChannel(CHANNEL_NAME);
const FILES = {
  columns: '../shared/columns.json',
  tables: '../shared/tables.json',
  options: '../shared/options.json'
};
const models = {};
let activeModel = 'columns';
let editor;
const $ = (id) => document.getElementById(id);
const pretty = (value) => JSON.stringify(value, null, 2) + '\n';

function setStatus(message, isError = false) {
  $('status').textContent = message;
  $('status').classList.toggle('error', isError);
}

async function loadJSON(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Cannot load ${path} (${response.status})`);
  return response.json();
}

function currentPayload() {
  if (editor) models[activeModel] = editor.getValue();
  const payload = {};
  for (const key of Object.keys(FILES)) {
    try { payload[key] = JSON.parse(models[key]); }
    catch (error) { throw new Error(`${key}.json has invalid JSON: ${error.message}`); }
  }
  return payload;
}

function sendPayload(requestId) {
  try {
    const payload = currentPayload();
    channel.postMessage({
      type: 'SUPPLY_DATA',
      requestId,
      source: 'TAB1',
      payload,
      suppliedAt: Date.now()
    });
    $('connection').textContent = 'Tab 1 is supplying data';
    $('connection').classList.add('ready');
    setStatus('Responded to Tab 2 request.');
  } catch (error) {
    channel.postMessage({ type: 'SUPPLY_ERROR', requestId, message: error.message });
    setStatus(error.message, true);
  }
}

async function start() {
  const monaco = await new Promise((resolve, reject) => {
    require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs' } });
    require(['vs/editor/editor.main'], () => resolve(window.monaco), reject);
  });

  const entries = await Promise.all(Object.entries(FILES).map(async ([key, path]) => [key, await loadJSON(path)]));
  for (const [key, value] of entries) models[key] = pretty(value);

  editor = monaco.editor.create($('editor'), {
    value: models.columns, language: 'json', theme: 'vs-dark',
    automaticLayout: true, minimap: { enabled: false }, fontSize: 14,
    tabSize: 2, scrollBeyondLastLine: false
  });
  editor.onDidChangeModelContent(() => {
    models[activeModel] = editor.getValue();
    setStatus('Edited in memory. Tab 2 receives the current editor contents when it requests.');
  });

  document.querySelectorAll('[data-model]').forEach((button) => {
    button.addEventListener('click', () => {
      models[activeModel] = editor.getValue();
      activeModel = button.dataset.model;
      editor.setValue(models[activeModel]);
      $('fileName').textContent = `${activeModel}.json`;
      document.querySelectorAll('[data-model]').forEach((item) => item.classList.toggle('active', item === button));
    });
  });

  channel.onmessage = ({ data: message }) => {
    if (!message || message.type !== 'REQUEST_DATA') return;
    sendPayload(message.requestId);
  };

  $('openTab2').disabled = false;
  $('connection').textContent = 'Source ready · listening for Tab 2';
  $('connection').classList.add('ready');
  $('openTab2').addEventListener('click', () => {
    const url = new URL('../tab2/index.html', location.href);
    window.open(url.href, 'keshavsoft_table_tab2');
  });
  setStatus('Loaded 3 shared JSON files. Tab 1 is now listening.');
}

start().catch((error) => {
  $('connection').textContent = 'Source failed to load';
  setStatus(error.message, true);
  console.error(error);
});
