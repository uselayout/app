// Shared fallback image used when generateImage rejects, so the rendered
// variant never shows src="undefined" or a broken-image icon. Both the
// main pipeline and the JSX image resolver import this constant so the
// placeholder is consistent across entry points.
export const FALLBACK_SVG = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><rect fill="%23f3f4f6" width="800" height="450"/><text x="400" y="210" text-anchor="middle" fill="%239ca3af" font-family="system-ui,sans-serif" font-size="16">Image generation failed</text><text x="400" y="240" text-anchor="middle" fill="%23d1d5db" font-family="system-ui,sans-serif" font-size="13">Check GOOGLE_AI_API_KEY is configured</text></svg>'
)}`;
