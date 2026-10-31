# Popover

## Purpose

Non-modal overlay: menus, tooltips, small panels. Closes on outside click (light dismiss) and Escape — natively.

## Native basis

- Popover API: `popover` attribute on the container.
- Declarative trigger: `popovertarget` on `<button>`/`<input>`.
- `popovertargetaction="show|hide|toggle"` (default toggle).
- `:popover-open` — native state pseudo-class.
- Light dismiss and Escape — native.
- Top layer — native (above all z-index).
- Implicit anchor via `popovertarget` is **not used**: positioning always goes through the explicit anchor contract (`ui-popover-trigger`, anchor name `--ui-popover-anchor`).

## Canonical markup

```html
<button class="ui-button ui-popover-trigger" type="button" popovertarget="p1">Options</button>

<div class="ui-popover" id="p1" popover data-block="block-end" data-inline="span-inline-end">
  <p>Popover content</p>
</div>
```

- `ui-popover-trigger` on the trigger is optional — it enables anchor positioning (declares the `anchor-name`).

## Variants and sizes

One canonical variant; placement via `data-block` / `data-inline` on the popover. Values are `position-area` keywords as-is (logical only; no alias dictionary). Axes compose via custom properties; an unset axis means `span-all` (centered on the anchor):

| Attribute     | Values                                                                                 |
| ------------- | -------------------------------------------------------------------------------------- |
| `data-block`  | `block-start` \| `center` \| `block-end` \| `span-block-start` \| `span-block-end`     |
| `data-inline` | `inline-start` \| `center` \| `inline-end` \| `span-inline-start` \| `span-inline-end` |

- Gap to the trigger — a margin on the axis valued `block-start|end` / `inline-start|end` (the edge facing the trigger); `center` and `span-*` stay flush with the trigger on their axis.
- `position-try-fallbacks: none` — fallbacks are the host's job.
- Without attributes: below the trigger (`block-end center`), fallback above it (`block-start center`).
- Without anchor support: centered in the viewport (fixed).
- Multiple trigger+popover pairs: scope anchor names — `anchor-scope: all` on a common ancestor, or a unique anchor name per pair; otherwise all popovers bind to the last trigger in the DOM.

## States

- Open — `:popover-open` (native pseudo-class).
- Entry animation — `@starting-style` + `transition-behavior: allow-discrete`.
- Exit animation — reverse transition to the hidden state; works in Chromium (`overlay`), instant close in Firefox/WebKit — graceful degradation.
- Reduced motion — disabled by media query.
- Forced colors — `forced-color-adjust: auto`.

## Keyboard and accessibility

- Role and semantics are native from the Popover API.
- Light dismiss and Escape — native, no JS needed.
- Focus is not trapped (non-modal) — native behavior.
- Trigger↔popover association is native via `popovertarget`.

## Anchor contract

- Anchor name: `--ui-popover-anchor` (fixed, one per trigger).
- Fallback positions: `block-end center` → `block-start center` (vertical flip).
- Placement is the host's choice via `data-block`/`data-inline`. Bare `span-inline` does not exist in the grammar; physical `span-left/right` are invalid.
- No collision handling: when horizontal space is short the popover may leave the viewport — the host sets `data-block`/`data-inline`/fallbacks as needed.
- Sizing in anchor mode: `position-area` resolves auto sizes against the placement region — a narrow anchor clamps the panel to its width. Hence `inline-size: max-content` escapes the region clamp, with a ceiling of `min(20rem, 100dvw − 4rem)` (default; hosts override `max-inline-size` for wide panels). Without anchor support, auto width resolves against the viewport as before.

## Do not

- Do not emulate a popover with `div` + JS toggle — you lose light dismiss, Escape, and top layer.
- Do not add JS for open/close — `popovertarget` is declarative.
- Do not use `position-visibility: anchor-valid/visible` — outside the supported matrix.
- Do not make the popover modal — Dialog exists for modality.
