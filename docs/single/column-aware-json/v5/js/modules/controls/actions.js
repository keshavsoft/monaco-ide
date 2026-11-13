import { actions as columnActions } from '../columns/actions.js';
import { actions as schemaActions } from '../schema/actions.js';
import { actions as bindingActions } from '../schemaBinding/actions.js';
let app = null;
function message(text, loaded = false) {
  const status = document.getElementById('intelligenceStatus');
  status.textContent = loaded ? 'Intelligence loaded' : 'Intelligence not loaded';
  status.className = loaded ? 'status active' : 'status inactive';
  document.getElementById('message').textContent = text;
}
export const actions = {
  configure: ({ monaco, editors, initialColumns }) => { app = { monaco, ...editors, initialColumns }; bindingActions.clear({ monaco }); message('All three editors are ready. Load intelligence, then pull it back.'); },
  loadIntelligence: () => {
    try { const columns = columnActions.read({ editor: app.columnsEditor }); const schema = schemaActions.create({ columns }); bindingActions.register({ monaco: app.monaco, schema });
      app.dataEditor.focus(); message(`Loaded ${columns.length} column definitions. Try Ctrl+Space in the data editor.`, true);
    } catch (error) { message(error.message); }
  },
  pullSchemaBack: () => { if (!app) return; const result = bindingActions.pull({ monaco: app.monaco, editor: app.returnedEditor }); message(result.found ? 'Registered schema configuration retrieved from Monaco.' : result.message, result.found); },
  reset: () => { if (!app) return; app.columnsEditor.setValue(JSON.stringify(app.initialColumns, null, 2)); app.dataEditor.setValue('{}'); app.returnedEditor.setValue('{}'); bindingActions.clear({ monaco: app.monaco }); message('Reset complete. No column schema is registered.'); }
};
