# Alert

## Purpose

Feedback message: informational callout, operation result, error. Color variation via semantic tokens (tint surfaces), no JS.

## Native basis

- The platform has no native "alert" element — the component is static; the semantic layer belongs to the host application:
  - static callout — no role;
  - dynamic insertion, important (errors) — host adds `role="alert"` (assertive live region);
  - dynamic insertion, less urgent — `role="status"` (polite).
- The component has no states: no `:hover`, no focus, no JS.
- Theming: `light-dark()` in the `*-tint` tokens; the neutral default consumes `surface-tint` and `border-strong` — page-neutral, brand-independent.
- forced colors — `forced-color-adjust: auto`: the system removes the tint background, the border becomes a system color, structure is preserved.

## Canonical markup

```html
<div class="ui-alert">
  <p class="ui-alert-title">Heads up</p>
  <p class="ui-alert-body">A new version is available.</p>
</div>
```

- `.ui-alert-title` and `.ui-alert-body` are optional: a short message can go directly into `.ui-alert` as text.
- Host content (lists, paragraphs) keeps inner spacing; outer spacing is trimmed (`> :first-child` / `> :last-child`) — the box hugs the content.
- Stacked alerts: adjacent `.ui-alert` get a gap automatically (`.ui-alert + .ui-alert`).

## Variants and sizes

| Attribute                  | Meaning                                                                                |
| -------------------------- | -------------------------------------------------------------------------------------- |
| _(no attribute)_           | default — neutral: gray callout (`surface-tint` + `border-strong`), carries no meaning |
| `data-variant="attention"` | urgency family (errors, destructive outcomes)                                          |

Local derived tokens `--ui-alert-accent` / `--ui-alert-surface` are remapped per variant. No size attributes.

## States

No states (static container). Differences only via `data-variant`.

## Keyboard and accessibility

- Role is the host's decision (see Native basis); the message text is the accessible name for a live region.
- WCAG 1.4.1 (Use of Color): color must not be the only carrier of meaning — the host must convey meaning with text or an icon inside the alert; core does not impose icons.
- reduced motion — not required, there are no animations.

## Do not

- Do not style variants with extra classes (`.ui-alert-error`) — only `data-variant`.
- Do not put interactive content (buttons, action links) in an alert — actions belong in Dialog/Popover; plain links are allowed as regular content.
- Do not add `role="alert"` to a static callout — a live region is only for dynamic insertion.
- Do not rely on color as the only variant signal (WCAG 1.4.1).
- Do not reference `--ui-base-*` from host overrides — only semantic `--ui-*`.
