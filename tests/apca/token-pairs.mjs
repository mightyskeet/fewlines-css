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
 * separately. Palette colors are parsed from packages/core/src/tokens/palette.css
 * by the check script; semanticMap below mirrors packages/core/src/tokens/color.css
 * light-dark() arguments (kept as a reviewed registry — it is a decision
 * document, not a duplicate of parsed values).
 */

/**
 * @typedef {'body'|'fluent'|'small'|'large'|'nonText'|'disabled'} TextRole
 */

/**
 * Semantic token -> palette reference, per theme.
 * Mirrors packages/core/src/tokens/color.css light-dark() arguments.
 *
 * Derived tokens (hover fills) may declare a `mix`: an oklab color-mix of
 * two members — mix: [a, b, weight?] where weight (0..100, default 50) is
 * the share of the FIRST member; mirrors the color-mix() in color.css.
 */
export const semanticMap = {
  surface: { light: 'neutral-0', dark: 'neutral-900' },
  'surface-raised': { light: 'neutral-50', dark: 'neutral-800' },
  'surface-tint': { light: 'neutral-200', dark: 'neutral-700' },
  hover: {
    // Light: a small step from the page surface toward text (~94%).
    // Dark: the full raised step — a half-step reads as invisible.
    light: { mix: ['text', 'surface', 8] },
    dark: { mix: ['surface-raised', 'neutral-700'] },
  },
  text: { light: 'neutral-900', dark: 'neutral-50' },
  'text-muted': { light: 'neutral-600', dark: 'neutral-300' },
  brand: { light: 'neutral-900', dark: 'neutral-50' },
  'on-brand': { light: 'neutral-0', dark: 'neutral-950' },
  'brand-hover': {
    // A 30% step toward the on-brand contrast pole (light theme) — the
    // near-black fill has a huge contrast headroom; the dark theme keeps
    // the old 14% step — the near-white fill has no visible room.
    light: { mix: ['brand', 'on-brand', 70] },
    dark: { mix: ['brand', 'on-brand', 86] },
  },
  'brand-tint': { light: 'neutral-200', dark: 'neutral-700' },
  'brand-tint-hover': {
    // Pastel hover fill (secondary button): a single 8% step of the family
    // tone into the tint, in both themes (no light-dark split — the
    // semantic partners flip themselves). The light theme darkens the
    // 200-step tint; the dark theme lightens the 700-step tint toward the
    // near-white family tone ("шаг к тексту" — the text on the tint is
    // `brand`).
    light: { mix: ['brand', 'brand-tint', 8] },
    dark: { mix: ['brand', 'brand-tint', 8] },
  },
  attention: { light: 'attention-600', dark: 'attention-300' },
  'on-attention': { light: 'neutral-0', dark: 'neutral-950' },
  'attention-hover': {
    // A step toward the on-* pole in both themes: the light theme walks
    // toward the white pole (the fill lightens, 16%); the dark theme walks
    // toward the dark pole (the fill darkens, 12%) — tracked at the
    // documented 60 minimum, the 300-level fill with dark on-* text has
    // only ~3 Lc of headroom at 75.
    light: { mix: ['attention', 'on-attention', 84] },
    dark: { mix: ['attention', 'on-attention', 88] },
  },
  'attention-tint': { light: 'attention-200', dark: 'attention-700' },
  link: { light: 'link-600', dark: 'link-300' },
  'selection': { light: 'link-100', dark: 'link-700' },
  'border-strong': { light: 'neutral-500', dark: 'neutral-400' },
  'focus-ring': { light: 'neutral-500', dark: 'neutral-400' },
};

/**
 * Allowed foreground/background pairs.
 * fg/bg are semantic token names resolved through semanticMap.
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
  // the brand fill on the tint track; the track boundary reuses the
  // neutral-alert border pair above.
  { fg: 'brand', bg: 'surface-tint', role: 'nonText', note: 'progress fill on track' },

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
