# Slider

## Purpose

Numeric value selection on a bounded scale: volume, opacity, price range
input, filters. One canonical element — the native `<input type="range">`;
vertical orientation via `data-orientation`; density via `data-size`. Zero
JS.

## Native basis

- Element — `<input type="range">`: native `slider` role, the
  `min`/`max`/`step`/`value` model, native keyboard (arrows, Home/End,
  PageUp/PageDown), native form participation (`:disabled`, form
  submission) — nothing to build.
- The accessible name is the host's duty: `<label for>` (or a wrapping
  `<label>`) / `aria-label` — the same contract as every Field control.
- `datalist` tick marks are not part of the contract (the paint is
  engine-owned; ticks are not themed cross-engine).
- Engine paint model (the Progress precedent, `docs/compatibility.md`
  2026-10-29/2026-11-09): with `appearance: none` Chromium/WebKit paint the
  track on `::-webkit-slider-runnable-track` and the thumb on
  `::-webkit-slider-thumb`; Firefox — `::-moz-range-track` and
  `::-moz-range-thumb`. One canonical look, two engine pseudo targets, both
  fed from the same local custom properties.
- Vertical — `writing-mode: sideways-lr` on the input (min at the bottom,
  max at the top — the mixer convention; browser probe 2026-11-09: the
  `vertical-lr`/`vertical-rl` modes give min at the TOP in Chromium).
  Sideways/vertically-oriented form controls: Chrome 132/124, FF 43/120,
  Safari 18.4/17.4 — `docs/compatibility.md`, 2026-11-09.
  `slider-direction` is outside the Can I Use tracking — not used.
- Theming: `light-dark()` in the semantic tokens the paint consumes.
- The thumb is a SOLID brand circle (host decision 2026-11-09 — the
  earlier hollow ring read as a missing fill): the opaque circle hides the
  fill's junction under it. No depth shadow.

## Canonical markup

```html
<label for="volume">Volume</label>
<span class="ui-slider"><input type="range" id="volume" min="0" max="100" value="50" /></span>
```

- The class is the only styling contract; it sits on the WRAPPER — a bare
  native range control inside. The control fills the wrapper (`100%` /
  `100%` — container geometry is the host's, the same width contract as
  Progress).
- The wrapper is the documented last resort (host decision 2026-11-09):
  the value fill must be a real box and `<input>` is a void element — it
  has no `::before`/`::after` to carry one. The probed no-wrapper
  alternatives both fail: the runnable track pseudo cannot be taken over
  by `position: absolute` (the engine's thumb placement breaks — browser
  probe 2026-11-09), and the thumb can only paint beyond its own box
  through the border-image slice trick this model replaced.
- The box (the input) is the hit target and the thumb's air: thumb +
  2×`--ui-space-xs` (32 / 36 / 40px — minimum target size met at every
  density, WCAG 2.5.8); the rail floats centered inside it.

### Value fill

CSS Anchor Positioning (the compatibility-doc policy: progressive
enhancement). The thumb pseudo is the ANCHOR (`anchor-name` on
`::-webkit-slider-thumb` / `::-moz-range-thumb` — the engine tracks its
own pseudo natively; browser probe 2026-11-09, Chromium), the wrapper's
`::after` paints the fill from the inline-start edge to the thumb's
CENTER, the `::before` the static gray rail. The fill follows the thumb
natively — zero JS, no host-set value property (2026-11-09). Firefox's
`::-moz-range-progress` is deliberately not used — one paint model.

- The fill's rounded cap (radius-full, rail/2) nests strictly inside the
  opaque thumb circle at every density — the junction is invisible.
- RTL needs no mirror: `anchor(end)` and the logical insets resolve
  against the querying element's writing mode (browser probe 2026-11-09,
  Chromium) — the same declarations serve both directions.
- The wrapper scopes the anchor name (`anchor-scope: --ui-slider-thumb`):
  several sliders on a page each track their own thumb. The `::after` is
  gated on `anchor-scope` (Chrome 131+) — with a bare anchor-name older
  anchor engines resolve the duplicate to the first slider in tree order.
- In an engine without a resolvable anchor the `anchor()` inset is
  invalid at computed-value time and the `::after` collapses to zero
  size: a uniform track, the state carried by the thumb position
  (graceful). The gray rail and the thumb are anchor-independent — they
  paint everywhere.

## Variants and sizes

Orientation: `data-orientation="vertical"` on the WRAPPER —
`writing-mode: sideways-lr` on the input (min at the bottom); the wrapper
carries the geometry: a definite rail length along its block axis (the
`--ui-slider-length` knob, default `8rem` — a percentage height needs a
definite container, so 100% is not the default) and the thickness along
its inline axis.
Density: `data-size="sm|lg"` on the wrapper; default md, attribute
omitted — thumb over fixed steps (1 / 1.25 / 1.5rem), rail thickness over
the space scale (sm `--ui-space-2xs`, md `--ui-space-xs`, lg
`--ui-space-sm`), the Progress density model. The box (thumb +
2×space-xs) stays the hit target at every density.

### Customization (local tokens)

| Token                | Default                    | Meaning               |
| -------------------- | -------------------------- | --------------------- |
| `--ui-slider-fill`   | `--ui-color-border-strong` | Fill color.           |
| `--ui-slider-track`  | `--ui-color-surface-tint`  | Track color.          |
| `--ui-slider-thumb`  | per `data-size`            | Thumb diameter.       |
| `--ui-slider-rail`   | per `data-size`            | Rail thickness.       |
| `--ui-slider-length` | `8rem`                     | Vertical rail length. |

Hosts override with semantic tokens, not classes; color semantics are
solved by overriding `--ui-slider-fill` in place (on the wrapper — the
paint pseudos and the input inherit it).

## States

Native only: `:disabled` (the state-model opacity on the wrapper via
`:has(> input:disabled)` — the paint pseudos dim with the control;
`cursor: not-allowed` on the input), `:focus-visible` (the shared base
focus ring — nothing to add). There is no hover styling: the thumb
position carries the state.

## Keyboard and accessibility

- Native `slider` role, native keyboard, native form semantics.
- A name is mandatory (`label`/`aria-label`).
- The thumb is solid brand over the surface — the registered
  Stepper/Avatar pair. The filled segment is `border-strong` — decorative
  reinforcement by the border policy (host decision 2026-11-09: no new
  APCA pairs); the state is carried by the thumb position, not by color
  alone (WCAG 1.4.1).
- The value is conveyed by the thumb position, not by color alone
  (WCAG 1.4.1).
- Forced colors: `appearance` returns to `auto`, the paint pseudos step
  aside — the system slider is shown (the Progress precedent).
- Reduced motion — not required, there are no animations.

## Do not

- Do not replace `<input type="range">` with a `div`-based widget — you
  lose the role, the keyboard and the form semantics without JS.
- Do not leave a slider without an accessible name.
- Do not create variants via classes — density only via `data-size`,
  orientation only via `data-orientation`, colors only by overriding the
  local tokens.
- Do not use `::-moz-range-progress` — the fill is the one anchored
  `::after` (a second paint path would fork the look).
- Do not drop the wrapper for a bare input — the fill has no carrier
  (`<input>` is a void element) and the rail would lose its pill ends.
- Do not reference `--ui-base-*` from host overrides — only semantic
  `--ui-*` tokens.
