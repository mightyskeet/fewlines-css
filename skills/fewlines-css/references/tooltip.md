# Tooltip

## Purpose
Short hint for an interface element: icon-button caption, term explanation, field hint. Shows on hover or focus of the trigger, hides on pointer/focus loss, Escape, or click outside. Not modal, does not capture focus.

## Native basis
- Popover API: `popover="hint"` on the tip — a tooltip-state popover, opened via an interest invoker.
- Interest invokers: `interestfor="tip-1"` on `<button>`/`<a>` — hover and focus show the tip natively, loss of interest closes it (Chrome/Edge 142+; long-press on touch).
- Engines without interest (Firefox, Safari) get a CSS activation fallback: the tip opens on hover (`@media (hover: hover) and (pointer: fine)`) and on focus (`:focus-visible`) as plain CSS showing, gated by `@supports not selector(:interest-source)`. Click remains the trigger's action; the description stays linked via `aria-describedby` (available to AT in all engines). Accepted fallback limits: Escape does not close a CSS-shown tip (closes on pointer leave/blur); the tip is not in the top layer (an ancestor with `transform`/`filter` may clip); pointer can still move onto the tip text (bridge on the trigger + transparent top border); touch excluded (sticky hover); `interest-delay-*` delays not reproduced (instant show).
- `popover="hint"` gives: only one hint tip at a time (a new one closes the previous), the tip does not close `popover="auto"` (menus stay open), the pointer can move onto the tip text (hoverable, WCAG 1.4.13), auto-dismiss on loss of interest.
- Engines without the `hint` keyword treat it as invalid and degrade to `popover="auto"` by invalid-value default — the element stays a fully functional dismissible popover.
- The `tooltip` role is implicit (minimal) with `popover="hint"`; for engines outside the matrix the host may add `role="tooltip"` for uniform roles.

## Canonical markup
```html
<button class="ui-tooltip-trigger" type="button" interestfor="tip-save" aria-describedby="tip-save">
  Save
</button>
<span class="ui-tooltip" id="tip-save" popover="hint">Saves your changes</span>
```
- Trigger: host interactive element (usually `ui-button`); the `ui-tooltip-trigger` class on the trigger enables anchor positioning (declares `anchor-name`).
- Tip: a sibling element with `id` (not a child: text inside the trigger would enter its accessible name).
- `aria-describedby` is required in canonical markup: delivers the description to AT in all engines.
- Opt-in click-show for inert triggers: host adds `popovertarget="tip-save" popovertargetaction="show"` to the trigger; never on action triggers (on a submit button `popovertarget` is ignored; on a type="button" action, click would both act and show the tip).
- Text is short (1–2 lines, `max-inline-size: 20rem` default); do not set `role="tooltip"` — the role comes natively from `popover="hint"`.
- Show/hide delays are native; host tunes them with `interest-delay-start` / `interest-delay-end` attributes on the trigger.

## Variants and sizes
- One canonical variant; no `data-variant`/`data-size`.
- Placement: below the trigger, centered (`block-end center`) with automatic flip up (`block-start center`) when space is short.
- Custom placement, long or interactive content — that is Popover (`data-block`/`data-inline`), not Tooltip.

## States
- open — `:popover-open` (native pseudo-class); in engines without interest, opening is CSS showing (`display: block` via `:hover`/`:focus-visible`) and `:popover-open` does not apply.
- interest/hover/focus — native invoker states; no JS and no state classes.
- Pointer retention onto the tip — `:hover` on the tip + bridge on the trigger + transparent top border (the gap is part of the tip's hit box).
- Entrance animation — `@starting-style` + `transition-behavior: allow-discrete`; exit animates back to the hidden state (in the popover path, exit animation works in Chromium; Firefox/WebKit close instantly; in the CSS fallback the exit animates in all engines).
- Reduced motion — disabled via media query.
- Forced colors — `forced-color-adjust: auto`.

## Keyboard and accessibility
- Trigger–tip link: `aria-describedby` (+ the native interest association).
- WCAG 1.4.13 (Content on Hover or Focus): in the popover path satisfied natively — dismissible (Escape/light dismiss), hoverable (pointer can move to the tip text), persistent (visible until interest is lost). In the CSS fallback hoverable and persistent hold, but dismissible is broken: Escape does not close a CSS-shown tip — a deliberate trade-off; closing is pointer leave/blur.
- No focus capture; keyboard: focus on the trigger opens the tip (natively with interest, `:focus-visible` fallback without), focus loss closes, Escape closes only the popover path; the description stays linked via `aria-describedby` in all engines; opt-in click-show (popovertarget) opens with Enter/Space on an inert trigger.
- Typography: `sm` step (14→14.5px, 400); elevation `--ui-elevation-2`.

## Do not
- Do not add JS for opening/closing — interest is declarative.
- Do not add `popovertarget` on action triggers — click must perform the action, not show a tip; opt-in click-show is for inert triggers only ("?" buttons, actionless icons).
- Do not make the tip a child of the trigger — its text would enter the trigger's accessible name.
- Do not set `role="tooltip"` in canonical markup — the role is native with `popover="hint"` (the host may add it temporarily while Safari lacks `hint`).
- Do not put interactive content in the tip or turn it into a panel — that is Popover; do not set `data-block`/`data-inline` — Tooltip has one canonical placement with native flip.
- Do not use `title` — the native title is unstyleable and unreachable by keyboard.
- Do not rely on `position-visibility: anchor-valid/visible` — outside the support matrix.
