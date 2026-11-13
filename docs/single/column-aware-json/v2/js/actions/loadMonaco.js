export function loadMonaco({ loaderUrl, baseUrl }) {
  return new Promise((resolve, reject) => {
    const start = () => {
      if (!window.require) {
        reject(new Error('Monaco AMD loader did not initialize.'));
        return;
      }

      window.require.config({ paths: { vs: baseUrl } });
      window.require(['vs/editor/editor.main'], () => {
        if (!window.monaco) reject(new Error('Monaco failed to load.'));
        else resolve(window.monaco);
      }, reject);
    };

    if (window.require && window.monaco) {
      resolve(window.monaco);
      return;
    }

    const existing = document.querySelector('script[data-monaco-loader]');
    if (existing) {
      existing.addEventListener('load', start, { once: true });
      existing.addEventListener('error', () => reject(new Error('Monaco loader failed.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = loaderUrl;
    script.dataset.monacoLoader = 'true';
    script.onload = start;
    script.onerror = () => reject(new Error('Unable to download Monaco loader.'));
    document.head.append(script);
  });
}
