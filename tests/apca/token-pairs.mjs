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
  'accent-200': 'oklch(92% 0.11 250)',
  'accent-300': 'oklch(86% 0.11 250)',
  'accent-500': 'oklch(56% 0.17 255)',
  'accent-600': 'oklch(48% 0.18 258)',
  'accent-700': 'oklch(38% 0.16 260)',
  'danger-200': 'oklch(94% 0.08 25)',
  'danger-300': 'oklch(90% 0.1 25)',
  'danger-500': 'oklch(55% 0.19 27)',
  'danger-600': 'oklch(48% 0.19 28)',
  'danger-700': 'oklch(36% 0.16 29)',
  'success-200': 'oklch(90% 0.1 150)',
  'success-300': 'oklch(84% 0.13 150)',
  'success-500': 'oklch(55% 0.16 150)',
  'success-600': 'oklch(47% 0.15 151)',
  'success-700': 'oklch(35% 0.13 152)',
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
  'success-surface': { light: 'success-500', dark: 'success-300' },
  'on-success': { light: 'neutral-0', dark: 'neutral-950' },
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
