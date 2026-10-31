# Drawer

## Purpose
Non-modal panel sliding in from a viewport edge: filters, mobile menu, cart, auxiliary panels. The page stays interactive; the panel closes on Escape and outside click — natively. A blocking (modal) panel is a Dialog, not a Drawer.

## Native basis
- Popover API: `popover` attribute (auto) on the panel — top layer, light dismiss and Escape natively.
- Declarative triggers: `popovertarget` on `<button>`/`<input>`, `popovertargetaction="hide"` for the close button — open and close without JS.
- `:popover-open` — native state pseudo-class.
- `::backdrop` — native popover pseudo-element, styled like the Dialog scrim (fades on open/close); hosts may override or remove it.
- `autofocus` inside the popover moves focus into the panel natively on open.
- `@starting-style` + `transition-behavior: allow-discrete` — entry animation.

## Canonical markup
```html
<button class="ui-button" type="button" popovertarget="cart">Cart</button>

<aside class="ui-drawer" id="cart" popover data-variant="drawer-end">
  <h2>Cart</h2>
  <p>…content…</p>
  <button class="ui-button" type="button" popovertarget="cart" popovertargetaction="hide" autofocus>
    Close
  </button>
</aside>
```
- The panel is a semantic host element (`aside`, `nav`, `form`, `section`); `ui-drawer` class + `popover` attribute is the contract.
- Accessible name: a heading inside the panel, or `aria-label`/`aria-labelledby` on the panel (for nav drawers).
- `autofocus` on the first interactive element (or a heading with `tabindex="-1"`) moves focus into the panel on open.
- Close button with `popovertargetaction="hide"` is the JS-free path.
- Long content scrolls inside the panel (`overflow: auto` native UA style plus stretched height).

## Variants and sizes
| Attribute | Meaning |
|---|---|
| `data-variant="drawer-start"` | Logical inline-start edge (**default**, attribute omitted). |
| `data-variant="drawer-end"` | Logical inline-end edge. |

- Edges are logical: sides swap correctly in RTL.
- Geometry: full viewport height (`inset-block: 0` + `block-size: auto`), width `min(24rem, 100%)` — full width on narrow screens; no border radius.
- Top/bottom sheets are outside the vocabulary.

## States
- Open — `:popover-open` (native pseudo-class). Background page scroll is blocked: `html:has(.ui-drawer:popover-open)` sets `overflow: hidden` with `scrollbar-gutter: stable` so layout does not jump. In engines without `:popover-open` there is no blocking (progressive enhancement); iOS Safari may scroll the background (UA limitation).
- Closed — native UA `display: none`.
- Entry animation (`@starting-style` + `allow-discrete`) works in all supported engines.
- Exit animation works in Chromium/Edge (top-layer hold via `overlay`); in Firefox/WebKit the panel closes instantly — graceful degradation within the same implementation; the scrim fades with the panel where the exit is animated.
- Reduced motion — animations disabled by media query in both directions.
- Forced colors — `forced-color-adjust: auto`.

## Keyboard and accessibility
- Semantics and role come from the semantic host element (`nav`, `aside`, …); the Popover API does not override the role.
- Focus moves into the panel on open via `autofocus`; focus is **not** trapped — the panel is non-modal, Tab may leave to the page.
- Returning focus to the trigger on close is the host's responsibility (the Popover API has no native return, unlike Dialog).
- Escape closes natively; click outside closes (light dismiss) and the click reaches the element under the panel — the page stays interactive.
- The default scrim is visually like Dialog's, but semantics stay non-modal: clicking the scrim closes the panel **and reaches the element underneath**, focus is not trapped. Scroll lock is a host decision; for true blocking use Dialog.

## Do not
- Do not emulate a panel with `div` + `position: fixed` + JS toggle — you lose top layer, light dismiss, and Escape.
- Do not add JS for open/close — `popovertarget` is declarative.
- Do not make the drawer modal or add a focus trap — a blocking panel is a Dialog; a non-modal `dialog.show()` is forbidden.
- Do not use `data-block`/`data-inline` or anchor positioning — that is Popover; Drawer attaches to the viewport edge, not the trigger.
- Do not style the closed state with `[popover]:not(:popover-open)` — it is natively `display: none`; the hidden-state for exit animation lives on the base class.
- Do not use viewport units for width (`100vw` includes the classic scrollbar) — the contractual form is `min(24rem, 100%)`.
