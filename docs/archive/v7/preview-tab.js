const params = new URLSearchParams(location.search);
const channel = new BroadcastChannel(params.get('channel') || 'keshavsoft-monaco-preview-v7');
function resolvePath(fromFile, reference) {
  const clean = String(reference || '').split(/[?#]/)[0];
  if (!clean || clean.startsWith('/') || /^[a-z]+:/i.test(clean) || clean.startsWith('//') || clean.startsWith('data:')) return null;
  const stack = fromFile.split('/').slice(0, -1);
  for (const part of clean.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') stack.pop();
    else stack.push(part);
  }
  return stack.join('/');
}

async function render(payload) {
  if (payload.type === 'NO_ENTRY') {
    document.body.textContent = payload.message;
    return;
  }
  const files = payload.files || {};
  const entry = payload.entry;
  const html = files[entry];
  if (typeof html !== 'string') return;

  const parsed = new DOMParser().parseFromString(html, 'text/html');
  document.title = parsed.title || `Preview — ${entry}`;
  document.head.querySelectorAll('[data-preview-asset]').forEach(node => node.remove());

  for (const link of [...parsed.querySelectorAll('link[rel="stylesheet"][href]')]) {
    const path = resolvePath(entry, link.getAttribute('href'));
    if (path && typeof files[path] === 'string') {
      const style = document.createElement('style');
      style.dataset.previewAsset = '1';
      style.textContent = files[path];
      link.replaceWith(style);
    }
  }
  for (const img of [...parsed.querySelectorAll('img[src]')]) {
    const path = resolvePath(entry, img.getAttribute('src'));
    if (path && typeof files[path] === 'string' && files[path].startsWith('data:')) img.src = files[path];
  }

  const scripts = [...parsed.querySelectorAll('script')];
  scripts.forEach(script => script.remove());
  const bodyNodes = [...parsed.body.childNodes].map(node => document.importNode(node, true));
  document.body.replaceChildren(...bodyNodes);
  for (const style of [...parsed.head.querySelectorAll('style')]) {
    const copy = document.createElement('style');
    copy.dataset.previewAsset = '1';
    copy.textContent = style.textContent;
    document.head.appendChild(copy);
  }
  for (const link of [...parsed.head.querySelectorAll('link[rel="stylesheet"]')]) {
    const href = link.getAttribute('href');
    const path = resolvePath(entry, href);
    if (path && typeof files[path] === 'string') {
      const style = document.createElement('style');
      style.dataset.previewAsset = '1';
      style.textContent = files[path];
      document.head.appendChild(style);
    } else if (href) {
      const copy = document.createElement('link');
      copy.rel = 'stylesheet';
      copy.href = href;
      copy.dataset.previewAsset = '1';
      document.head.appendChild(copy);
    }
  }

  // Run project scripts in this preview tab's document, without an iframe.
  for (const old of scripts) {
    const script = document.createElement('script');
    for (const attr of [...old.attributes]) {
      if (attr.name !== 'src') script.setAttribute(attr.name, attr.value);
    }
    const src = old.getAttribute('src');
    const path = src && resolvePath(entry, src);
    if (path && typeof files[path] === 'string') script.textContent = files[path];
    else if (src) script.src = src;
    else script.textContent = old.textContent;
    document.body.appendChild(script);
  }

  const badge = document.createElement('div');
  badge.id = 'previewStatus';
  badge.textContent = `Live preview · ${entry}`;
  badge.style.cssText = 'position:fixed;z-index:2147483647;left:10px;bottom:10px;padding:5px 9px;background:#111827cc;color:#fff;font:11px monospace;pointer-events:none';
  document.body.appendChild(badge);
}

channel.addEventListener('message', event => {
  if (event.data?.type === 'RENDER' || event.data?.type === 'NO_ENTRY') {
    render(event.data).catch(error => channel.postMessage({ type: 'PREVIEW_ERROR', error: error.message }));
  }
});
window.addEventListener('error', event => channel.postMessage({ type: 'PREVIEW_ERROR', error: event.message }));
channel.postMessage({ type: 'READY' });
