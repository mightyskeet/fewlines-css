/**
 * APCA token matrix — machine-readable registry of allowed
 * semantic foreground/background pairs (accessibility notes).
 *
 * Each pair declares the text role it is used for. APCA thresholds depend on
 * role (size/weight), not a single universal number:
 *
 *  body        — normal body text (>= 16px regular): Lc 75 preferred, 60 minimum
 *  fluent      — slightly smaller/fluent text (14-15px): Lc 60 minimum
 *  small       — fine-print text (~11-12px, caption role): Lc 90 minimum
 *  large       — large text (>= 24px or 18.66px bold): Lc 45 minimum
 *  nonText     — UI boundaries, icons, focus indicators: Lc 15 minimum
 *  disabled    — disabled controls (exempt from conformance, still tracked)
 *
 * A pair may override the role threshold with `threshold` — a documented
 * exception (checked per theme, same gate).
 *
 * Values are resolved per theme: light and dark variants are checked
 * separately. Token values are the DERIVED defaults — the checker
 * re-implements the core formula system (tests/apca/derive-values.mjs, a JS
 * mirror of packages/core/src/tokens/derive.css); this registry only decides
 * which pairs are checked and at which role threshold.
 */

/**
 * @typedef {'body'|'fluent'|'small'|'large'|'nonText'|'disabled'} TextRole
 */

/**
 * Allowed foreground/background pairs.
 * fg/bg are semantic token names, resolved through the derivation
 * (tests/apca/derive-values.mjs).
 *
 * @type {Array<{fg: string, bg: string, role: TextRole, threshold?: number, note?: string}>}
 */
