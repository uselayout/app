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
  // Encode the transpiled JS as base64 to avoid HTML/JS parsing issues
  // when embedding in an inline script. This eliminates problems with
  // special characters (colons, angle brackets, template literals, etc.)
  // breaking the script.textContent / appendChild approach.
  //
  // Safety: This runs inside a sandboxed iframe (sandbox="allow-scripts")
  // with content we transpiled ourselves. We use indirect eval (0,eval)()
  // to run the decoded JS in the same scope as the CJS shims (module,
  // exports, require) — appendChild would create a separate scope.
  const base64 = typeof btoa === "function"
    ? btoa(unescape(encodeURIComponent(js)))
    : Buffer.from(js, "utf-8").toString("base64");

  return [
    "<!DOCTYPE html>",
    "<html><head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<script src="https://cdn.tailwindcss.com"></' + "script>",
    '<script src="https://unpkg.com/react@18/umd/react.production.min.js"></' + "script>",
    '<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></' + "script>",
    "<style>body{margin:0;font-family:system-ui,sans-serif}a[href]{cursor:default}</style>",
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
    // Decode and eval in the same scope so module/exports/require shims are visible
    `  (0,eval)(atob("${base64}"));`,
    `  var C=module.exports.default||module.exports['${componentName}']||module.exports;`,
    "  if(typeof C==='object'&&C.default)C=C.default;",
    "  if(typeof C!=='function'&&!(typeof C==='object'&&C)){throw new Error('Component not found in module exports');}",
    "  ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(C));",
    "  document.addEventListener('click',function(e){var t=e.target;while(t&&t.tagName!=='A')t=t.parentElement;if(t)e.preventDefault();},true);",
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
