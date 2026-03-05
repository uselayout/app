// All functions in this file are self-contained and run inside
// the browser context via Playwright's page.evaluate().
// They MUST NOT import anything external.

export const extractCSSVariablesScript = `() => {
  const vars = {};
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule instanceof CSSStyleRule && (
          rule.selectorText === ':root' ||
          rule.selectorText.includes('[data-theme]') ||
          rule.selectorText.includes('[class*="dark"]') ||
          rule.selectorText === 'html'
        )) {
          for (let i = 0; i < rule.style.length; i++) {
            const prop = rule.style[i];
            if (prop.startsWith('--')) {
              vars[prop] = rule.style.getPropertyValue(prop).trim();
            }
          }
        }
      }
    } catch(e) {}
  }
  return vars;
}`;

export const extractFontsScript = `() => {
  const fonts = [];
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule.constructor.name === 'CSSFontFaceRule') {
          fonts.push({
            family: rule.style.getPropertyValue('font-family').replace(/['"\`]/g, ''),
            src: rule.style.getPropertyValue('src'),
            weight: rule.style.getPropertyValue('font-weight') || 'normal',
            style: rule.style.getPropertyValue('font-style') || 'normal',
            display: rule.style.getPropertyValue('font-display') || 'auto',
          });
        }
      }
    } catch(e) {}
  }
  return fonts;
}`;

export const extractComputedStylesScript = `() => {
  const targets = {
    h1: document.querySelector('h1'),
    h2: document.querySelector('h2'),
    h3: document.querySelector('h3'),
    body: document.querySelector('p, [class*="body"]'),
    button_primary: document.querySelector('button:not([disabled]), [class*="btn-primary"], [class*="button-primary"]'),
    button_secondary: document.querySelector('[class*="btn-secondary"], [class*="button-secondary"]'),
    input: document.querySelector('input[type="text"], input[type="email"]'),
    label: document.querySelector('label'),
    link: document.querySelector('a[href]:not([class*="nav"])'),
    card: document.querySelector('[class*="card"], [class*="Card"]'),
  };
  const results = {};
  for (const [name, el] of Object.entries(targets)) {
    if (el) {
      const cs = getComputedStyle(el);
      results[name] = {
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        letterSpacing: cs.letterSpacing,
        color: cs.color,
        backgroundColor: cs.backgroundColor,
        borderRadius: cs.borderRadius,
        padding: cs.padding,
        border: cs.border,
        boxShadow: cs.boxShadow,
        transition: cs.transition,
      };
    }
  }
  return results;
}`;

export const extractAnimationsScript = `() => {
  const animations = [];
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule.constructor.name === 'CSSKeyframesRule') {
          animations.push({
            name: rule.name,
            cssText: rule.cssText.substring(0, 500)
          });
        }
      }
    } catch(e) {}
  }
  return animations;
}`;

export const extractBreakpointsScript = `() => {
  const breakpoints = new Set();
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule.constructor.name === 'CSSMediaRule' && rule.conditionText) {
          const matches = rule.conditionText.match(/\\d+px/g);
          if (matches) matches.forEach(bp => breakpoints.add(bp));
        }
      }
    } catch(e) {}
  }
  return [...breakpoints].sort((a, b) => parseInt(a) - parseInt(b));
}`;

export const detectLibrariesScript = `() => ({
  tailwind: !!document.querySelector('[class*="text-"]') && !!document.querySelector('[class*="bg-"]'),
  bootstrap: !!document.querySelector('[class*="col-md-"], [class*="container"]'),
  materialUI: !!document.querySelector('[class*="MuiButton"], [class*="makeStyles"]'),
  shadcn: !!document.querySelector('[data-radix-popper-content-wrapper]'),
  radix: !!document.querySelector('[data-radix-]'),
  framerMotion: !!document.querySelector('[data-framer-]'),
  lucide: !!document.querySelector('svg[class*="lucide"]'),
  heroicons: !!document.querySelector('svg[data-slot="icon"]'),
  nextJs: !!(window.__NEXT_DATA__ || document.getElementById('__NEXT_DATA__')),
})`;
