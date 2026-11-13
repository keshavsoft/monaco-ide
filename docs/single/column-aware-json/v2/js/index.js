import { runInstructions } from './runtime/runInstructions.js';

async function boot() {
  try {
    const response = await fetch('./instructions.json');
    if (!response.ok) throw new Error(`Cannot load instructions.json (${response.status})`);

    const instructions = await response.json();
    await runInstructions(instructions);
    console.info('[Column-aware JSON V2] Instruction sequence completed.');
  } catch (error) {
    console.error('[Column-aware JSON V2]', error);
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
