# Pagination

## Purpose

Page sequence navigation for paged content: search results, tables, listings. One canonical element — `<nav>` with `<ul>` of links, no JS: navigation is native links, the page state lives in the URL. Not Breadcrumbs (position in the site hierarchy) and not a Stepper (process progress).

## Native basis

- Elements — `<nav aria-label="Pagination">` + `<ul>/<li>` + `<a href>`: the WAI-ARIA pagination pattern — landmark, list semantics and navigation come with the elements.
- Current page — native ARIA state `aria-current="page"` on a non-link `<li>` (a page does not link to itself); announced by screen readers, painted as the filled pill. No `:has()` leg: unlike Breadcrumbs/Stepper the state never sits on a child link.
- The component is opt-in styling: a bare `<nav>` with `<ul>` of links is already pagination; the class adds the visual vocabulary (pills, current fill, muted edges).

## Canonical markup

```html
<nav class="ui-pagination" aria-label="Pagination">
  <ul role="list">
    <li><a href="?page=1" rel="prev" aria-label="Previous page"></a></li>
    <li><a href="?page=1">1</a></li>
    <li aria-current="page">2</li>
    <li><a href="?page=3">3</a></li>
    <li aria-hidden="true">…</li>
    <li><a href="?page=12">12</a></li>
    <li><a href="?page=3" rel="next" aria-label="Next page"></a></li>
  </ul>
</nav>
```

- `role="list"` is part of the canon (guards against the `list-style: none` VoiceOver quirk).
- A page entry is `<a href>` inside `<li>`; the visible label is the number (the accessible name is the number itself).
- Edge controls (first/last `<li>`: the prev/next links and the disabled button) render **empty** — the chevron is drawn by the component (an SVG-mask pseudo, optically centered by construction). `aria-label` on an edge control is mandatory — an empty control has no other name.
- No glyph text (`‹`/`›`) in the edge controls — it doubles the drawn chevron and its ink never optically centers (a text glyph rides the font baseline).
- `rel="prev"` / `rel="next"` on the edge links is part of the canon.
- `aria-label` on `<nav>` is mandatory — the accessible name of the landmark ("Pagination").

### Truncated ranges and disabled edges

Skipped pages collapse into one `<li aria-hidden="true">…</li>` — pure punctuation, hidden from assistive tech. An unavailable edge (no previous on page 1) is a native disabled button — the Button twin pattern (`<a>` navigates, `<button disabled>` marks the off state):

```html
<li><button type="button" disabled aria-label="Previous page"></button></li>
```

- The disabled button keeps the pill geometry (the row stays steady), renders muted and is skipped by the keyboard natively — no dead entry in the tab order.
- `aria-disabled` on a link is not the tool here: the link stays in the tab order (the Menu note).
- `<button>` appears in the canon only disabled; the host may omit the edge `<li>` entirely instead.
- Edge controls (links and the disabled button) carry `aria-label` — the drawn chevron is decorative, the name must come from the attribute.

## Variants and sizes

- No attribute variants (`data-variant`/`data-size` do not exist). Typography: the whole component rides `--ui-font-mono` — equal digit advances make every pill's width predictable (the Table data-mono precedent). Geometry lives in local tokens: `--ui-pagination-size` (default `1.75rem` — WCAG 2.5.8 met at rest), `--ui-pagination-gap` (default `--ui-space-2xs`), `--ui-pagination-color` (default `text`), `--ui-pagination-hover` (default `hover`), `--ui-pagination-muted` (default `text-muted`), `--ui-pagination-accent` (default `brand`), `--ui-pagination-on-accent` (default `on-brand`).
- Row alignment/centering on the page is host styling (`justify-content` on the `<ul>`).

## States

Native only: hover — `:hover` (pointer-gated, the sticky-hover guard) fills the pill; pressed — `:active` fills + shifts 1px; focus — the base `:focus-visible` ring; current — `aria-current="page"` (filled brand pill); disabled edge — native `:disabled` (muted, not focusable, `cursor: not-allowed`). The edge chevron paints with `currentColor`, so the muted/link states carry onto it for free; in RTL the chevron direction mirrors (the Tree precedent).

## Keyboard and accessibility

- Landmark `navigation` with a name ("Pagination"); `list`/`listitem` roles are native; links are native focus targets — Tab walks the page row.
- The current page is a non-link — not in the tab order, announced as the current page by `aria-current="page"`.
- The state is not color alone: the current entry is the only filled pill (and the only non-link text entry).
- The ellipsis is `aria-hidden` — screen readers skip it; the page sequence stays the accessible story.
- Edge links carry `aria-label`; the labels are announced, `rel="prev"/"next"` stays for the host's own metadata needs.
- Forced colors repaint the pills from the system palette; the focus ring follows the base contract.

## Do not

- Do not make the current page a link (`aria-current` on `<a>`) — a page does not link to itself; the current entry must not be in the tab order.
- Do not use buttons for enabled pages or `<a href="#">` stubs — entries are real links to real URLs; `<button>` appears only as the disabled edge.
- Do not render the disabled edge as bare text in `<li>` — it loses the pill geometry (the row shifts) and reads as punctuation, not as an off control.
- Do not add `data-*` state classes or `.is-current` — only `aria-current="page"`.
- Do not put glyph text or icons inside the edge controls — the chevron is drawn by the component; host content doubles it. A custom icon replaces the drawn one via host CSS (`display: none` on the pseudo).
- Do not omit `aria-label` on the edge controls — an empty control has no accessible name without it.
- Do not draw the ellipsis with component classes or images — it is a host-authored `<li aria-hidden="true">…</li>`.
- Do not reference `--ui-base-*` from host overrides — only semantic `--ui-*`.
