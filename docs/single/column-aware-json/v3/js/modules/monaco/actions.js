export const actions = {
  load: ({ baseUrl }) => new Promise((resolve, reject) => {
    if (window.monaco?.editor) {
      resolve(window.monaco);
      return;
    }

    if (!window.require) {
      reject(new Error('Monaco AMD loader is missing. Check loader.min.js in index.html.'));
      return;
    }

    window.require.config({ paths: { vs: baseUrl } });
    window.require(['vs/editor/editor.main'], () => {
      if (window.monaco?.editor) resolve(window.monaco);
      else reject(new Error('Monaco editor loaded without its API.'));
    }, reject);
  })
};