export const tokenPairs = [
  // Core text on surfaces
  { fg: 'text', bg: 'surface', role: 'body' },
  { fg: 'text', bg: 'surface-raised', role: 'body' },
  { fg: 'text', bg: 'surface-tint', role: 'body', note: 'badge neutral: gray tint' },
  { fg: 'text-muted', bg: 'surface', role: 'fluent' },
  { fg: 'text-muted', bg: 'surface-raised', role: 'fluent' },

  // Base typography (base/typography.css): the inline code family renders at
  // 0.875em (fluent role at 16px body). Blockquote deliberately keeps the
  // text/surface body pair — text-muted fails the body threshold in dark
  { fg: 'text', bg: 'surface-raised', role: 'fluent', note: 'inline code, samp, pre' },

  // Hover fill (state model, theme notes): table rows, accordion,
  // outline/ghost buttons. The dark value is the full raised step.
  { fg: 'text', bg: 'hover', role: 'body' },

  // Brand family (filled default button, kbd, switch checked, the default
  // badge pastel and the pastel secondary button). brand-hover is derived
  // toward the on-brand contrast pole; press = the hover fill + translate
  // (uniform model).
  { fg: 'on-brand', bg: 'brand', role: 'body', note: 'default button, kbd keycap' },
  { fg: 'on-brand', bg: 'brand-hover', role: 'body' },
  {
    fg: 'brand',
    bg: 'brand-tint',
    role: 'body',
    threshold: 60,
    note: 'default badge pastel / secondary button (pastel minimum)',
  },
  {
    fg: 'brand',
    bg: 'brand-tint-hover',
    role: 'body',
    threshold: 60,
    note: 'secondary button pastel hover (pastel minimum)',
  },

  // Attention family (the urgency tone: errors, destructive actions,
  // validation failures — formerly danger). Shape mirrors brand.
  { fg: 'attention', bg: 'surface', role: 'body' },
  { fg: 'attention', bg: 'surface-raised', role: 'body' },
  { fg: 'on-attention', bg: 'attention', role: 'body', note: 'attention solid button/badge' },
  {
    fg: 'on-attention',
    bg: 'attention-hover',
    role: 'body',
    threshold: 60,
    note: 'attention button hover (dark darkens — 60 minimum)',
  },

  // Feedback tint surfaces (Alert, Badge): title/label uses the bare family
  // tone (body), body text uses text (body), 1px border uses the base
  // variant color (nonText). The bare tone on the raw 100-step tint misses
  // the preferred 75 in the light theme by ~3 Lc (it sat on the removed
  // *-strong) — tracked at the documented 60 minimum.
  { fg: 'attention', bg: 'attention-tint', role: 'body', threshold: 60 },
  { fg: 'text', bg: 'attention-tint', role: 'body' },
  { fg: 'attention', bg: 'attention-tint', role: 'nonText' },

  // Base typography spellcheck: the wavy error underline is a text
  // decoration (an indicator, not a text fill) — nonText role.
  { fg: 'attention', bg: 'surface', role: 'nonText', note: 'spellcheck wavy underline' },

  // Neutral Alert (the default): the gray border on the gray tint is a
  // non-text boundary pair (surface-tint matches the family tints, the
  // border needs the stronger step to stay visible).
  { fg: 'border-strong', bg: 'surface-tint', role: 'nonText', note: 'neutral alert border' },

  // Progress: the fill is the state indicator (WCAG 1.4.11 non-text) —
  // the brand fill on the tint track; the track is a borderless soft
  // surface (the Badge-neutral model), no boundary pair needed.
  { fg: 'brand', bg: 'surface-tint', role: 'nonText', note: 'progress fill on track' },

  // Timeline: the marker ring is a non-text boundary (an event marker);
  // the rail is decorative (the divider policy), no pair.
  { fg: 'border-strong', bg: 'surface', role: 'nonText', note: 'timeline marker ring' },

  // Stepper: the state markers are non-text indicators (WCAG 1.4.11) —
  // the done disc and the current ring/dot on the page surface.
  { fg: 'brand', bg: 'surface', role: 'nonText', note: 'stepper state markers' },

  // Utility roles. Link: hyperlink text on the page and raised surfaces.
  // Selection: the tint under the author text color (the same soft-surface
  // pair the neutral Alert uses).
  { fg: 'link', bg: 'surface', role: 'body' },
  { fg: 'link', bg: 'surface-raised', role: 'body' },
  { fg: 'text', bg: 'selection', role: 'body' },

  // Neutral solid badge (the brand-independent inverted gray): the page
  // text as the fill, the page surface as the label.
  { fg: 'surface', bg: 'text', role: 'body', note: 'neutral-solid badge' },

  // Focus indicator (non-text contrast): the neutral ring.
  { fg: 'focus-ring', bg: 'surface', role: 'nonText' },
  { fg: 'focus-ring', bg: 'surface-raised', role: 'nonText' },

  // Scrim (--ui-color-scrim, Dialog/Drawer ::backdrop) is a non-text layer:
  // semi-transparent, so it has no direct fg/bg pair here; the readability
  // contract is carried by the content's own pairs against the scrimmed
  // surface (text/surface, body) — spot-checked in browser tests.

  // Headings: display (h1) and headline (h2, dialog/drawer titles) render at
  // large sizes — the `large` role threshold (Lc 45) is the applicable gate.
  // Same pairs as the body entries; the role records the rendered usage.
  { fg: 'text', bg: 'surface', role: 'large', note: 'h1 display headings' },
  { fg: 'text', bg: 'surface-raised', role: 'large', note: 'h2 headline (dialog, drawer)' },

  // Disabled state (tracked, exempt from conformance, spot readable)
  { fg: 'text-muted', bg: 'surface', role: 'disabled', note: 'disabled controls' },

  // Caption position (the xs step ~11-12px): below the fluent
  // size range, so the strict `small` threshold applies. Only full-contrast
  // text pairs ship — text-muted fails Lc 90 in the dark theme (Lc ~63),
  // same policy as blockquote (theme notes). figcaption renders at this
  // step (base/typography.css).
  { fg: 'text', bg: 'surface', role: 'small', note: 'caption, figcaption' },
  { fg: 'text', bg: 'surface-raised', role: 'small', note: 'caption, figcaption' },
];

/** Minimum APCA Lc per role (accessibility notes). */
export const roleThresholds = {
  body: 75,
  fluent: 60,
  small: 90,
  large: 45,
  nonText: 15,
  disabled: 30,
};
