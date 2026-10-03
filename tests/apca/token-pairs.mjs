/**
 * APCA token matrix — machine-readable registry of allowed
 * semantic foreground/background pairs (PROJECT_SPEC.md, 8.1).
 *
 * Each pair declares the text role it is used for. APCA thresholds depend on
 * role (size/weight), not a single universal number:
 *
 *  body        — normal body text (>= 16px regular): Lc 75 preferred, 60 minimum
 *  fluent      — slightly smaller/fluent text (14-15px): Lc 60 minimum
 *  large       — large text (>= 24px or 18.66px bold): Lc 45 minimum
 *  nonText     — UI boundaries, icons, focus indicators: Lc 15 minimum
 *  disabled    — disabled controls (exempt from conformance, still tracked)
 *
 * Values are resolved per theme: light and dark variants are checked
 * separately. Colors are raw OKLCH strings mirroring packages/core palette
 * tokens; the check script resolves var() references via paletteMap.
 */

/**
 * @typedef {'body'|'fluent'|'large'|'nonText'|'disabled'} TextRole
 */

/**
 * Raw palette values mirrored from packages/core/src/tokens/palette.css.
 * Keep in sync — a CI grep gate verifies both files agree (Phase 6).
 */
export const paletteMap = {
  'neutral-0': 'oklch(100% 0 0)',
  'neutral-50': 'oklch(97% 0.003 260)',
  'neutral-100': 'oklch(94% 0.005 260)',
  'neutral-200': 'oklch(87% 0.008 260)',
  'neutral-300': 'oklch(78% 0.01 260)',
  'neutral-400': 'oklch(60% 0.012 260)',
  'neutral-500': 'oklch(48% 0.012 260)',
  'neutral-600': 'oklch(38% 0.012 260)',
  'neutral-700': 'oklch(28% 0.012 260)',
  'neutral-800': 'oklch(20% 0.01 260)',
  'neutral-900': 'oklch(14% 0.008 260)',
  'neutral-950': 'oklch(9% 0.005 260)',
  'accent-100': 'oklch(95% 0.022 255)',
  'accent-200': 'oklch(92% 0.11 250)',
  'accent-300': 'oklch(86% 0.11 250)',
  'accent-500': 'oklch(56% 0.17 255)',
  'accent-600': 'oklch(48% 0.18 258)',
  'accent-700': 'oklch(38% 0.16 260)',
  'accent-800': 'oklch(21% 0.05 258)',
  'danger-100': 'oklch(95% 0.02 25)',
  'danger-200': 'oklch(94% 0.08 25)',
  'danger-300': 'oklch(90% 0.1 25)',
  'danger-500': 'oklch(55% 0.19 27)',
  'danger-600': 'oklch(48% 0.19 28)',
  'danger-700': 'oklch(36% 0.16 29)',
  'danger-800': 'oklch(21% 0.045 27)',
  'success-100': 'oklch(95% 0.045 150)',
  'success-200': 'oklch(90% 0.1 150)',
  'success-300': 'oklch(84% 0.13 150)',
  'success-500': 'oklch(55% 0.16 150)',
  'success-600': 'oklch(47% 0.15 151)',
  'success-700': 'oklch(35% 0.13 152)',
  'success-800': 'oklch(21% 0.05 151)',
  'warning-100': 'oklch(95% 0.045 85)',
  'warning-200': 'oklch(94% 0.06 85)',
  'warning-300': 'oklch(90% 0.1 85)',
  'warning-600': 'oklch(48% 0.1 75)',
  'warning-700': 'oklch(36% 0.075 75)',
  'warning-800': 'oklch(21% 0.045 80)',
};

/**
 * Semantic token -> palette reference, per theme.
 * Mirrors packages/core/src/tokens/color.css light-dark() arguments.
 */
