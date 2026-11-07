/**
 * Chapter 3: Live Reload Middleware
 * Generates and injects the BroadcastChannel live-reload listener
 * and floating Monaco IDE V13 badge into HTML responses.
 */

const LIVE_RELOAD_SNIPPET = `
<!-- Monaco IDE V13 Live Reload Bridge -->
<script>
(() => {
  try {
    const bc = new BroadcastChannel('v13-preview-channel');
    bc.onmessage = (e) => {
      if (e.data && e.data.type === 'RELOAD') {
        console.log('[V13 Virtual Server] Live reload signal received, reloading...');
        location.reload();
      }
    };
    window.addEventListener('DOMContentLoaded', () => {
      const b = document.createElement('div');
      b.id = '__v13_badge';
      b.innerHTML = '⚡ <b>Monaco IDE V13</b> · ' + (location.pathname.split('/').filter(Boolean).pop() || 'index.html');
      b.style.cssText = 'position:fixed;bottom:10px;right:10px;background:#09090bee;color:#38bdf8;padding:5px 10px;border-radius:6px;font:11px monospace;z-index:2147483647;border:1px solid #0284c7;box-shadow:0 4px 12px rgba(0,0,0,0.6);pointer-events:none;';
      document.body.appendChild(b);
    });
  } catch(e) {}
})();
</script>
`;

function injectLiveReload(htmlText) {
    if (/<\/body>/i.test(htmlText)) {
        return htmlText.replace(/<\/body>/i, `${LIVE_RELOAD_SNIPPET}</body>`);
    }
    return htmlText + LIVE_RELOAD_SNIPPET;
}

