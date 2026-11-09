# Avatar

## Purpose

Person/entity identity: a user photo in a header, comment, list row, or chat
message; presence (status dot); a stacked group of participants. Not
interactive. No JS.

## Native basis

- The platform has no native avatar element — the component is a static
  `<span>`; the semantic layer belongs to the host application:
  - identity — the `<img>` is the named element (role `img` from its
    `alt`); the container itself is role generic and has no name;
  - decorative image — `alt=""`, the host names the person in surrounding
    text or on the container (`aria-label`).
- The element is a `<span>`: inline, no role, no focus, no states;
  interactive avatars are forbidden (clickable profiles wrap the avatar in
  a host link).
- `object-fit: cover` crops any source ratio into the circle (Can I Use:
  baseline — Chrome 32, FF 36, Safari 10; `docs/compatibility.md`,
  2026-11-09).
- The image rounds itself (`border-radius: inherit`), not the container
  (`overflow: hidden` would clip the status dot that sits on the edge).
- The `surface-tint` background shows through while the image loads and
  behind broken images; fallback content (initials) is host styling — the
  container centers whatever it holds (inline-flex, centered).
- Theming: `light-dark()` in the semantic tokens the dot consumes.
- forced colors — the dot fill is stripped to the system canvas; its ring
  border is repainted `CanvasText` so the indicator stays visible.

## Canonical markup

```html
<span class="ui-avatar"><img src="ada.jpg" alt="Ada Lovelace" /></span>
<span class="ui-avatar" data-status="online"><img src="ada.jpg" alt="Ada Lovelace" /></span>
```

- The `<img>` is the direct child and fills the circle; the host controls
  framing via `object-position` if the default center crop is wrong.
- With no image the host may put initials text (or a host-styled span) into
  `.ui-avatar` — it is centered; keep the same size token.

## Status dot

`data-status` renders a `::after` indicator at the inline-end/block-end
corner; its center sits exactly on the image-circle edge. The inset is
derived from the diagonal geometry — `(size/2 − ring)·(1 − cos(45°)) −
dot/2` (the sin/cos precedent: Progress circle), not a magic number;
plain absolute positioning — the dot is a child pseudo-element, anchor
positioning binds cross-element pairs and stays partial in the matrix.
The dot is a third of the avatar size (scales with `--ui-avatar-size`);
its own page-surface ring separates it from the image and the page.
Colors map to the existing families — the system deliberately has no
success family (`docs/theme.md`):

| Attribute              | Meaning                      | Token                  |
| ---------------------- | ---------------------------- | ---------------------- |
| `data-status="online"` | available                    | `--ui-color-brand`     |
| `data-status="away"`   | inactive / idle — light gray | `--ui-color-border`    |
| `data-status="busy"`   | do not disturb / urgent      | `--ui-color-attention` |
| _(no attribute)_       | no dot                       | —                      |

Presence must not rely on color alone (WCAG 1.4.1): the host conveys the
state with text or the accessible name; the dot is decorative. `away` is
the light gray `border` (on the dark surface `border` vanishes, so the
dark half steps up to `border-strong`) — decorative by the border/divider
policy. An unknown
value renders the online (brand) dot.

## Group

```html
<span class="ui-avatar-group">
  <span class="ui-avatar"><img src="a.jpg" alt="A" /></span>
  <span class="ui-avatar"><img src="b.jpg" alt="B" /></span>
</span>
```

- Adjacent avatars stack: negative `margin-inline-start` (mirrors in RTL).
- Inside the group every avatar wears a page-surface ring (`border`) so the
  overlap reads as separate circles; a standalone avatar has no ring.
- The host owns the group's accessible semantics (e.g. an `aria-label`
  naming the people, "and N more").

## Sizes

`data-size="sm|lg"`; default is md (no attribute). Sizes come straight from
the fluid space scale (scale 1: sm 24px, md 32px, lg 48px):

| Size         | Attribute        | Token            |
| ------------ | ---------------- | ---------------- |
| sm           | `data-size="sm"` | `--ui-space-lg`  |
| md (default) | _(no attribute)_ | `--ui-space-xl`  |
| lg           | `data-size="lg"` | `--ui-space-2xl` |

The host resizes declaratively by overriding `--ui-avatar-size` on any
scope; the dot scales with it (a third of the size).

## States

No states (static container). Differences only via `data-status` and
`data-size`.

## Keyboard and accessibility

- The container is role generic, not focusable; the `<img>` is the named
  element (its `alt` is the name). A text-only fallback (initials) must be
  named by the host (e.g. `aria-label` on the container).
- WCAG 1.4.1 (Use of Color): presence is never color-only — the host states
  it in text or the name.
- The dot pairs are validated at the non-text threshold (WCAG 1.4.11):
  brand/surface (the Stepper pair), attention/surface (the spellcheck
  pair); the away dot is the border tone — decorative by the border/divider
  policy.
- reduced motion — not required, there are no animations.

## Do not

- Do not make an avatar interactive — wrap it in a host `<a>`/`<button>`
  only outside the component.
- Do not clip the image with `overflow: hidden` on the container — the
  status dot must reach the circle edge; the image rounds itself.
- Do not add variant classes (`.ui-avatar-square`) — the circle is the
  canonical shape; a square host styling is a host override.
- Do not rely on color as the only presence signal (WCAG 1.4.1).
- Do not put non-image content other than text/initials fallback inside —
  widgets (badges, chips) are siblings, not children.
- Do not reference `--ui-base-*` from host overrides — only semantic `--ui-*`.