export const semanticMap = {
  surface: { light: 'neutral-0', dark: 'neutral-900' },
  'surface-raised': { light: 'neutral-50', dark: 'neutral-800' },
  'surface-sunken': { light: 'neutral-100', dark: 'neutral-950' },
  text: { light: 'neutral-900', dark: 'neutral-50' },
  'text-muted': { light: 'neutral-600', dark: 'neutral-300' },
  accent: { light: 'accent-600', dark: 'accent-300' },
  'accent-strong': { light: 'accent-700', dark: 'accent-200' },
  'accent-surface': { light: 'accent-500', dark: 'accent-300' },
  'on-accent': { light: 'neutral-0', dark: 'neutral-950' },
  danger: { light: 'danger-600', dark: 'danger-300' },
  'danger-strong': { light: 'danger-700', dark: 'danger-200' },
  'danger-surface': { light: 'danger-500', dark: 'danger-300' },
  'on-danger': { light: 'neutral-0', dark: 'neutral-950' },
  success: { light: 'success-600', dark: 'success-300' },
  'success-strong': { light: 'success-700', dark: 'success-200' },
  'success-surface': { light: 'success-500', dark: 'success-300' },
  'on-success': { light: 'neutral-0', dark: 'neutral-950' },
  warning: { light: 'warning-600', dark: 'warning-300' },
  'warning-strong': { light: 'warning-700', dark: 'warning-200' },
  'accent-tint': { light: 'accent-100', dark: 'accent-800' },
  'success-tint': { light: 'success-100', dark: 'success-800' },
  'warning-tint': { light: 'warning-100', dark: 'warning-800' },
  'danger-tint': { light: 'danger-100', dark: 'danger-800' },
  'focus-ring': { light: 'accent-600', dark: 'accent-300' },
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
  { fg: 'text', bg: 'surface-sunken', role: 'body' },
  { fg: 'text-muted', bg: 'surface', role: 'fluent' },
  { fg: 'text-muted', bg: 'surface-raised', role: 'fluent' },
  { fg: 'text-muted', bg: 'surface-sunken', role: 'fluent' },

  // Base typography (base/typography.css): the inline code family renders at
  // 0.875em (fluent role at 16px body). Blockquote deliberately keeps the
  // text/surface body pair — text-muted fails the body threshold in dark
  { fg: 'text', bg: 'surface-sunken', role: 'fluent', note: 'inline code, samp; pre' },
  { fg: 'text', bg: 'surface-raised', role: 'fluent', note: 'kbd' },

  // Accent text and controls
  { fg: 'accent', bg: 'surface', role: 'body' },
  { fg: 'accent', bg: 'surface-raised', role: 'body' },
  { fg: 'accent-strong', bg: 'surface', role: 'body' },
  { fg: 'on-accent', bg: 'accent-surface', role: 'body' },
  { fg: 'on-accent', bg: 'accent-strong', role: 'body' },

  // Danger text and controls
  { fg: 'danger', bg: 'surface', role: 'body' },
  { fg: 'danger', bg: 'surface-raised', role: 'body' },
  { fg: 'danger-strong', bg: 'surface', role: 'body' },
  { fg: 'on-danger', bg: 'danger-surface', role: 'body' },

  // Success
  { fg: 'success', bg: 'surface', role: 'body' },
  { fg: 'on-success', bg: 'success-surface', role: 'body' },

  // Feedback tint surfaces (Alert, Badge): title/label uses -strong (body),
  // body text uses text (body), 1px border uses the base variant color
  // (nonText)
  { fg: 'accent-strong', bg: 'accent-tint', role: 'body' },
  { fg: 'text', bg: 'accent-tint', role: 'body' },
  { fg: 'accent', bg: 'accent-tint', role: 'nonText' },
  { fg: 'danger-strong', bg: 'danger-tint', role: 'body' },
  { fg: 'text', bg: 'danger-tint', role: 'body' },
  { fg: 'danger', bg: 'danger-tint', role: 'nonText' },
  { fg: 'success-strong', bg: 'success-tint', role: 'body' },
  { fg: 'text', bg: 'success-tint', role: 'body' },
  { fg: 'success', bg: 'success-tint', role: 'nonText' },
  { fg: 'warning-strong', bg: 'warning-tint', role: 'body' },
  { fg: 'text', bg: 'warning-tint', role: 'body' },
  { fg: 'warning', bg: 'warning-tint', role: 'nonText' },

  // Focus indicator (non-text contrast)
  { fg: 'focus-ring', bg: 'surface', role: 'nonText' },
  { fg: 'focus-ring', bg: 'surface-raised', role: 'nonText' },

  // Disabled state (tracked, exempt from conformance)
  { fg: 'text-muted', bg: 'surface', role: 'disabled', note: 'disabled controls' },
];

/** Minimum APCA Lc per role. */
export const roleThresholds = {
  body: 75,
  fluent: 60,
  large: 45,
  nonText: 15,
  disabled: 15,
};
