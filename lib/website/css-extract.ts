// All functions in this file are self-contained and run inside
// the browser context via Playwright's page.evaluate().
// They MUST NOT import anything external.

/** Returns { flat: Record<string, string>, moded: Array<{ name, value, mode, selector }> } */
export const extractCSSVariablesScript = `() => {
  const flat = {};
  const moded = [];

  function classifyMode(selector) {
    const s = selector.toLowerCase();
    if (s.includes('[data-theme="dark"]') || s.includes('[data-mode="dark"]') ||
        s.includes('[data-color-scheme="dark"]') || s === '.dark' ||
        s.includes('[class*="dark"]')) return 'dark';
    if (s.includes('[data-theme="light"]') || s.includes('[data-mode="light"]') ||
        s.includes('[data-color-scheme="light"]') || s === '.light') return 'light';
    // Custom themes: [data-theme="X"]
    const themeMatch = s.match(/\\[data-theme="([^"]+)"\\]/);
    if (themeMatch) return themeMatch[1];
    return 'default';
  }

  function scanRules(rules) {
    for (const rule of rules) {
      try {
        if (rule instanceof CSSMediaRule) {
          scanRules(rule.cssRules);
          continue;
        }
        if (!(rule instanceof CSSStyleRule)) continue;
        const sel = rule.selectorText;
        if (!(
          sel === ':root' || sel === 'html' || sel === 'body' || sel === ':host' ||
          sel.includes('[data-theme]') || sel.includes('[data-mode]') ||
          sel.includes('[data-color-scheme]') ||
          sel.includes('[class*="dark"]') || sel === '.light' || sel === '.dark'
        )) continue;

        const mode = classifyMode(sel);
        for (let i = 0; i < rule.style.length; i++) {
          const prop = rule.style[i];
          if (!prop.startsWith('--')) continue;
          const val = rule.style.getPropertyValue(prop).trim();
          flat[prop] = val;
          moded.push({ name: prop, value: val, mode, selector: sel });
        }
      } catch(e) {}
    }
  }

  for (const sheet of document.styleSheets) {
    try { scanRules(sheet.cssRules); } catch(e) {}
  }

  // CSS-in-JS fallback: if few vars found, scan injected <style> tags
  if (Object.keys(flat).length < 5) {
    const styleTags = document.querySelectorAll('style');
    for (const tag of styleTags) {
      const text = tag.textContent || '';
      const matches = text.matchAll(/(--.+?)\\s*:\\s*([^;}{]+)/g);
      for (const m of matches) {
        const prop = m[1].trim();
        const val = m[2].trim();
        if (!flat[prop]) {
          flat[prop] = val;
          moded.push({ name: prop, value: val, mode: 'default', selector: 'style-tag' });
        }
      }
    }
  }

  return { flat, moded };
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
  const seen = new WeakSet();
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
    // ARIA role selectors for non-standard markup
    role_button: document.querySelector('[role="button"]:not(button)'),
    role_tab: document.querySelector('[role="tab"]'),
    role_dialog: document.querySelector('[role="dialog"]'),
    role_navigation: document.querySelector('[role="navigation"], nav'),
    role_alert: document.querySelector('[role="alert"]'),
    // Common class patterns for component detection
    cls_btn: document.querySelector('[class*="btn"]:not(button)'),
    cls_card: document.querySelector('[class*="card"]:not([class*="card-"])'),
    cls_modal: document.querySelector('[class*="modal"]'),
    cls_badge: document.querySelector('[class*="badge"]'),
    cls_avatar: document.querySelector('[class*="avatar"]'),
    cls_chip: document.querySelector('[class*="chip"], [class*="tag"]'),
  };

  function extractStyles(el) {
    if (seen.has(el)) return null;
    seen.add(el);
    const cs = getComputedStyle(el);
    return {
      fontFamily: cs.fontFamily,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      lineHeight: cs.lineHeight,
      letterSpacing: cs.letterSpacing,
      color: cs.color,
      backgroundColor: cs.backgroundColor,
      backgroundImage: cs.backgroundImage,
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
      filter: cs.filter,
      backdropFilter: cs.getPropertyValue('backdrop-filter') || cs.webkitBackdropFilter || '',
    };
  }

  const results = {};
  for (const [name, el] of Object.entries(targets)) {
    if (el) {
      const styles = extractStyles(el);
      if (styles) results[name] = styles;
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

/** Discover component patterns by scanning the DOM for repeated structures. */
export const extractComponentPatternsScript = `() => {
  const MAX_COMPONENTS = 50;
  const MAX_VARIANTS = 10;
  const components = [];

  // Strategy 1: Find buttons (all types)
  const buttons = document.querySelectorAll('button, [role="button"], a[class*="btn"], a[class*="button"], [class*="cta"]');
  if (buttons.length > 0) {
    const variants = new Map();
    for (const btn of Array.from(buttons).slice(0, 30)) {
      const cls = (btn.className?.toString?.() || '').split(/\\s+/).sort().join(' ');
      const key = cls || btn.tagName;
      if (!variants.has(key)) variants.set(key, { count: 0, sample: null });
      const v = variants.get(key);
      v.count++;
      if (!v.sample) {
        const cs = getComputedStyle(btn);
        v.sample = {
          tag: btn.tagName.toLowerCase(),
          classes: cls.slice(0, 120),
          text: (btn.textContent?.trim() || '').slice(0, 40),
          bg: cs.backgroundColor,
          color: cs.color,
          borderRadius: cs.borderRadius,
          padding: cs.padding,
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
        };
      }
    }
    const variantList = Array.from(variants.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, MAX_VARIANTS);
    components.push({
      name: 'Button',
      type: 'button',
      variantCount: variantList.length,
      totalInstances: buttons.length,
      variants: variantList.map(v => v.sample).filter(Boolean),
    });
  }

  // Strategy 2: Find cards (repeated flex/grid children with similar structure)
  const cardCandidates = document.querySelectorAll('[class*="card"], [class*="Card"], [class*="tile"], [class*="Tile"]');
  if (cardCandidates.length >= 2) {
    const sample = cardCandidates[0];
    const cs = getComputedStyle(sample);
    components.push({
      name: 'Card',
      type: 'card',
      variantCount: 1,
      totalInstances: cardCandidates.length,
      variants: [{
        tag: sample.tagName.toLowerCase(),
        classes: (sample.className?.toString?.() || '').slice(0, 120),
        bg: cs.backgroundColor,
        borderRadius: cs.borderRadius,
        padding: cs.padding,
        boxShadow: cs.boxShadow,
        childCount: sample.children.length,
        hasImage: !!sample.querySelector('img'),
      }],
    });
  }

  // Strategy 3: Find inputs
  const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), textarea, select');
  if (inputs.length > 0) {
    const sample = inputs[0];
    const cs = getComputedStyle(sample);
    components.push({
      name: 'Input',
      type: 'input',
      variantCount: 1,
      totalInstances: inputs.length,
      variants: [{
        tag: sample.tagName.toLowerCase(),
        classes: (sample.className?.toString?.() || '').slice(0, 120),
        bg: cs.backgroundColor,
        border: cs.border,
        borderRadius: cs.borderRadius,
        padding: cs.padding,
        fontSize: cs.fontSize,
      }],
    });
  }

  // Strategy 4: Find nav items
  const navItems = document.querySelectorAll('nav a, [role="navigation"] a, header a');
  if (navItems.length >= 3) {
    const sample = navItems[0];
    const cs = getComputedStyle(sample);
    components.push({
      name: 'Nav Item',
      type: 'nav',
      variantCount: 1,
      totalInstances: navItems.length,
      variants: [{
        tag: sample.tagName.toLowerCase(),
        classes: (sample.className?.toString?.() || '').slice(0, 120),
        color: cs.color,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        padding: cs.padding,
      }],
    });
  }

  // Strategy 5: Find badges/chips/tags
  const badges = document.querySelectorAll('[class*="badge"], [class*="chip"], [class*="tag"], [class*="pill"], [class*="label"]');
  if (badges.length >= 2) {
    const sample = badges[0];
    const cs = getComputedStyle(sample);
    components.push({
      name: 'Badge',
      type: 'badge',
      variantCount: 1,
      totalInstances: badges.length,
      variants: [{
        tag: sample.tagName.toLowerCase(),
        classes: (sample.className?.toString?.() || '').slice(0, 120),
        bg: cs.backgroundColor,
        color: cs.color,
        borderRadius: cs.borderRadius,
        padding: cs.padding,
        fontSize: cs.fontSize,
      }],
    });
  }

  // Strategy 6: Class-prefix grouping for repeated patterns
  const allElements = document.querySelectorAll('[class]');
  const prefixCount = new Map();
  for (const el of Array.from(allElements).slice(0, 500)) {
    const classes = (el.className?.toString?.() || '').split(/\\s+/);
    for (const cls of classes) {
      const prefix = cls.replace(/[-_].*/, '');
      if (prefix.length >= 3 && prefix.length <= 20) {
        prefixCount.set(prefix, (prefixCount.get(prefix) || 0) + 1);
      }
    }
  }

  // Find class prefixes that appear many times (likely component patterns)
  const componentNames = new Set(components.map(c => c.name.toLowerCase()));
  for (const [prefix, count] of prefixCount) {
    if (count < 5 || components.length >= MAX_COMPONENTS) break;
    const lower = prefix.toLowerCase();
    if (componentNames.has(lower)) continue;
    // Skip generic prefixes
    if (['flex', 'grid', 'text', 'font', 'bg', 'border', 'p', 'm', 'w', 'h', 'min', 'max', 'overflow', 'relative', 'absolute', 'fixed', 'block', 'inline', 'hidden'].includes(lower)) continue;

    const els = document.querySelectorAll('[class*="' + prefix + '"]');
    if (els.length < 3) continue;

    const sample = els[0];
    const cs = getComputedStyle(sample);
    const variants = new Set();
    for (const el of Array.from(els).slice(0, 20)) {
      const cls = (el.className?.toString?.() || '').split(/\\s+/)
        .filter(c => c.startsWith(prefix))
        .sort().join(' ');
      variants.add(cls);
    }

    components.push({
      name: prefix.charAt(0).toUpperCase() + prefix.slice(1),
      type: 'detected',
      variantCount: Math.min(variants.size, MAX_VARIANTS),
      totalInstances: els.length,
      variants: [{
        tag: sample.tagName.toLowerCase(),
        classes: (sample.className?.toString?.() || '').slice(0, 120),
        bg: cs.backgroundColor,
        color: cs.color,
        borderRadius: cs.borderRadius,
      }],
    });
    componentNames.add(lower);
  }

  return components.slice(0, MAX_COMPONENTS);
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
