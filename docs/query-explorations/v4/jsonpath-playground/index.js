import config from './index.json' with { type: 'json' };
import bindings from './bindings.json' with { type: 'json' };
import actions from './actions.js';
import { bindEvents } from 'https://keshavsoft.github.io/dom-primitive-bindings/dist/v7/min.js';

const byId = (id) => document.getElementById(id);

async function start() {
  document.title = `${config.name} — Query Explorations V4`;
  byId('lab-name').textContent = config.name;
  byId('eyebrow').textContent = config.eyebrow;
  byId('lab-description').textContent = config.description;
  byId('query').value = config.query;
  document.querySelectorAll('[data-feature]').forEach((element) => {
    element.classList.toggle('hidden', !config.features.includes(element.dataset.feature));
  });
  try {
    const response = await fetch(new URL('../shared/sample.json', import.meta.url));
    if (!response.ok) throw new Error(`Sample request failed: HTTP ${response.status}`);
    const sample = await response.json();
    actions.loadSample(sample);
    byId('status').textContent = 'Shared JSON loaded · valid';
    byId('status').className = 'status good';
  } catch (error) {
    byId('status').textContent = `JSON load failed: ${error.message}`;
    byId('status').className = 'status bad';
    byId('source').value = '';
  }
  bindEvents('app-container', bindings, actions);
}

start();
