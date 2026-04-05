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
          rule.selectorText === 'html' ||
          rule.selectorText === 'body' ||
          rule.selectorText === ':host' ||
          rule.selectorText.includes('[data-theme]') ||
          rule.selectorText.includes('[data-mode]') ||
          rule.selectorText.includes('[data-color-scheme]') ||
          rule.selectorText.includes('[class*="dark"]') ||
          rule.selectorText === '.light' ||
          rule.selectorText === '.dark'
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
    button_primary: (() => {
      const candidates = document.querySelectorAll(
        'button:not([disabled]), a[class*="btn"], a[class*="button"], a[class*="cta"], [role="button"], [class*="btn-primary"], [class*="button-primary"]'
      );
      for (const el of candidates) {
        const excluded = el.closest(
          '[class*="cookie"], [class*="consent"], [class*="banner"], [id*="cookie"], [id*="consent"], dialog, [role="dialog"], nav, header'
        );
        if (!excluded) return el;
      }
      return candidates[0] || null;
    })(),
    button_secondary: document.querySelector('[class*="btn-secondary"], [class*="button-secondary"]'),
    input: document.querySelector('input[type="text"], input[type="email"]'),
    label: document.querySelector('label'),
    link: document.querySelector('a[href]:not([class*="nav"])'),
    card: document.querySelector('[class*="card"], [class*="Card"]'),
    checkbox: document.querySelector('input[type="checkbox"], [role="checkbox"]'),
    radio: document.querySelector('input[type="radio"], [role="radio"]'),
    toggle: document.querySelector('[class*="toggle"], [class*="switch"], [role="switch"]'),
    modal: document.querySelector('[class*="modal"], [class*="dialog"], dialog, [role="dialog"]'),
    tab: document.querySelector('[role="tab"], [class*="tab"]:not([class*="table"])'),
    badge: document.querySelector('[class*="badge"], [class*="pill"], [class*="tag"], [class*="chip"]'),
    tooltip: document.querySelector('[class*="tooltip"], [role="tooltip"]'),
    breadcrumb: document.querySelector('[class*="breadcrumb"], nav[aria-label*="breadcrumb"]'),
    code: document.querySelector('code, pre, [class*="code"]'),
    avatar: document.querySelector('[class*="avatar"], img[class*="profile"]'),
    dropdown: document.querySelector('[class*="dropdown"], [class*="select"], select'),
    alert: document.querySelector('[class*="alert"], [role="alert"], [class*="notification"]'),
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
        display: cs.display,
        flexDirection: cs.flexDirection,
        justifyContent: cs.justifyContent,
        alignItems: cs.alignItems,
        gap: cs.gap,
        margin: cs.margin,
        textAlign: cs.textAlign,
        textTransform: cs.textTransform,
        textDecoration: cs.textDecoration,
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

export const extractRadiusCensusScript = `() => {
  const selectors = [
    'button', 'a[href]', '[role="button"]',
    '[class*="btn"]', '[class*="button"]', '[class*="cta"]',
    '[class*="card"]', '[class*="Card"]',
    'input', 'select', 'textarea',
    '[class*="badge"]', '[class*="chip"]', '[class*="tag"]', '[class*="pill"]',
  ];
  const radiusMap = {};
  for (const sel of selectors) {
    try {
      const els = document.querySelectorAll(sel);
      for (const el of Array.from(els).slice(0, 20)) {
        const cs = getComputedStyle(el);
        const r = cs.borderRadius;
        if (r && r !== '0px') {
          if (!radiusMap[r]) radiusMap[r] = { count: 0, elements: [] };
          radiusMap[r].count++;
          if (radiusMap[r].elements.length < 3) {
            radiusMap[r].elements.push({
              tag: el.tagName.toLowerCase(),
              class: (el.className?.toString?.() || '').slice(0, 80),
              text: (el.textContent?.trim() || '').slice(0, 40),
            });
          }
        }
      }
    } catch(e) {}
  }
  return radiusMap;
}`;

export const extractInteractiveStatesScript = `() => {
  const stateSelectors = [':hover', ':focus', ':active', ':disabled', ':focus-visible'];
  const states = {};
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (!(rule instanceof CSSStyleRule)) continue;
        for (const pseudo of stateSelectors) {
          if (!rule.selectorText.includes(pseudo)) continue;
          const key = rule.selectorText;
          const props = {};
          for (let i = 0; i < rule.style.length; i++) {
            const prop = rule.style[i];
            const val = rule.style.getPropertyValue(prop);
            if (val) props[prop] = val;
          }
          if (Object.keys(props).length > 0) {
            states[key] = props;
          }
        }
      }
    } catch(e) {}
  }
  const entries = Object.entries(states).slice(0, 50);
  return Object.fromEntries(entries);
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
