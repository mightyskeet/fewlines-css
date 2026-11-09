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

## Canonical markup

```html
<label for="volume">Volume</label>
<input class="ui-slider" type="range" id="volume" min="0" max="100" value="50" />
```

- The class is the only styling contract; the control fills the container
  (`inline-size: 100%` — container geometry is the host's, the same width
  contract as Progress).
- The box is the hit target: `1.5rem` (24px) tall at every density —
  minimum target size (WCAG 2.5.8); the rail floats centered inside it.

### Value fill (opt-in paint)

The filled track segment is painted by ONE gradient token
(`--ui-slider-paint`) on the track pseudo of both engines; Firefox's
`::-moz-range-progress` is deliberately not used — the gradient is a single
paint model and a single RTL/vertical mirror point.

CSS cannot read the `value` attribute (`attr()` is rejected — Safari only
TP; runtime JS is out of contract), so the host sets `--ui-slider-value`
(0–100, bare number) next to the `value` attribute — the documented dual
source of truth of the Progress circle:

```html
<input
  class="ui-slider"
  type="range"
  min="0"
  max="100"
  value="50"
  style="--ui-slider-value: 50"
  aria-label="Volume"
/>
```

- Without the property the track stays uniform (fill stop at 0%): the
  state is carried by the thumb position — the contract does not break.
- The host clamps the number to 0–100 (no clamping in the paint).
- Hosts with a JS layer sync the property on `input` — one line.

## Variants and sizes

Orientation: `data-orientation="vertical"` — `writing-mode: sideways-lr`
(min at the bottom); the rail length is the `--ui-slider-length` knob
(default `8rem` — a percentage height needs a definite container, so 100%
is not the default).
Density: `data-size="sm|lg"`; default md, attribute omitted — thumb over
fixed steps (1 / 1.25 / 1.5rem), rail thickness over the space scale
(sm `--ui-space-2xs`, md `--ui-space-xs`, lg `--ui-space-sm`), the Progress
density model. The input box stays 24px at every density.

### Customization (local tokens)

| Token                | Default                   | Meaning                          |
| -------------------- | ------------------------- | -------------------------------- |
| `--ui-slider-fill`   | `--ui-color-brand`        | Fill color.                      |
| `--ui-slider-track`  | `--ui-color-surface-tint` | Track color.                     |
| `--ui-slider-thumb`  | per `data-size`           | Thumb diameter.                  |
| `--ui-slider-rail`   | per `data-size`           | Rail thickness.                  |
| `--ui-slider-length` | `8rem`                    | Vertical rail length.            |
| `--ui-slider-value`  | host-set                  | Paint value 0–100 (dual source). |

Hosts override with semantic tokens, not classes; color semantics are
solved by overriding `--ui-slider-fill` in place.

## States

Native only: `:disabled` (opacity per the state model, native interaction
refusal), `:focus-visible` (the shared base focus ring — nothing to add).
There is no hover styling: the thumb position carries the state.

## Keyboard and accessibility

- Native `slider` role, native keyboard, native form semantics.
- A name is mandatory (`label`/`aria-label`).
- The fill/track pair is registered in the APCA matrix as a non-text pair
  (`brand/surface-tint` — the Progress pair); the thumb is the Switch
  thumb model (surface + `--ui-elevation-1`, separated by the elevation —
  manual audit, Switch precedent).
- The value is conveyed by the thumb position, not by color alone
  (WCAG 1.4.1).
- Forced colors: `appearance` returns to `auto` — the system slider is
  shown (the Progress precedent).
- Reduced motion — not required, there are no animations.

## Do not

- Do not replace `<input type="range">` with a `div`-based widget — you
  lose the role, the keyboard and the form semantics without JS.
- Do not leave a slider without an accessible name.
- Do not set `--ui-slider-value` beyond 0–100 (the paint does not clamp).
- Do not create variants via classes — density only via `data-size`,
  orientation only via `data-orientation`, colors only by overriding the
  local tokens.
- Do not use `::-moz-range-progress` — the fill is the one gradient token
  (a second paint path would fork the look).
- Do not reference `--ui-base-*` from host overrides — only semantic
  `--ui-*` tokens.
