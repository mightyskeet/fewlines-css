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
 * Derived tokens (hover fills) may declare a `mix`: an oklab color-mix of two
 * semantic tokens (50/50), resolved per theme — mirrors the color-mix() in
 * color.css.
 */
export const semanticMap = {
  surface: { light: 'neutral-0', dark: 'neutral-900' },
  'surface-raised': { light: 'neutral-50', dark: 'neutral-800' },
  hover: {
    light: 'neutral-100',
    dark: { mix: ['surface', 'surface-raised'] },
  },
  'hover-raised': {
    light: 'neutral-100',
    // The up-neighbor of raised lost its semantic role (surface-subtle
    // collapse, 2026-10-26) — the midpoint is declared in palette steps.
    dark: { mix: ['surface-raised', 'neutral-700'] },
  },
  'neutral-fill': { light: 'neutral-900', dark: 'neutral-50' },
  'neutral-hover': { light: 'neutral-700', dark: 'neutral-200' },
  'on-neutral': { light: 'neutral-0', dark: 'neutral-950' },
  text: { light: 'neutral-900', dark: 'neutral-50' },
  'text-muted': { light: 'neutral-600', dark: 'neutral-300' },
  info: { light: 'info-600', dark: 'info-300' },
  'info-strong': { light: 'info-700', dark: 'info-200' },
  'info-fill': { light: 'info-500', dark: 'info-300' },
  'on-info': { light: 'neutral-0', dark: 'neutral-950' },
  'info-hover': {
    light: { mix: ['info-fill', 'info-strong'] },
    dark: { mix: ['info-fill', 'info-strong'] },
  },
  danger: { light: 'danger-600', dark: 'danger-300' },
  'danger-strong': { light: 'danger-700', dark: 'danger-200' },
  'danger-fill': { light: 'danger-500', dark: 'danger-300' },
  'danger-hover': {
    light: { mix: ['danger-fill', 'danger-strong'] },
    dark: { mix: ['danger-fill', 'danger-strong'] },
  },
  'on-danger': { light: 'neutral-0', dark: 'neutral-950' },
  success: { light: 'success-600', dark: 'success-300' },
  'success-strong': { light: 'success-700', dark: 'success-200' },
  'success-fill': { light: 'success-500', dark: 'success-300' },
  'on-success': { light: 'neutral-0', dark: 'neutral-950' },
  'success-hover': {
    light: { mix: ['success-fill', 'success-strong'] },
    dark: { mix: ['success-fill', 'success-strong'] },
  },
  warning: { light: 'warning-600', dark: 'warning-300' },
  'warning-strong': { light: 'warning-700', dark: 'warning-200' },
  'warning-fill': { light: 'warning-600', dark: 'warning-300' },
  'on-warning': { light: 'neutral-0', dark: 'neutral-950' },
  'warning-hover': {
    light: { mix: ['warning-fill', 'warning-strong'] },
    dark: { mix: ['warning-fill', 'warning-strong'] },
  },
  'neutral-tint': { light: 'neutral-100', dark: 'neutral-800' },
  'info-tint': { light: 'info-100', dark: 'info-800' },
  'success-tint': { light: 'success-100', dark: 'success-800' },
  'warning-tint': { light: 'warning-100', dark: 'warning-800' },
  'danger-tint': { light: 'danger-100', dark: 'danger-800' },
  'focus-ring': { light: 'info-600', dark: 'info-300' },
};

/**
 * Allowed foreground/background pairs.
 * fg/bg are semantic token names resolved through semanticMap.
 *
 * @type {Array<{fg: string, bg: string, role: TextRole, note?: string}>}
 */
