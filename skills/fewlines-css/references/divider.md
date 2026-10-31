# Divider

## Purpose

Thematic break between content sections with a choice of line style. Non-interactive, carries no content. Zero JS.

## Native basis

- `<hr>` — native thematic break; the `separator` role is built in.
- The component is opt-in styling over the base layer: a bare `<hr>` is already rendered as a single `--ui-color-border` line.
- No states: no `:hover`, no focus, no JS.
- Forced colors: the border is recolored by the system automatically.

## Canonical markup

```html
<hr class="ui-divider" />
```

- The empty `<hr>` is self-sufficient; `class` is the only contract. No content and no accessibility attributes needed.
- Spacing comes from the component's `margin-block`; hosts override with semantic tokens, not classes.

## Variants and sizes

`data-variant="dashed|strong"`; default is solid, attribute omitted:

| Value    | Meaning                                                                                    |
| -------- | ------------------------------------------------------------------------------------------ |
| `dashed` | Dashed line; same `--ui-color-border` tone, only the style changes.                        |
| `strong` | More contrasty line in `--ui-color-border-strong`; emphasis via color role, not thickness. |

`data-inset="start|both"` — orthogonal modifier, combines with any variant:

| Value   | Meaning                                                                                                       |
| ------- | ------------------------------------------------------------------------------------------------------------- |
| `start` | Inset from the logical inline start (line yields to the leading content column, e.g. under avatars in lists). |
| `both`  | Symmetric inset on both sides.                                                                                |

Mirrors automatically in RTL (logical properties, `margin-inline`). Variant and inset are independent axes: "inset and dashed" is `data-variant="dashed" data-inset="start"`.

`data-size="sm|lg"`; default is md, attribute omitted. Only block spacing changes (sm/md/lg map to `--ui-space-sm`/`--ui-space-md`/`--ui-space-lg`); line thickness is always 1px.

## States

- None — static divider. Differences only via `data-variant`, `data-inset`, `data-size`.
- No animations, so reduced motion handling is not needed.

## Keyboard and accessibility

- Native `separator` role; not focusable, no content.
- The divider is decorative by construction: the meaning of the transition is carried by surrounding content (headings); line color is not a carrier of meaning.
- Forced colors recolor the border automatically.

## Do not

- Do not replace `<hr>` with a classed `<div>`/`<span>` — you lose the native thematic break.
- Do not put text or interactive elements in the break — use `<h1>`–`<h6>` for section headings, `<figcaption>` for captions.
- Do not style variants with classes (`.ui-divider-dashed`) — use `data-variant`; inset only via `data-inset`; density only via `data-size`.
- Do not make the line thicker than 1px via host overrides — "strong" is the `strong` variant (color), not weight.
- Do not reference `--ui-base-*` from host overrides — only semantic `--ui-*` tokens.
