# Tabs

## Purpose
Switching a visible panel from a set while keeping the address: tabs are native links to their panels, state lives in the URL fragment. One canonical element — `<div class="ui-tabs">` alternating "link → its panel", no JS.

## Native basis
- Elements are `<a href="#…">`: native fragment navigation. Clicking a link navigates to the panel, the panel becomes the fragment target (`:target`) — switching, back button, and deep links come with the platform.
- Active tab: the link immediately preceding the target panel — `.ui-tab:has(+ .ui-tabs-panel:target)`. The "link → panel" adjacency in the DOM is the linking mechanism; pairs are not duplicated in CSS and need no JS.
- Default (no panel of the group in the fragment): the first pair is open — via `:has()` on the group.
- Roles are not faked: these are navigation links (not `role="tab"` — faking the role would lie about the keyboard model: ARIA tabs use arrows and roving tabindex, unavailable without JS).
- `<section>` is the panel: a thematic section with a host heading; heading navigation reads the open panel natively.
- Radio-button tabs are rejected semantically: `<input type="radio">` is announced by AT as a form switch, not a tab; links give the same capability without JS plus URL/history.

## Canonical markup
```html
<div class="ui-tabs">
  <a class="ui-tab" id="release-overview" href="#release-overview-panel">Overview</a>
  <section class="ui-tabs-panel" id="release-overview-panel" aria-labelledby="release-overview">
    <h3>Overview</h3>
    <p>…</p>
  </section>
  <a class="ui-tab" id="release-specs" href="#release-specs-panel">Specs</a>
  <section class="ui-tabs-panel" id="release-specs-panel" aria-labelledby="release-specs">
    <h3>Specs</h3>
    <p>…</p>
  </section>
</div>
```
- Link `href` = its panel's `id`; `id` on the panel is required (fragment target), `id` on the link is required (panel name via `aria-labelledby`).
- `ui-tabs-panel` is the immediate sibling following its link.
- `aria-labelledby="…"` on the panel (name = tab label) is part of the canon: the panel gets an accessible name without JS.
- The heading inside the panel is host content; the component only zeroes the first child's outer margin.
- `data-vertical` on the container — vertical variant (rail of links, panel to the right); horizontal by default.

## Variants and sizes
- No `data-variant`, no sizes.
- `data-vertical` on the container — vertical layout (rail of links, panel beside it); default is horizontal.
- Local tokens for host overrides: `--ui-tabs-accent` (accent color), `--ui-tabs-rail` (vertical rail column width), `--ui-tabs-gap` (between links), `--ui-tabs-gap-block` (strip ↔ panel), `--ui-tabs-rail-gap` (rail ↔ panel), `--ui-tabs-scroll-margin` (`scroll-margin-block-start` of the panel; adjust when the strip wraps to multiple lines or link padding is custom).

## States
- Active tab — `:has(+ .ui-tabs-panel:target)`; default tab — `:has()` on the group. No state classes.
- Hidden panels — `display: none`: outside the accessibility tree and focus order.
- Hover on links — `--ui-color-hover` fill (pointer-gated).
- Panel entrance animated: fade + slight rise via `@starting-style` + `transition-behavior: allow-discrete`; transition declared only on the visible state — exit is instant (entry-only motion).
- Reduced motion: transitions disabled.
- Forced colors: text is recolored by the system, the indicator is a border (rec colored natively); transparent borders render as currentcolor.

## Keyboard and accessibility
- Semantics: native links — announced as links, Tab focus in order, Enter activation; roles `tab`/`tabpanel` are not faked.
- After activation, focus follows to the fragment target (the panel) — native anchor behavior; the next Tab enters the open panel's content; deep links land in the panel directly.
- Hidden panels are `display: none` — outside the accessibility tree.
- Active-tab state for AT is not natively expressible without JS; a host JS layer (`aria-current` by hash) is a host add-on, not part of core.
- Fragment navigation scrolls the target to the top; `scroll-margin-block-start` (via `--ui-tabs-scroll-margin`) keeps the strip in frame in the horizontal variant. The jump cannot be fully suppressed by CSS.

## Do not
- Do not fake roles: `role="tab"`/`aria-selected` without JS lie about the keyboard model; link tabs stay honest links.
- Do not break the "link → its panel" adjacency with wrappers — switching rests on it.
- Do not give two panels the same `id`, and do not leave `href` without a target — the fragment finds one panel; a targetless link does not activate the tab.
- Do not attach `scroll-target-group` to the group — scrollspy highlighting would diverge from the open panel.
- Do not style states with classes — active tab is `:has(+ .ui-tabs-panel:target)`; override only via local tokens.
- Do not rely on state persistence beyond the URL: another fragment on the page returns every group to its first tab — documented behavior.
