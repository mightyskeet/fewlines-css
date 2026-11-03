---
name: fewlines-css
description: >
  Build UIs with fewlines-css — a platform-native CSS UI system (semantic
  HTML, modern CSS, zero runtime JavaScript). Use when creating or styling
  interfaces with this library: components, theming, forms, overlays.
---

# fewlines-css — agent skill

Platform-native UI system: semantic HTML, modern CSS, zero runtime JS.
Native first: `<button>`, `<dialog>`, the Popover API, native forms and
validation — no custom state machines, no `.is-open` / `.has-error` classes.
States are native selectors only (`:hover`, `:active`, `:disabled`,
`:focus-visible`).

## Install and import

```sh
pnpm add fewlines-css
```

```css
/* whole package (bundler: Vite etc.) */
@import 'fewlines-css';

/* tokens only */
@import 'fewlines-css/tokens';
```

Theming: the default follows the system preference (`light-dark()` +
`color-scheme`). Explicit override: `data-theme="light|dark"` on the root
element. Recolor the system by overriding seed tokens (e.g.
`--ui-color-brand`); semantic colors recompute on their own.

## Component index

Pick the component by task, then read its reference **before writing
markup** — never infer the API from an example or a neighboring component:

| Task                                              | Component   | Reference                   |
| ------------------------------------------------- | ----------- | --------------------------- |
| Action: submit, command, open a dialog            | Button      | `references/button.md`      |
| Text input with label and validation              | Field       | `references/field.md`       |
| Group of controls with a shared name              | Fieldset    | `references/fieldset.md`    |
| Modal window (confirmation, form)                 | Dialog      | `references/dialog.md`      |
| Non-modal overlay: menu, hint, panel              | Popover     | `references/popover.md`     |
| List of actions in an overlay                     | Menu        | `references/menu.md`        |
| Edge panel: filters, mobile nav, cart             | Drawer      | `references/drawer.md`      |
| Disclosure block: FAQ, settings                   | Accordion   | `references/accordion.md`   |
| Feedback message: status, result, error           | Alert       | `references/alert.md`       |
| Status label / counter                            | Badge       | `references/badge.md`       |
| Compact interactive control: filters, tag actions | Chip        | `references/chip.md`        |
| Section separator                                 | Divider     | `references/divider.md`     |
| Operation progress: loading, processing           | Progress    | `references/progress.md`    |
| Event chronology                                  | Timeline    | `references/timeline.md`    |
| Stepwise process progress: done/current/upcoming  | Stepper     | `references/stepper.md`     |
| Navigation trail to the current page              | Breadcrumbs | `references/breadcrumbs.md` |
| Placeholder for loading content                   | Skeleton    | `references/skeleton.md`    |
| Panel switching with the address in the URL       | Tabs        | `references/tabs.md`        |
| Binary on/off toggle: settings, consent           | Switch      | `references/switch.md`      |
| Choice controls: checkboxes, radios, groups       | Choice      | `references/choice.md`      |
| Short hover/focus hint                            | Tooltip     | `references/tooltip.md`     |
| Tabular data: registries, reports, dashboards     | Table       | `references/table.md`       |

Disambiguation: modal + focus trap → Dialog; light dismiss, non-modal →
Popover; action list in an overlay → Menu; panel from the viewport edge →
Drawer; binary toggle → Switch; choice controls → Choice; disclosure →
Accordion; unobtrusive status message → Alert; compact status/counter →
Badge; compact interactive control → Chip; tabular data → Table.

## Base typography — native elements, no classes

Text content is not a component: semantics come from native elements,
styling from the base layer. No classes needed:

| Task                                   | Elements                                 |
| -------------------------------------- | ---------------------------------------- |
| Inline code / program output / keys    | `<code>`, `<samp>`, `<kbd>`              |
| Variable or identifier in prose        | `<var>`                                  |
| Code block                             | `<pre><code>…</code></pre>`              |
| Highlighted "found"/important fragment | `<mark>`                                 |
| Abbreviation                           | `<abbr title="…">…</abbr>`               |
| Quote                                  | `<blockquote>` (+ `<cite>` when sourced) |
| Figure caption                         | `<figure>` + `<figcaption>`              |
| Thematic break                         | `<hr>`                                   |
| Indexes (formulas, footnotes)          | `<sub>`, `<sup>`                         |
| Unordered list                         | `<ul>` + `<li>`                          |
| Ordered list, outline numbering        | `<ol>` + nested `<ol>` (see below)       |
| Term → description (vertical)          | `<dl>` + `<dt>`/`<dd>`                   |
| Receipt key/value rows                 | `<dl data-variant="horizontal">` (below) |

List rules (base layer, no classes):

- Indent: `ul` — `--ui-space-lg`, `ol` — `--ui-space-xl` (numbers are
  narrower than bullets). The UA fixed indents are replaced.
- Nested `ol` read as hierarchical paths (`2.1.1`) via `counters()`. The
  top level keeps native markers — `start`/`reversed`/`value` work there
  but are ignored by counters on nested levels.
- The numbering system is the host token `--ui-list-counter-style`
  (a counter-style name: `decimal`, `georgian`, an `@counter-style`). It
  must stay valid — a garbage value drops the marker.
- Nested `ol` drop `list-style: none` semantics in WebKit — put the
  `role="list"` insurance on nested lists that carry meaning (the same
  contract Timeline/Stepper/Tree follow).
- `dt` carries the bold weight; `dd` indent is `--ui-space-md`.
- Receipt variant canonical markup — every pair wrapped in a `<div>`
  (valid `dl` grouping), one `dt` per group; the key lands on the last
  value's line, values sit at the value edge:

```html
<dl data-variant="horizontal">
  <div>
    <dt>License</dt>
    <dd>MIT</dd>
  </div>
  <div>
    <dt>Contacts</dt>
    <dd>hello@example.com</dd>
    <dd>+1 555 0100</dd>
  </div>
</dl>
```

## System rules

- Tokens: use semantic `--ui-color-*` and other `--ui-*` tokens only;
  direct references to `--ui-base-*` are forbidden.
- Typography: one fluid scale — `--ui-font-size-*` steps are the only API;
  headings `h1`–`h6` are styled by the base layer; controls (Button/Field)
  always sit on the `default` step, `data-size` only changes density.
- Spacing: `--ui-space-*` steps are one fluid proportional scale riding the
  shared `--ui-fluid` factor — do not hardcode px/rem gaps alongside them;
  hosts opt out by pinning `--ui-fluid-vmin = --ui-fluid-vmax`.
- Elevation: shadows only via `--ui-elevation-1..3`; custom `box-shadow`
  in components is forbidden; Dialog/Drawer use a scrim instead of shadows.
- States: activation only via native selectors; do not invent state classes.
- Zero runtime JS in the core; the host application calls the platform APIs
  it needs (e.g. `dialog.showModal()`).

## References

Per-component contracts (canonical markup, variants, sizes, states,
keyboard behavior, accessibility, constraints) live in
`references/<component>.md`. Read the relevant one before generating HTML.
