# Timeline

## Purpose

Event chronology: a list of events in order with a connecting rail and markers. Not interactive; the order is set by the host. One canonical element — `<ol>` with `role="list"`, no JS.

## Native basis

- Elements `<ol>/<li>`: native list semantics (sequence, item structure) — `list`/`listitem` roles built in.
- Order is the host's: `reversed` on `<ol>` for "newest first" — a native attribute with native reversed-order semantics, no JS.
- `role="list"` guards against the `list-style: none` quirk (VoiceOver historically lost list semantics when markers were removed; harmless everywhere).
- Opt-in styling: a bare `<ol>` is a native list with markers; the class adds the visual vocabulary (rail, ring, indent) without a second implementation.
- No states: no `:hover`, no focus, no JS.
- Forced colors: rail and ring are borders — the system recolors them natively; the ring fill follows system canvas.

## Canonical markup

```html
<ol class="ui-timeline" role="list">
  <li>
    <p class="ui-timeline-meta">Oct 29, 2026</p>
    <h3>Component shipped</h3>
    <p>Body text.</p>
  </li>
</ol>
```

- `role="list"` is part of the canon.
- Item content is host content: `ui-timeline-meta` is an optional class (small line — date, stage); heading and body are any host elements (h3, p, …) with no component styles (base typography).
- `reversed` on `<ol>` for "newest first".
- `margin-block` inside an item stays host content; between items the component owns the spacing (`padding-block-start`, not margin — margin would break the rail line).
- External margins of the item's first/last child are zeroed.
- All layout is logical properties — mirrors in RTL.
- Marker centered on the first content line: offset = `(1lh - size) / 2`; adjust via `--ui-timeline-marker-offset` if the first child has its own font metrics.

## Variants and sizes

- No variants, no size variants, no `data-*` attributes — one canonical vertical component; horizontal layouts are the host's job.
- Local tokens (host overrides, no variant classes):
  - `--ui-timeline-marker-size` — ring size (default `--ui-space-md`, 16px);
  - `--ui-timeline-indent` — item indent from the rail (default `--ui-space-xl`);
  - `--ui-timeline-line-width` — rail and ring thickness (default `2px`);
  - `--ui-timeline-gap-block` — inter-item spacing (default `--ui-space-lg`);
  - `--ui-timeline-rail-color` — connecting rail color (default `border`);
  - `--ui-timeline-marker-color` — ring color (default `border-strong`);
  - `--ui-timeline-marker-fill` — ring fill (default `surface`, opaque — masks the rail behind the ring);
  - `--ui-timeline-marker-offset` — vertical marker offset (default `calc((1lh - var(--ui-timeline-marker-size)) / 2)`).

## States

- No states: no hover, no focus, no animations (reduced motion handling not required).
- Forced colors: rail and ring recolor natively as borders; ring fill follows system canvas.

## Keyboard and accessibility

- Native `list`/`listitem` roles; sequence order is native list semantics; direction (`reversed`) is the host's.
- Decorative by construction: rail and markers carry no meaning (WCAG 1.4.1) — structure and chronology are expressed by the list items.
- `ui-timeline-meta` is styled as a small muted line.

## Do not

- Do not replace `<ol>/<li>` with `<div>` grids — list semantics would be lost.
- Do not use Timeline for step progress ("done/current/upcoming") — that is Stepper, a separate component.
- Do not put `ui-timeline-meta` in an item more than once, and do not make it the item's only content (it is a caption, not content).
- Do not make a horizontal variant in markup — the component is vertical; horizontal layouts belong to the host.
- Do not set inter-item spacing via margin — inter-item rhythm belongs to the component; do not style the marker/rail with classes — only local token overrides.
- Do not reference `--ui-base-*` in host overrides — only semantic `--ui-*` tokens.
