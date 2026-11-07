/**
 * Chapter 4.1: 404 Not Found Page Generator
 * Builds a developer-friendly dark-themed directory listing when a requested file is missing.
 */

function generate404Response(relativePath, allKeys, requestUrl) {
    const listHtml = allKeys
        .map(k => `<li><a style="color:#38bdf8;text-decoration:none;" href="${new URL(k, requestUrl).href}">${k}</a></li>`)
        .join('');

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>404 — Virtual File Not Found (V13)</title>
  <style>
    body { background: #09090b; color: #f4f4f5; font-family: ui-monospace, monospace; padding: 32px; }
    h1 { color: #f87171; font-size: 20px; }
    code { background: #27272a; padding: 2px 6px; border-radius: 4px; color: #fbbf24; }
    ul { margin-top: 12px; line-height: 1.8; }
  </style>
</head>
<body>
  <h1>Virtual Server: File Not Found (V13)</h1>
  <p>Requested path: <code>${relativePath}</code></p>
  <p>Make sure this file exists in your opened folder in Monaco IDE Tab 1.</p>
  <hr style="border:0;border-top:1px solid #27272a;margin:20px 0;">
  <h3>Available files in this session (${allKeys.length}):</h3>
  <ul>${listHtml || '<li><em>No files loaded yet. Click "Folder" in Tab 1!</em></li>'}</ul>
</body>
</html>
    `.trim();

    return new Response(html, {
        status: 404,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store'
        }
    });
}

