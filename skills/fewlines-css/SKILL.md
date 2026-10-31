---
name: fewlines-css
description: >
  Build UIs with @fewlines/css — a platform-native CSS UI system (semantic
  HTML, modern CSS, zero runtime JavaScript). Use when creating or styling
  interfaces with this library: components, theming, forms, overlays.
---

# @fewlines/css — agent skill

Platform-native UI system: semantic HTML, modern CSS, zero runtime JS.
Native first: `<button>`, `<dialog>`, the Popover API, native forms and
validation — no custom state machines, no `.is-open` / `.has-error` classes.
States are native selectors only (`:hover`, `:active`, `:disabled`,
`:focus-visible`).

## Install and import

```sh
pnpm add @fewlines/css
```

```css
/* whole package (bundler: Vite etc.) */
@import '@fewlines/css';

/* tokens only */
@import '@fewlines/css/tokens';
```

Theming: the default follows the system preference (`light-dark()` +
`color-scheme`). Explicit override: `data-theme="light|dark"` on the root
element. Recolor the system by overriding seed tokens (e.g.
`--ui-color-brand`); semantic colors recompute on their own.

## Component index

Pick the component by task, then read its reference **before writing
markup** — never infer the API from an example or a neighboring component:

| Task                                             | Component   | Reference                   |
| ------------------------------------------------ | ----------- | --------------------------- |
| Action: submit, command, open a dialog           | Button      | `references/button.md`      |
| Text input with label and validation             | Field       | `references/field.md`       |
| Group of controls with a shared name             | Fieldset    | `references/fieldset.md`    |
| Modal window (confirmation, form)                | Dialog      | `references/dialog.md`      |
| Non-modal overlay: menu, hint, panel             | Popover     | `references/popover.md`     |
| List of actions in an overlay                    | Menu        | `references/menu.md`        |
| Edge panel: filters, mobile nav, cart            | Drawer      | `references/drawer.md`      |
| Disclosure block: FAQ, settings                  | Accordion   | `references/accordion.md`   |
| Feedback message: status, result, error          | Alert       | `references/alert.md`       |
| Status label / counter                           | Badge       | `references/badge.md`       |
| Section separator                                | Divider     | `references/divider.md`     |
| Operation progress: loading, processing          | Progress    | `references/progress.md`    |
| Event chronology                                 | Timeline    | `references/timeline.md`    |
| Stepwise process progress: done/current/upcoming | Stepper     | `references/stepper.md`     |
| Navigation trail to the current page             | Breadcrumbs | `references/breadcrumbs.md` |
| Placeholder for loading content                  | Skeleton    | `references/skeleton.md`    |
| Panel switching with the address in the URL      | Tabs        | `references/tabs.md`        |
| Binary on/off toggle: settings, consent          | Switch      | `references/switch.md`      |
| Choice controls: checkboxes, radios, groups      | Choice      | `references/choice.md`      |
| Short hover/focus hint                           | Tooltip     | `references/tooltip.md`     |
| Tabular data: registries, reports, dashboards    | Table       | `references/table.md`       |

Disambiguation: modal + focus trap → Dialog; light dismiss, non-modal →
Popover; action list in an overlay → Menu; panel from the viewport edge →
Drawer; binary toggle → Switch; choice controls → Choice; disclosure →
Accordion; unobtrusive status message → Alert; compact status/counter →
Badge; tabular data → Table.

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

## System rules

- Tokens: use semantic `--ui-color-*` and other `--ui-*` tokens only;
  direct references to `--ui-base-*` are forbidden.
- Typography: one fluid scale — `--ui-font-size-*` steps are the only API;
  headings `h1`–`h6` are styled by the base layer; controls (Button/Field)
  always sit on the `default` step, `data-size` only changes density.
- Elevation: shadows only via `--ui-elevation-1..3`; custom `box-shadow`
  in components is forbidden; Dialog/Drawer use a scrim instead of shadows.
- States: activation only via native selectors; do not invent state classes.
- Zero runtime JS in the core; the host application calls the platform APIs
  it needs (e.g. `dialog.showModal()`).

## References

Per-component contracts (canonical markup, variants, sizes, states,
keyboard behavior, accessibility, constraints) live in
`references/<component>.md`. Read the relevant one before generating HTML.