export const tokenPairs = [
  // Core text on surfaces
  { fg: 'text', bg: 'surface', role: 'body' },
  { fg: 'text', bg: 'surface-raised', role: 'body' },
  { fg: 'text', bg: 'neutral-tint', role: 'body', note: 'badge default: gray tint' },
  { fg: 'text-muted', bg: 'surface', role: 'fluent' },
  { fg: 'text-muted', bg: 'surface-raised', role: 'fluent' },

  // Base typography (base/typography.css): the inline code family renders at
  // 0.875em (fluent role at 16px body). Blockquote deliberately keeps the
  // text/surface body pair — text-muted fails the body threshold in dark
  { fg: 'text', bg: 'surface-raised', role: 'fluent', note: 'inline code, samp, pre' },

  // Hover fills (state model, theme notes): table rows, accordion,
  // secondary button hover
  { fg: 'text', bg: 'hover', role: 'body' },
  { fg: 'text', bg: 'hover-raised', role: 'body' },
  { fg: 'text', bg: 'surface-raised', role: 'body', note: 'secondary button fill' },

  // Neutral action family (filled default button). neutral-hover: the hover
  // moves against the fill direction (light 700 / dark 200, decision
  // 2026-10-24) — imperceptible same-direction shifts (950/0) replaced.
  // Press = the hover fill + translate (uniform model, 2026-10-26) — no
  // separate neutral-strong pair.
  { fg: 'on-neutral', bg: 'neutral-fill', role: 'body', note: 'default button, kbd keycap' },
  { fg: 'on-neutral', bg: 'neutral-hover', role: 'body' },

  // Info text and controls
  { fg: 'info', bg: 'surface', role: 'body' },
  { fg: 'info', bg: 'surface-raised', role: 'body' },
  { fg: 'info-strong', bg: 'surface', role: 'body' },
  { fg: 'on-info', bg: 'info-fill', role: 'body' },
  { fg: 'on-info', bg: 'info-hover', role: 'body', note: 'reserved: info solid fill' },

  // Danger text and controls
  { fg: 'danger', bg: 'surface', role: 'body' },
  { fg: 'danger', bg: 'surface-raised', role: 'body' },
  { fg: 'danger-strong', bg: 'surface', role: 'body' },
  { fg: 'on-danger', bg: 'danger-fill', role: 'body' },
  { fg: 'on-danger', bg: 'danger-hover', role: 'body', note: 'destructive button hover' },

  // Success
  { fg: 'success', bg: 'surface', role: 'body' },
  { fg: 'on-success', bg: 'success-fill', role: 'body' },
  { fg: 'on-success', bg: 'success-hover', role: 'body', note: 'reserved: success solid fill' },

  // Feedback tint surfaces (Alert, Badge): title/label uses -strong (body),
  // body text uses text (body), 1px border uses the base variant color
  // (nonText)
  { fg: 'info-strong', bg: 'info-tint', role: 'body' },
  { fg: 'text', bg: 'info-tint', role: 'body' },
  { fg: 'info', bg: 'info-tint', role: 'nonText' },
  { fg: 'danger-strong', bg: 'danger-tint', role: 'body' },
  { fg: 'text', bg: 'danger-tint', role: 'body' },
  { fg: 'danger', bg: 'danger-tint', role: 'nonText' },
  { fg: 'success-strong', bg: 'success-tint', role: 'body' },
  { fg: 'text', bg: 'success-tint', role: 'body' },
  { fg: 'success', bg: 'success-tint', role: 'nonText' },
  { fg: 'warning-strong', bg: 'warning-tint', role: 'body' },
  { fg: 'text', bg: 'warning-tint', role: 'body' },
  { fg: 'warning', bg: 'warning-tint', role: 'nonText' },

  // Solid badge fills (the button-default model; Badge): the warning solid
  // fill is warning-fill, calibrated to the 600 step (white on 500 fails
  // the body threshold) — white on it measures Lc 87.7 (body).
  { fg: 'on-warning', bg: 'warning-fill', role: 'body' },
  { fg: 'on-warning', bg: 'warning-hover', role: 'body', note: 'reserved: warning solid fill' },

  // Focus indicator (non-text contrast)
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
  // same policy as blockquote (theme notes).
  { fg: 'text', bg: 'surface', role: 'small', note: 'caption' },
  { fg: 'text', bg: 'surface-raised', role: 'small', note: 'caption' },
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
