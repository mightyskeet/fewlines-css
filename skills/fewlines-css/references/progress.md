# Progress

## Purpose
Operation progress indicator: upload, processing, step-by-step flow. One canonical element — the native `<progress>`; two shapes — linear (default) and circle (`data-shape="circle"`); thickness/diameter via `data-size`; fill color via a local token. Zero JS.

## Native basis
- Element — `<progress>`: native `progressbar` role, `value`/`max` model, and determinate/indeterminate distinction. No `value` attribute → the element is `:indeterminate`.
- `<progress>` is not a form control: no `:disabled`, no form submission, no interactivity states at all.
- The accessible name is the host's duty: `<label>` or `aria-label`.
- Screen readers announce the percentage themselves (native `position` property) — no duplicate "70%" text required.

## Canonical markup
```html
<progress class="ui-progress" max="100" value="70" aria-label="Uploading"></progress>
```

Indeterminate — no `value` attribute:
```html
<progress class="ui-progress" aria-label="Loading"></progress>
```

- `max` is set by the host per the data model (default 1); the class is the only styling contract.
- Width is `inline-size: 100%` of the container; container geometry is the host's.
- Stacked bars get an automatic gap (`.ui-progress + .ui-progress`).

### Circle (`data-shape="circle"`)
Same native `<progress>`, no SVG: role, `value`/`max`, and `:indeterminate` stay native.

```html
<progress
  class="ui-progress"
  data-shape="circle"
  max="100"
  value="70"
  style="--ui-progress-value: 70"
  aria-label="Uploading"
></progress>
```

- **Two sources of truth — documented host duty**: the `value`/`max` attributes drive the screen reader, the `--ui-progress-value` custom property (0–100) on the element drives the arc paint.
- Without `--ui-progress-value` the circle degrades to a full track ring — the contract does not break.
- Text in the center is not component markup (canonical form is one element). Host recipe: a wrapper with `position: relative` + absolutely positioned content over the ring.

## Variants and sizes
No `data-variant`. Density: `data-size="sm|lg"`; default md, attribute omitted.

- Linear: only bar thickness changes — sm/md/lg map to `--ui-space-2xs`/`--ui-space-xs`/`--ui-space-sm`.
- Circle: diameter in fixed steps — sm `2rem`, md `2.5rem`, lg `3rem`; ring thickness is independent of `data-size`.

### Customization (local tokens)
| Token | Default | Meaning |
|---|---|---|
| `--ui-progress-fill` | `--ui-color-brand` | Fill color. |
| `--ui-progress-track` | `--ui-color-surface-tint` | Track color. |
| `--ui-progress-ring-thickness` | `--ui-space-2xs` (4px) | Circle ring thickness. |
| `--ui-progress-circle-diameter` | per `data-size` | Circle diameter. |
| `--ui-shimmer-duration` | `1.5s` | Duration of shimmer and indeterminate sweep (shared with Skeleton). |

Hosts override with semantic tokens, not classes; color semantics (e.g. attention for errors) are solved by overriding `--ui-progress-fill` in place.

## States
- Only native `:indeterminate` (no `value` attribute). The component animates its own indeterminate band sweep across the track (engine indeterminate animation does not survive custom pseudo-element painting).
- `:hover`/disabled/focus — absent by construction (non-interactive).

### Shimmer (opt-in)
`data-shimmer` — a highlight band sweeps along the fill of a determinate bar (long-running operation feels "alive"). Determinate only — indeterminate already has its own sweep. Reduced motion: shimmer is silenced with no contract loss — state is carried by the fill.

## Keyboard and accessibility
- Native `progressbar` role; a name is mandatory (`label`/`aria-label`) — an unnamed progressbar is an accessibility violation.
- State is conveyed by fill + position; color is not the sole carrier of meaning.
- Reduced motion: shimmer silenced, indeterminate sweep stops (static half-band), circle spin stops.
- Forced colors: `appearance` returns to `auto` — the system progressbar is shown. For the circle the mask is also removed (`mask-image: none`).

## Do not
- Do not replace `<progress>` with a `div` bar or SVG ring — you lose the role, `position`, `value`/`max`, and `:indeterminate` without JS.
- Do not leave a progressbar without an accessible name.
- Do not animate the determinate fill with component keyframes without opt-in — only indeterminate sweep, `data-shimmer`, and circle spin are component animations.
- Do not create variants via classes — density only via `data-size`, shape only via `data-shape`, color only by overriding `--ui-progress-fill`.
- Do not rely on `attr()` for the circle value — the host sets `--ui-progress-value`.
- Do not put `data-shimmer` on the circle — the highlight would sweep the whole disk, not the arc.
- Do not reference `--ui-base-*` from host overrides — only semantic `--ui-*` tokens.
