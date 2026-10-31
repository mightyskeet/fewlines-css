# Dialog

## Purpose
Modal window over the page: confirmations, forms, important messages. A non-modal overlay is not a dialog — use Popover.

## Native basis
- `<dialog>` — native element with top-layer behavior.
- `showModal()` / `close()` — native methods (called by the host application; core contains no runtime JS).
- `::backdrop` — native pseudo-element.
- Escape — native closing of a modal dialog.
- Focus trapping — native (first focusable element / `autofocus`).
- `<form method="dialog">` — closing via a button without JS.
- `:modal` — native pseudo-class distinguishing modal mode.
- `dialog[open]` — native state attribute.

## Canonical markup
```html
<button class="ui-button" type="button" onclick="dlg.showModal()">Open</button>

<dialog class="ui-dialog" id="dlg">
  <h2>Confirm</h2>
  <p>Are you sure?</p>
  <form method="dialog">
    <button class="ui-button" type="submit">Close</button>
  </form>
</dialog>
```

## Variants and sizes
One canonical variant. Core default width — `max-inline-size: min(90dvw, 32rem)` (`dvw` resolves against the initial containing block — no classic scrollbar, unlike `100vw`). Other sizes — host styles via `max-inline-size`.

## States
- open — `dialog[open]` (native attribute); background page scroll is locked — `html:has(.ui-dialog[open])` sets `overflow: hidden` + `scrollbar-gutter: stable` (layout does not jump; on pages without a scrollbar the reserved gutter creates a track; iOS Safari may scroll the background — UA limitation).
- modal — `:modal` (native pseudo-class).
- backdrop — `::backdrop`.
- Enter and exit animation: the transition is declared on the element, the hidden state in base styles (`opacity: 0`, `translate: 0 0.5rem`); entry is anchored by `@starting-style` + `transition-behavior: allow-discrete` for `display`/`overlay`. Exit is animated in Chromium (via `overlay`), instant in Firefox/WebKit — graceful degradation; the scrim fades both ways.
- reduced motion — animations disabled via media query (both directions).

## Keyboard and accessibility
- Role `dialog` is native; accessible name — the heading inside or `aria-labelledby`.
- Escape closes natively; focus returns to the trigger natively.
- Focus trap is native — first focusable element or `autofocus`.
- The backdrop does not capture focus.

## Do not
- Do not emulate a dialog with `div` + `position: fixed` — top layer, focus trap, and Escape are lost.
- Do not add JS for Escape/backdrop — that is native behavior.
- Do not drop `<form method="dialog">` for close buttons — it is the JS-free path.
- Do not style the closed state with `dialog:not([open])` — natively `display: none`; the hidden state for exit animation is set on the base class.
- Do not use `show()` (non-modal mode) — top layer, `::backdrop`, and Escape are lost; non-modal overlays belong to the Popover API.
