/**
 * Shared helpers for rendering React component previews in sandboxed iframes.
 * Used by VariantCard, ResponsivePreview, and ComparisonView.
 */

export function extractComponentName(code: string): string {
  const defaultExport = code.match(/export\s+default\s+function\s+(\w+)/);
  if (defaultExport) return defaultExport[1];

  const preferred = ["Demo", "App", "Page", "Variant"];
  for (const name of preferred) {
    if (code.includes(`function ${name}`)) return name;
  }

  const lastFn = [...code.matchAll(/function\s+(\w+)/g)].pop();
  return lastFn?.[1] ?? "App";
}

export function buildSrcdoc(js: string, componentName: string): string {
  const escaped = JSON.stringify(js)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e");

  return [
    "<!DOCTYPE html>",
    "<html><head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<script src="https://cdn.tailwindcss.com"></' + "script>",
    '<script src="https://unpkg.com/react@18/umd/react.production.min.js"></' + "script>",
    '<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></' + "script>",
    "<style>body{margin:0;font-family:system-ui,sans-serif}</style>",
    "</head><body>",
    '<div id="root"></div>',
    "<script>",
    "window.onerror=function(msg){",
    "  var el=document.createElement('pre');",
    "  el.style.cssText='color:red;padding:16px;font-size:12px';",
    "  el.textContent=String(msg);",
    "  document.getElementById('root').appendChild(el);",
    "};",
    "try{",
    "  var exports={};var module={exports:exports};",
    "  function require(n){if(n==='react')return React;if(n==='react-dom')return ReactDOM;if(n==='react-dom/client')return ReactDOM;return {}}",
    "  var s=document.createElement('script');",
    "  s.textContent='var exports={};var module={exports:exports};function require(n){if(n===\"react\")return React;if(n===\"react-dom\")return ReactDOM;if(n===\"react-dom/client\")return ReactDOM;return {}};'+",
    "  " + escaped + ";",
    "  document.head.appendChild(s);",
    `  var C=module.exports.default||module.exports['${componentName}']||module.exports;`,
    "  if(typeof C==='object'&&C.default)C=C.default;",
    "  ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(C));",
    "}catch(e){",
    "  var el=document.createElement('pre');",
    "  el.style.cssText='color:red;padding:16px;font-size:12px';",
    "  el.textContent=e.message;",
    "  document.getElementById('root').appendChild(el);",
    "}",
    "</" + "script>",
    "</body></html>",
  ].join("\n");
}
