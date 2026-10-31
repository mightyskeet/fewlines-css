# Fieldset

## Purpose

Grouping of related form controls: a frame with a break for the legend, a common accessible group name, native group disabling. Zero JS.

## Native basis

- `<fieldset>`/`<legend>` — group semantics and accessible name (legend) are native.
- `fieldset[disabled]` natively disables all descendant controls (controls inside the first `legend` are exempt per the HTML spec).
- The component has no states: no hover, no focus, no JS.
- Layout uses the native flow: spacing between members comes from existing stack rules (`.ui-field + *`, `.ui-switch-field + .ui-switch-field`). No grid/flex on `<fieldset>`.
- UA pitfalls handled: `min-inline-size: min-content` reset to `0` (otherwise fieldset overflows on wide descendants), UA `margin-inline: 2px` reset, explicit font and padding on the legend.

## Canonical markup

```html
<fieldset class="ui-fieldset">
  <legend class="ui-fieldset-legend">Shipping address</legend>
  <label class="ui-field">
    <span class="ui-field-label">Street</span>
    <input class="ui-input" type="text" placeholder="Main st. 1" />
  </label>
</fieldset>
```

- `.ui-fieldset-legend` is required — it is the group's accessible name and the native frame break.
- Stacked groups: adjacent `.ui-fieldset` get a gap automatically (`.ui-fieldset + .ui-fieldset`); a fieldset after a field gets the gap from `.ui-field + *`.
- Classic radio group ("pick one of N"): native `<input type="radio">` under the legend, members styled with the Choice component (`ui-choice-field` + `ui-radio`).

## Variants and sizes

None. The group is a container; meaning is carried by its members.

## States

- `:disabled` on the fieldset (the `disabled` attribute) — the legend dims to `text-muted`; controls dim themselves with their own disabled styles. Group disabling is native, not emulated.

## Keyboard and accessibility

- `group` role and name are native (legend); for radio groups the legend is the required replacement for repeated labels.
- Forced colors — `forced-color-adjust: auto`: the frame becomes a system color, structure preserved.

## Do not

- Do not style a `<div>` instead of `<fieldset>` — group semantics are native.
- Do not remove the legend — the group name is mandatory.
- Do not introduce grid/flex on the fieldset — legend-in-frame-break layout belongs to the engine.
- Do not emulate group disabling with a JS walk over descendants — `fieldset[disabled]` is native.
- Do not use `fieldset` as a decorative frame for content without controls — use headings for sections, Divider for breaks.
