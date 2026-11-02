# Tree

## Purpose

Nested content tree with rail indentation: reply chains, outlines, file lists. Container + nodes; branch collapsing is native (`<details>`), no JS. Not an interactive treeview control (ARIA tree semantics without a JS layer is impossible — docs/TODO.md); the disclosure tree covers display.

## Native basis

- Nested `<ul>/<li>`: native list semantics (structure comes with the nesting) — `list`/`listitem` roles built in.
- Branch node: `<details>/<summary>` — native disclosure, native keyboard (Enter/Space on summary), native `open` attribute. A static (always-open) branch is `<li>text<ul>…</ul></li>` — same geometry, no disclosure.
- `role="list"` on every list guards against the `list-style: none` quirk (VoiceOver historically lost list semantics when markers were removed; harmless everywhere).
- Opt-in styling: a bare `<ul>` is a native list; the class adds the rail-and-elbow vocabulary (guide lines, indent).
- No component states: no hover, no focus on the tree itself; the summary keeps the native focus ring from the base layer. No JS.
- Collapsing is instant (native): the `::details-content` animation's `overflow: hidden` would clip the rail's drop segment, which deliberately overhangs the list box — an animated collapse would require a second line-drawing mechanism (one canonical implementation). The Accordion owns the animated disclosure pattern.

## Canonical markup

```html
<ul class="ui-tree" role="list">
  <li>package.json</li>
  <li>
    <details open>
      <summary>src</summary>
      <ul role="list">
        <li>button.css</li>
        <li>
          <details>
            <summary>fields</summary>
            <ul role="list">
              <li>input.css</li>
            </ul>
          </details>
        </li>
      </ul>
    </details>
  </li>
</ul>
```

- `role="list"` is part of the canon on every list.
- Node content is host content: leaf nodes are any host elements (text, links, bubbles); the component only zeroes the outermost margins of the node's first/last children.
- Branch nodes: `<details open>` (open by default is the host's choice); the summary is the node line and keeps the native disclosure marker (native forced-colors and RTL mirroring for free).
- The horizontal branch exits at the node's first-line center (`(1lh + line-width) / 2`); the vertical children rail hangs one line width left of the parent's text edge and drops from the parent's first-line center.
- All layout is logical properties — mirrors in RTL.

## Variants and sizes

- No variants, no size variants, no `data-*` attributes — one canonical vertical component.
- Local tokens (host overrides, no variant classes):
  - `--ui-tree-indent` — nesting step (default `--ui-space-md`);
  - `--ui-tree-gap-block` — inter-node spacing (default `--ui-space-2xs`);
  - `--ui-tree-line-width` — rail thickness (default `2px`);
  - `--ui-tree-node-offset` — first-line center from the node's top (default `calc(0.5 * 1lh + 0.5 * var(--ui-tree-line-width))`; adjust if the node text has its own font metrics, e.g. a heading);
  - `--ui-tree-rail-color` — guide line color (default `border`);
  - `--ui-tree-rail-radius` — elbow corner radius (default `--ui-radius-sm`).

## States

- No component states: no hover, no focus, no animations (reduced motion handling not required; collapsing is instant).
- `details[open]` is the native branch state; closed branches simply shrink the node's box — the rails re-flow themselves.
- Forced colors: rails are borders — the system recolors them natively; the disclosure marker is native.

## Keyboard and accessibility

- Native `list`/`listitem` roles; the hierarchy is native nesting.
- Disclosure branches: Enter/Space on the summary toggle natively; the accessible name is the summary content; `aria-expanded` is not needed (state is read from the native `open`).
- Decorative by construction: rails carry no meaning (WCAG 1.4.1) — the structure is in the nesting.
- Summary links/controls inside node content keep native focus and keyboard behavior.

## Do not

- Do not use anchor positioning for the connectors: with a repeated anchor name (`--comment` on every comment) `anchor()` resolves to the first element in tree order — every reply would attach to the first comment; `anchor-scope` only narrows the search and cannot select a parent outside the reply's subtree. Flat-DOM threads would need host-generated unique anchor names; in nested DOM the borders need no anchors at all.
- Do not replace the nested `<ul>/<li>` with `<div>` grids — the list semantics are the contract.
- Do not emulate ARIA `tree`/`treeitem` roles — the interactive treeview is out of scope without a JS layer; the disclosure tree covers display.
- Do not add a collapse animation via `::details-content` — its `overflow: hidden` clips the rail drop segment (see Native basis).
- Do not set inter-node spacing via margin — inter-node rhythm belongs to the component.
- Do not style the rails with classes — only local token overrides.
- Do not reference `--ui-base-*` in host overrides — only semantic `--ui-*` tokens.
