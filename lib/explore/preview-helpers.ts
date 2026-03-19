/**
 * Shared helpers for rendering React component previews in sandboxed iframes.
 * Used by VariantCard, ResponsivePreview, and ComparisonView.
 */

const PLACEHOLDER_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400' viewBox='0 0 800 400'%3E%3Crect fill='%23e5e7eb' width='800' height='400'/%3E%3Ctext x='400' y='200' text-anchor='middle' dy='.3em' fill='%239ca3af' font-family='system-ui' font-size='14'%3EImage placeholder%3C/text%3E%3C/svg%3E";

/**
 * Replace relative src paths (e.g. /marketing/hero.png) with a grey placeholder.
 * Prevents broken image icons in previews when AI generates fake paths.
 */
export function sanitizeRelativeSrc(code: string): string {
  return code.replace(/\bsrc=["'](\/[^"'\s>]+)["']/g, `src="${PLACEHOLDER_SVG}"`);
}

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
  // Embed transpiled JS as a JSON-encoded string literal. This safely handles
  // ALL special characters (quotes, backslashes, angle brackets, non-ASCII)
  // without base64/eval. Matches the proven approach used in TestPanel.
  //
  // The module code runs inside a dynamically created <script> element via
  // textContent (bypasses HTML parsing), with CJS shims prepended in the
  // SAME script so they share scope.
  const jsStr = JSON.stringify(js)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e");

  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="https://cdn.tailwindcss.com"></${"script"}>
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></${"script"}>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></${"script"}>
<style>body{margin:0;font-family:system-ui,sans-serif}a[href]{cursor:default}</style>
</head><body>
<div id="root"></div>
<script>
function showError(msg){
  var el=document.createElement('pre');
  el.style.cssText='color:red;padding:16px;font-size:12px;white-space:pre-wrap';
  el.textContent=String(msg);
  document.getElementById('root').appendChild(el);
}
window.onerror=function(msg,src,line,col,err){
  showError(err?err.stack||err.message:msg);
  return true;
};
window.addEventListener('load',function(){
  try{
    var moduleCode=${jsStr};
    var s=document.createElement('script');
    s.textContent=[
      'var _exp={};',
      'var _motionProxy=new Proxy({},{get:function(_,tag){return function(props){return React.createElement(tag,props)}}});',
      'var _framerShim={motion:_motionProxy,AnimatePresence:function(p){return React.createElement(React.Fragment,null,p.children)}};',
      'var _iconStub=function(p){return React.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",width:p&&p.size||24,height:p&&p.size||24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"},p))};',
      'var _lucideShim=new Proxy({},{get:function(){return _iconStub}});',
      'var require=function(n){return n==="react"?React:n==="react-dom"?ReactDOM:n==="react-dom/client"?ReactDOM:n==="framer-motion"?_framerShim:n==="lucide-react"?_lucideShim:{};};',
      'var exports=_exp,module={exports:_exp};',
      moduleCode,
      '(function(){',
      '  var C=_exp["default"]||_exp["${componentName}"]||_exp;',
      '  if(typeof C==="object"&&C.default)C=C.default;',
      '  if(typeof C!=="function"&&!(typeof C==="object"&&C)){showError("Component not found in module exports");return;}',
      '  ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(C));',
      '  document.addEventListener("click",function(e){var t=e.target;while(t&&t.tagName!=="A")t=t.parentElement;if(t)e.preventDefault();},true);',
      '})();'
    ].join('\\n');
    document.body.appendChild(s);
  }catch(e){
    showError(e.stack||e.message);
  }
});
</${"script"}>
</body></html>`;
}
