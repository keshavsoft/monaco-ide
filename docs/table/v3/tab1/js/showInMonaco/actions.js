import {
  $,
  getEditor,
  models,
  activeModel,
  setActiveModel,
  sendPayload
} from '../state.js';

export const actions = {
  switchModel: (event, matchElement) => {
    const currentEditor = getEditor();
    if (!currentEditor) return;
    models[activeModel] = currentEditor.getValue();
    const nextModel = matchElement.dataset.model;
    if (!nextModel) return;
    setActiveModel(nextModel);
    currentEditor.setValue(models[activeModel]);
    document.querySelectorAll('[data-model]').forEach((item) => {
      item.classList.toggle('active', item === matchElement);
    });
  },

  openTab2: () => {
    const url = new URL('../tab2/index.html', location.href);
    window.open(url.href, 'keshavsoft_table_tab2');
  },

  handleRequestData: (message) => {
    if (!message || message.type !== 'REQUEST_DATA') return;
    sendPayload(message.requestId);
  }
};

export default actions;
