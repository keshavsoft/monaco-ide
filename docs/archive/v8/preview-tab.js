const params = new URLSearchParams(location.search);
const channel = new BroadcastChannel(params.get('channel') || 'keshavsoft-monaco-preview-v8');

async function render(payload) {
  if (payload.type === 'NO_ENTRY' || payload.type === 'PREVIEW_ERROR') {
    document.body.textContent = payload.message;
    if (payload.type === 'PREVIEW_ERROR') {
      channel.postMessage({ type: 'PREVIEW_ERROR', error: payload.message });
    }
    return;
  }

  const entryUrl = new URL(payload.entryUrl);
  if (entryUrl.origin !== location.origin) {
    throw new Error(`Workspace URL must use the preview origin (${location.origin}).`);
  }

  let html = payload.html;
  if (typeof html !== 'string') {
    const response = await fetch(entryUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Could not load ${entryUrl.href} (${response.status}).`);
    html = await response.text();
  }

  const parsed = new DOMParser().parseFromString(html, 'text/html');
  document.title = parsed.title || `Preview — ${payload.entry}`;
  document.documentElement.lang = parsed.documentElement.lang || 'en';
  document.documentElement.dir = parsed.documentElement.dir || '';
  document.body.className = parsed.body.className;

  document.head.querySelectorAll('[data-preview-runtime]').forEach(node => node.remove());
  const base = document.createElement('base');
  base.href = entryUrl.href;
  base.dataset.previewRuntime = '1';
  document.head.prepend(base);

  for (const importMap of [...parsed.querySelectorAll('script[type="importmap"]')]) {
    const copy = document.createElement('script');
    copy.type = 'importmap';
    copy.textContent = importMap.textContent;
    copy.dataset.previewRuntime = '1';
    document.head.appendChild(copy);
  }

  for (const asset of [...parsed.head.querySelectorAll('style, link[rel]')]) {
    const copy = asset.cloneNode(true);
    copy.dataset.previewRuntime = '1';
    document.head.appendChild(copy);
  }

  const scripts = [...parsed.querySelectorAll('script')].filter(script => script.type !== 'importmap');
  scripts.forEach(script => script.remove());
  const bodyNodes = [...parsed.body.childNodes].map(node => document.importNode(node, true));
  document.body.replaceChildren(...bodyNodes);

  for (const old of scripts) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      for (const attr of [...old.attributes]) script.setAttribute(attr.name, attr.value);
      script.dataset.previewRuntime = '1';

      const src = old.getAttribute('src');
      if (src) {
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Failed to load ${new URL(src, entryUrl).href}`));
        script.src = new URL(src, entryUrl).href;
      } else {
        script.textContent = old.textContent;
      }
      document.body.appendChild(script);
      if (!src) resolve();
    });
  }

  const badge = document.createElement('div');
  badge.id = 'previewStatus';
  badge.textContent = `Live preview · ${payload.entry}`;
  badge.style.cssText = 'position:fixed;z-index:2147483647;left:10px;bottom:10px;padding:5px 9px;background:#111827cc;color:#fff;font:11px monospace;pointer-events:none';
  document.body.appendChild(badge);
}

channel.addEventListener('message', event => {
  if (['RENDER', 'NO_ENTRY', 'PREVIEW_ERROR'].includes(event.data?.type)) {
    render(event.data).catch(error => channel.postMessage({ type: 'PREVIEW_ERROR', error: error.message }));
  }
});

window.addEventListener('error', event => {
  const failedUrl = event.target?.src || event.target?.href;
  const error = failedUrl ? `Failed to load ${failedUrl}` : event.message;
  channel.postMessage({ type: 'PREVIEW_ERROR', error });
}, true);

channel.postMessage({ type: 'READY' });
