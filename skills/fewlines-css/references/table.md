# Table

## Purpose

Tabular data: registries, reports, dashboards, comparison lists. The component styles a native `<table>` and adds nothing to its semantics: roles, `<caption>` association, `scope` on headers are native. Zero runtime JS.

## Native basis

- Elements: `<table>`, `<caption>`, `<thead>`, `<tbody>`, `<tfoot>`, `<tr>`, `<th scope="col|row">`, `<td>`.
- Native roles: `table`, `row`, `columnheader`, `rowheader`, `cell`; `<caption>` natively becomes the table's accessible name (required in canonical markup).
- Border model: `border-collapse: separate` + `border-spacing: 0` + explicit cell borders — a portable base (Firefox does not draw borders on sticky headers under `collapse`).
- Forced colors: background and borders are substituted by the system automatically; no special block needed.

## Canonical markup

```html
<table class="ui-table">
  <caption>
    Quarterly revenue
  </caption>
  <thead>
    <tr>
      <th scope="col">Region</th>
      <th scope="col" data-align="end">Q3</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">EMEA</th>
      <td data-align="end">1 250 000</td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <th scope="row">Total</th>
      <td data-align="end">3 960 000</td>
    </tr>
  </tfoot>
</table>
```

- `<caption>` is the table caption and its accessible name.
- Column headers: `<th scope="col">`; row headers: `<th scope="row">`.
- The table is typographically more compact than the document: the `sm` step of the fluid scale (14→14.5px, 400) on `.ui-table`; the host may restore `font-size: var(--ui-font-size-default)` (or `font-size: inherit`).

Wide tables — wrapper `.ui-table-wrap` (horizontal scroll):

```html
<div class="ui-table-wrap" tabindex="0" role="region" aria-label="Backlog, scrollable">
  <table class="ui-table" data-sticky>
    …
  </table>
</div>
```

Required wrapper attributes for a scrollable table: `tabindex="0"` (keyboard scroll), `role="region"` + `aria-label` (the region must be findable and named). With `data-sticky`, the header sticks to this wrapper.

## Variants and sizes

- `data-zebra` on `<table>` — striped zebra: odd body rows on `surface-raised`.
- `data-sticky` on `<table>` — sticky header: `thead th` sticks to the top of the nearest scroll container (the wrapper with constrained height, or the page if there is no wrapper). The header background becomes opaque (`surface`) only in this mode.
- `data-align="end"` on `th`/`td` — end-aligns the cell (numeric columns) + tabular figures (`font-variant-numeric: tabular-nums`); set on every cell of the column (and its header).
- `data-mono` on `th`/`td` — monospace cell font (`--ui-font-mono`); numeric/code columns (prices, ids, hashes); set on every cell of the column.
- Default — no attributes: even rows, hairline separators, muted headers.
- No `data-variant`/`data-size`; classes for variants are forbidden.

## States

- `tbody tr:hover` — hover fill on body rows (`--ui-color-hover`); uniform for plain and zebra rows.
- No other states: no focus, disabled, open — the component is static; no animations (reduced motion not required).

## Keyboard and accessibility

- `<caption>` is required — it is the table's accessible name; a scroll wrapper is named with `aria-label` + `role="region"`.
- `scope="col"/"row"` is required on `th` — without it header associations are incomplete.
- Hover is not the only row cue: rows differ by content and separators (color is not a meaning carrier).
- Keyboard: the scrollable wrapper gets `tabindex="0"` (host); the table itself is not focusable.

## Do not

- Do not emulate a table with a `<div>` grid — semantics and header associations are native only to `<table>`.
- Do not remove `<caption>` or `scope` — the accessible name and header associations rest on them.
- Do not rely on sticky for `thead`/`tr` — only `thead th`.
- Do not use `data-variant`/classes for variants — only `data-zebra`, `data-sticky`, `data-align`, `data-mono`.
- Do not style sorting/row selection in core — those are host states.
- Do not reference `--ui-base-*` in host overrides — only semantic `--ui-*` tokens.
- Do not give the wrapper a fixed height without need: sticky binds to the nearest scroll container — a non-scrolling wrapper pushes sticking to the page (tables without a wrapper only).
