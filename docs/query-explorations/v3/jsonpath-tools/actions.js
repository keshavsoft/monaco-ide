import { createActions } from '../assets/actions-core.js';
import config from './index.json' with { type: 'json' };

const actions = createActions(config);
export default actions;
