/**
 * JavaScript injected into the preview iframe when inspect mode is active.
 * Handles element selection, hover highlighting, and style mutation via postMessage.
 */

export function getInspectorScript(): string {
  return `
(function() {
  var selected = null;
  var editingText = null;
  var overlay = null;
  var hoverOverlay = null;
  var idCounter = 0;
  var inspectActive = true;

  // Block all navigation and form submission inside the Inspector iframe
  // Prevents accidental clicks on nav links, buttons, etc. from triggering real actions
  document.addEventListener('submit', function(e) { e.preventDefault(); }, true);
  window.addEventListener('beforeunload', function(e) { e.preventDefault(); });
  // Override window.open so buttons can't open popups
  window.open = function() { return null; };

  function ensureId(el) {
    if (!el.dataset.layoutId) {
      el.dataset.layoutId = 'li-' + (idCounter++);
    }
    return el.dataset.layoutId;
  }

  function createOverlay(color, zIndex) {
    var div = document.createElement('div');
    div.style.cssText = 'position:absolute;pointer-events:none;z-index:' + zIndex + ';border:2px solid ' + color + ';background:' + color.replace(')', ',0.08)').replace('rgb', 'rgba') + ';transition:all 80ms ease-out;display:none;';
    document.body.appendChild(div);
    return div;
  }

  function positionOverlay(ov, rect) {
    ov.style.display = 'block';
    ov.style.left = (rect.left + window.scrollX) + 'px';
    ov.style.top = (rect.top + window.scrollY) + 'px';
    ov.style.width = rect.width + 'px';
    ov.style.height = rect.height + 'px';
  }

  overlay = createOverlay('rgb(99,102,241)', 99998);
  hoverOverlay = createOverlay('rgb(59,130,246)', 99997);

  function getComputedProps(el) {
    var cs = window.getComputedStyle(el);
    return {
      fontFamily: cs.fontFamily,
      fontWeight: cs.fontWeight,
      fontSize: cs.fontSize,
      lineHeight: cs.lineHeight,
      letterSpacing: cs.letterSpacing,
      color: cs.color,
      backgroundColor: cs.backgroundColor,
      borderRadius: cs.borderRadius,
      borderWidth: cs.borderWidth,
      borderColor: cs.borderColor,
      borderStyle: cs.borderStyle,
      paddingTop: cs.paddingTop,
      paddingRight: cs.paddingRight,
      paddingBottom: cs.paddingBottom,
      paddingLeft: cs.paddingLeft,
      marginTop: cs.marginTop,
      marginRight: cs.marginRight,
      marginBottom: cs.marginBottom,
      marginLeft: cs.marginLeft,
      display: cs.display,
      flexDirection: cs.flexDirection,
      gap: cs.gap,
      alignItems: cs.alignItems,
      justifyContent: cs.justifyContent,
      width: cs.width,
      height: cs.height,
      maxWidth: cs.maxWidth,
      textAlign: cs.textAlign,
      opacity: cs.opacity,
      textContent: el.childNodes.length === 1 && el.childNodes[0].nodeType === 3 ? el.textContent : undefined
    };
  }

  function sendSelection(el) {
    var id = ensureId(el);
    var rect = el.getBoundingClientRect();
    var props = getComputedProps(el);
    var msg = {
      type: 'layout-inspector-select',
      elementId: id,
      elementTag: el.tagName.toLowerCase(),
      elementClasses: el.className || '',
      rect: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
      computedStyles: props
    };
    // Include image generation data if this is an img with data-generate-image
    if (el.tagName === 'IMG' && el.getAttribute('data-generate-image')) {
      msg.imagePrompt = el.getAttribute('data-generate-image') || '';
      msg.imageStyle = el.getAttribute('data-image-style') || 'photo';
      msg.imageRatio = el.getAttribute('data-image-ratio') || '16:9';
      msg.imageSrc = el.src || '';
    }
    window.parent.postMessage(msg, '*');
  }

  document.addEventListener('mousemove', function(e) {
    if (!inspectActive) return;
    var el = e.target;
    if (el === document.body || el === document.documentElement) {
      hoverOverlay.style.display = 'none';
      return;
    }
    var rect = el.getBoundingClientRect();
    positionOverlay(hoverOverlay, rect);
  }, true);

  document.addEventListener('click', function(e) {
    if (!inspectActive) return;

    // If we're editing text, allow clicks inside the editable element
    if (editingText) {
      if (editingText.contains(e.target)) return;
      // Clicked outside — exit text edit and stop here so the pending
      // text change isn't cleared by selecting a new element
      exitTextEdit();
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    var el = e.target;
    if (el === document.body || el === document.documentElement) return;

    selected = el;
    var rect = el.getBoundingClientRect();
    positionOverlay(overlay, rect);
    hoverOverlay.style.display = 'none';
    sendSelection(el);
  }, true);

  function exitTextEdit() {
    if (!editingText) return;
    var el = editingText;
    editingText = null;
    el.contentEditable = 'false';
    el.style.outline = '';
    el.style.cursor = '';
    // Notify parent of text change
    var props = getComputedProps(el);
    window.parent.postMessage({
      type: 'layout-inspector-style-updated',
      elementId: el.dataset.layoutId,
      computedStyles: props,
      rect: (function(){ var r = el.getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; })()
    }, '*');
    // Also send a textContent edit so it can be tracked
    window.parent.postMessage({
      type: 'layout-inspector-text-changed',
      elementId: el.dataset.layoutId,
      elementTag: el.tagName.toLowerCase(),
      elementClasses: el.className || '',
      textContent: el.textContent
    }, '*');
  }

  function isTextElement(el) {
    if (el.childNodes.length === 0) return false;
    for (var i = 0; i < el.childNodes.length; i++) {
      if (el.childNodes[i].nodeType === 3 && el.childNodes[i].textContent.trim()) return true;
    }
    // Also allow elements that only contain inline children with text
    var tag = el.tagName.toLowerCase();
    return tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6' || tag === 'p' || tag === 'span' || tag === 'a' || tag === 'button' || tag === 'label' || tag === 'li' || tag === 'td' || tag === 'th';
  }

  document.addEventListener('dblclick', function(e) {
    if (!inspectActive) return;
    var el = e.target;
    if (el === document.body || el === document.documentElement) return;
    if (!isTextElement(el)) return;

    e.preventDefault();
    e.stopPropagation();

    // Exit any previous text edit
    exitTextEdit();

    editingText = el;
    el.contentEditable = 'true';
    el.style.outline = '2px solid rgb(99,102,241)';
    el.style.cursor = 'text';
    el.focus();

    // Hide overlays while editing text
    overlay.style.display = 'none';
    hoverOverlay.style.display = 'none';
  }, true);

  // Exit text editing on Escape or clicking outside
  document.addEventListener('keydown', function(e) {
    if (editingText && e.key === 'Escape') {
      e.preventDefault();
      exitTextEdit();
    }
  });

  document.addEventListener('mouseleave', function() {
    hoverOverlay.style.display = 'none';
  });

  window.addEventListener('message', function(e) {
    var msg = e.data;
    if (!msg || !msg.type) return;

    if (msg.type === 'layout-inspector-apply-style' && selected) {
      var prop = msg.property;
      var val = msg.value;
      if (prop === 'textContent') {
        selected.textContent = val;
      } else if (prop === 'src' && selected.tagName === 'IMG') {
        selected.src = val;
      } else {
        selected.style[prop] = val;
      }

      var rect = selected.getBoundingClientRect();
      positionOverlay(overlay, rect);

      var props = getComputedProps(selected);
      window.parent.postMessage({
        type: 'layout-inspector-style-updated',
        elementId: selected.dataset.layoutId,
        computedStyles: props,
        rect: { x: rect.left, y: rect.top, width: rect.width, height: rect.height }
      }, '*');
    }

    if (msg.type === 'layout-inspector-deselect') {
      selected = null;
      overlay.style.display = 'none';
    }

    if (msg.type === 'layout-inspector-toggle') {
      inspectActive = msg.active;
      if (!inspectActive) {
        selected = null;
        overlay.style.display = 'none';
        hoverOverlay.style.display = 'none';
      }
    }
  });
})();
`;
}
