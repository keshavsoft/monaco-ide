const CHANNEL_NAME = 'keshavsoft-table-v1';
const channel = new BroadcastChannel(CHANNEL_NAME);
const REQUEST_TIMEOUT_MS = 2500;
const $ = (id) => document.getElementById(id);
let requestId = null;
let timeoutHandle = null;
let suppliedPayload = null;
let activeModel = 'columns';

function setConnection(text, ready = false) {
  $('connection').textContent = text;
  $('connection').classList.toggle('ready', ready);
}

function showWaiting() {
  $('waiting').hidden = false;
  $('received').hidden = true;
  $('failure').hidden = true;
}

function requestData() {
  clearTimeout(timeoutHandle);
  requestId = crypto.randomUUID();
  suppliedPayload = null;
  showWaiting();
  setConnection('Requesting Tab 1…');
  channel.postMessage({ type: 'REQUEST_DATA', requestId, source: 'TAB2' });
  timeoutHandle = setTimeout(() => {
    if (suppliedPayload) return;
    $('waiting').hidden = true;
    $('failure').hidden = false;
    setConnection('Tab 1 not responding');
  }, REQUEST_TIMEOUT_MS);
}

function showPayload(model) {
  activeModel = model;
  $('payloadView').textContent = JSON.stringify(suppliedPayload[model], null, 2);
  document.querySelectorAll('[data-model]').forEach((button) => {
    button.classList.toggle('active', button.dataset.model === model);
  });
}

channel.onmessage = ({ data: message }) => {
  if (!message || message.requestId !== requestId) return;
  if (message.type === 'SUPPLY_ERROR') {
    clearTimeout(timeoutHandle);
    $('waiting').hidden = true;
    $('failure').hidden = false;
    $('failure').querySelector('p').textContent = message.message;
    setConnection('Tab 1 returned an error');
    return;
  }
  if (message.type !== 'SUPPLY_DATA') return;
  clearTimeout(timeoutHandle);
  suppliedPayload = message.payload;
  $('waiting').hidden = true;
  $('failure').hidden = true;
  $('received').hidden = false;
  $('receivedAt').textContent = `Received ${new Date(message.suppliedAt).toLocaleTimeString()}`;
  setConnection('Data received from Tab 1', true);
  showPayload('columns');
};

document.querySelectorAll('[data-model]').forEach((button) => {
  button.addEventListener('click', () => {
    if (suppliedPayload) showPayload(button.dataset.model);
  });
});
$('retry').addEventListener('click', requestData);
requestData();
