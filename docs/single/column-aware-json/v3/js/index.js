import { initMonaco } from './modules/monaco/index.js';
import { initColumns } from './modules/columns/index.js';
import { initSchema } from './modules/schema/index.js';
import { initSchemaBinding } from './modules/schemaBinding/index.js';
import { initEditor } from './modules/editor/index.js';
import { initValidation } from './modules/validation/index.js';
import { initControls } from './modules/controls/index.js';

async function boot() {
  const context = {};

  try {
    await initMonaco(context);
    await initColumns(context);
    await initSchema(context);
    await initSchemaBinding(context);
    await initEditor(context);
    await initValidation(context);
    await initControls(context);

    console.info('[Column-aware JSON V3] All modules initialized.');
  } catch (error) {
    console.error('[Column-aware JSON V3]', error);
    const status = document.getElementById('status');
    const message = document.getElementById('validationMessage');
    if (status) {
      status.textContent = 'Unable to start';
      status.classList.add('invalid');
    }
    if (message) message.textContent = error.message;
  }
}

boot();
