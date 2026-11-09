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
- The thumb is a brand RING over a transparent interior (host decision
  2026-11-09): the strips run through it and meet inside; a solid circle
  would force the strips to stop at its bounding box (the square-end
  artifact). The ring is an inset box-shadow — paint, not elevation; no
  depth shadow.

## Canonical markup

```html
<label for="volume">Volume</label>
<input class="ui-slider" type="range" id="volume" min="0" max="100" value="50" />
```

- The class is the only styling contract; the control fills the container
  (`inline-size: 100%` — container geometry is the host's, the same width
  contract as Progress).
- The box is the hit target and the thumb's air: thumb + 2×`--ui-space-xs`
  (32 / 36 / 40px — minimum target size met at every density, WCAG 2.5.8);
  the rail floats centered inside it.

### Value fill

The filled segment RIDES ON THE THUMB (the border-image slice trick):
the thumb's side border slices are stretched `100vw` sideways — the
inline-start one paints the fill, the inline-end one the track — and both
reach the thumb's CENTER (inline width `100vw + thumb/2`), so the strips
meet UNDER the thumb, the junction inside it. The cross-axis
border-image widths (`calc(50% − rail/2)`) crop both strips to exactly
the rail thickness, centered on the thumb. The input's
`overflow: hidden` clips the strips to the element; its full radius
rounds the rail ends. The fill follows the thumb NATIVELY — zero JS, no
host-set value property (2026-11-09). Firefox's `::-moz-range-progress`
is deliberately not used — one paint model, one RTL/vertical mirror
point.

- In an engine where the border-image trick fails the strips simply do
  not paint: a uniform track, the state carried by the thumb position
  (graceful).

## Variants and sizes

Orientation: `data-orientation="vertical"` — `writing-mode: sideways-lr`
(min at the bottom); the rail length is the `--ui-slider-length` knob
(default `8rem` — a percentage height needs a definite container, so 100%
is not the default).
Density: `data-size="sm|lg"`; default md, attribute omitted — thumb over
fixed steps (1 / 1.25 / 1.5rem), rail thickness over the space scale
(sm `--ui-space-2xs`, md `--ui-space-xs`, lg `--ui-space-sm`), the Progress
density model. The input box stays `thumb + 2×space-xs` at every density.

### Customization (local tokens)

| Token                | Default                    | Meaning               |
| -------------------- | -------------------------- | --------------------- |
| `--ui-slider-fill`   | `--ui-color-border-strong` | Fill color.           |
| `--ui-slider-track`  | `--ui-color-surface-tint`  | Track color.          |
| `--ui-slider-thumb`  | per `data-size`            | Thumb diameter.       |
| `--ui-slider-rail`   | per `data-size`            | Rail thickness.       |
| `--ui-slider-length` | `8rem`                     | Vertical rail length. |

Hosts override with semantic tokens, not classes; color semantics are
solved by overriding `--ui-slider-fill` in place.

## States

Native only: `:disabled` (opacity per the state model, native interaction
refusal), `:focus-visible` (the shared base focus ring — nothing to add).
There is no hover styling: the thumb position carries the state.

## Keyboard and accessibility

- Native `slider` role, native keyboard, native form semantics.
- A name is mandatory (`label`/`aria-label`).
- The thumb ring — brand/surface, the registered Stepper/Avatar pair.
  The filled segment is `border-strong` — decorative reinforcement by the
  border policy (host decision 2026-11-09: no new APCA pairs); the state
  is carried by the thumb position, not by color alone (WCAG 1.4.1).
- The value is conveyed by the thumb position, not by color alone
  (WCAG 1.4.1).
- Forced colors: `appearance` returns to `auto` — the system slider is
  shown (the Progress precedent).
- Reduced motion — not required, there are no animations.

## Do not

- Do not replace `<input type="range">` with a `div`-based widget — you
  lose the role, the keyboard and the form semantics without JS.
- Do not leave a slider without an accessible name.
- Do not create variants via classes — density only via `data-size`,
  orientation only via `data-orientation`, colors only by overriding the
  local tokens.
- Do not use `::-moz-range-progress` — the fill is the one gradient token
  (a second paint path would fork the look).
- Do not reference `--ui-base-*` from host overrides — only semantic
  `--ui-*` tokens.
