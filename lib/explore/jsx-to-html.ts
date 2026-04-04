/**
 * Lightweight JSX-to-HTML converter for streaming preview.
 * Converts React JSX to browser-renderable HTML so we can show a live
 * preview in an iframe while the variant is still generating.
 *
 * This does NOT need to be perfect — it's a temporary preview that gets
 * replaced by the properly transpiled React render once complete.
 */

/**
 * Extract the JSX return body from a React component function.
 * Strips the function wrapper, imports, and variable declarations.
 */
function extractReturnBody(jsx: string): string {
  // Find the return statement and extract its JSX
  // Handle: return ( ... ) and return <...>
  const returnMatch = jsx.match(/return\s*\(\s*([\s\S]*)\)\s*;?\s*\}?\s*$/);
  if (returnMatch) {
    // Trim trailing closing braces from the component function
    let body = returnMatch[1].trim();
    // Remove trailing }); or } that belong to the function wrapper
    body = body.replace(/\}\s*;?\s*$/, "").trim();
    // If we stripped too much (body no longer closes), return as-is
    if (body) return body;
  }

  // Fallback: try to find return <...
  const simpleReturn = jsx.match(/return\s+(<[\s\S]*)/);
  if (simpleReturn) {
    return simpleReturn[1].trim().replace(/\}\s*;?\s*$/, "").trim();
  }

  // Last resort: find the first top-level JSX element
  const firstElement = jsx.match(/(<[a-zA-Z][\s\S]*)/);
  return firstElement?.[1] ?? jsx;
}

/**
 * Convert JSX string to HTML that can be rendered in a browser with Tailwind.
 */
export function jsxToHtml(jsx: string): string {
  if (!jsx.trim()) return "";

  let html = extractReturnBody(jsx);

  // Replace JSX attributes with HTML equivalents
  html = html.replace(/\bclassName=/g, "class=");
  html = html.replace(/\bhtmlFor=/g, "for=");

  // Remove JSX comments
  html = html.replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

  // Remove event handlers: onClick={...}, onChange={...}, onSubmit={...}, etc.
  // Handles nested braces up to 2 levels deep
  html = html.replace(/\bon[A-Z]\w*=\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g, "");

  // Remove React-specific props (key, ref, dangerously* attrs)
  html = html.replace(/\bkey=\{[^}]*\}/g, "");
  html = html.replace(/\bkey="[^"]*"/g, "");
  html = html.replace(/\bref=\{[^}]*\}/g, "");
  html = html.replace(/\bdangerously\w+=\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g, "");

  // Convert string expressions {"text"} and {'text'} to plain text
  html = html.replace(/\{"([^"]*)"\}/g, "$1");
  html = html.replace(/\{'([^']*)'\}/g, "$1");

  // Convert template literals {`text`} to plain text
  html = html.replace(/\{`([^`]*)`\}/g, "$1");

  // Remove style objects (too complex to convert reliably)
  html = html.replace(/\bstyle=\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g, "");

  // Remove remaining JSX expressions {variable}, {func()}, etc.
  html = html.replace(/\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g, "");

  // Convert JSX self-closing tags to HTML (for non-void elements)
  // void elements (img, br, hr, input, etc.) are already valid self-closing
  const voidElements = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i;
  html = html.replace(/<(\w+)(\s[^>]*?)?\s*\/>/g, (match, tag, attrs) => {
    if (voidElements.test(tag)) return match; // keep as self-closing
    return `<${tag}${attrs || ""}></${tag}>`;
  });

  // Clean up data-generate-image attributes — replace with placeholder
  html = html.replace(
    /<img([^>]*?)data-generate-image="[^"]*"([^>]*?)(?:\/?>)/g,
    '<img$1$2 src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'300\'%3E%3Crect fill=\'%23e5e7eb\' width=\'400\' height=\'300\'/%3E%3C/svg%3E" />'
  );

  // Remove empty attribute slots left over from removals
  html = html.replace(/\s{2,}/g, " ");

  return html;
}
