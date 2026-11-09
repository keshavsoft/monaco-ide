import jsonToDom from './js/lib/json-to-dom.min.js';
const channel = new BroadcastChannel('keshavsoft-two-dimensions-v1');
channel.onmessage = ({ data }) => {
    if (data?.type !== 'RENDER_OUTPUT') return;

    const app = document.getElementById('app');
    app.replaceChildren();

    const staging = document.createElement('div');
    staging.id = 'staging';
    document.body.append(staging);

    try {
        const render = window.ks?.jsonToDom?.appendToDom || jsonToDom;
        render({ jsonSpec: data.spec, targetHtmlId: 'staging' });
        const element = staging.firstElementChild;
        if (!element) throw Error('Renderer produced no element'); app.replaceChildren(element);
    } catch (error) {
        app.textContent = error.message;
    } finally {
        staging.remove();
    }
};