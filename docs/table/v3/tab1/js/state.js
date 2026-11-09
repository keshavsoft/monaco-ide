export const CHANNEL_NAME = 'keshavsoft-table-v1';
export const channel = new BroadcastChannel(CHANNEL_NAME);

export const FILES = {
  columns: '../shared/columns.json',
  tables: '../shared/tables.json',
  options: '../shared/options.json'
};

export const models = {};
export let activeModel = 'columns';
export let editor;

export function setEditor(instance) {
  editor = instance;
}

export function getEditor() {
  return editor;
}

export const $ = (id) => document.getElementById(id);
export const pretty = (value) => JSON.stringify(value, null, 2) + '\n';

export function setStatus(message, isError = false) {
  $('status').textContent = message;
  $('status').classList.toggle('error', isError);
}

export async function loadJSON(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Cannot load ${path} (${response.status})`);
  return response.json();
}

export function currentPayload() {
  if (editor) models[activeModel] = editor.getValue();
  const payload = {};
  for (const key of Object.keys(FILES)) {
    try {
      payload[key] = JSON.parse(models[key]);
    } catch (error) {
      throw new Error(`${key}.json has invalid JSON: ${error.message}`);
    }
  }
  return payload;
}

export function sendPayload(requestId) {
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

export function setActiveModel(modelName) {
  activeModel = modelName;
  $('fileName').textContent = `${activeModel}.json`;
}
