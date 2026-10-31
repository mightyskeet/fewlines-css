# Breadcrumbs

## Purpose
Navigation trail: the path from the root to the current page. One canonical element — `<nav>` with `<ol>`, no JS. Not a Stepper: there it is process-step progress, here it is position in the site hierarchy.

## Native basis
- Elements — `<nav aria-label="Breadcrumb">` + `<ol>/<li>` + `<a>`: the WAI-ARIA breadcrumbs pattern — landmark, list semantics, and structure come with the elements.
- Current page — native ARIA state `aria-current="page"` (announced by screen readers); the attribute may sit on the `<li>` (text crumb) or on the crumb's link — CSS covers both via `:has(> …)`.
- The component is opt-in styling: a bare `<nav>` with `<ol>` is already native navigation; the class adds the visual vocabulary (separators, layout, truncation). No component states: no focus, no JS; forced colors repaint everything natively.

## Canonical markup
```html
<nav class="ui-breadcrumbs" aria-label="Breadcrumb">
  <ol role="list">
    <li><a href="/">Home</a></li>
    <li><a href="/library">Library</a></li>
    <li aria-current="page">Data</li>
  </ol>
</nav>
```

- `role="list"` is part of the canon (guards against the `list-style: none` VoiceOver quirk).
- A crumb is an `<a href>` inside `<li>`; the current one is text or a host element (a self-link is allowed: `aria-current="page"` on `<a>`).
- Separators are drawn by the component (`li + li::before`), the markup does not contain them: `content: '/' / ''` — empty alt text, screen readers skip punctuation.
- `aria-label` on `<nav>` is mandatory — the accessible name of the landmark.

### Collapsed (hidden middle levels)
The host collapses middle levels into one `<li>` with a declarative trigger; hidden levels live in a Menu popover:

```html
<nav class="ui-breadcrumbs" aria-label="Breadcrumb">
  <ol role="list">
    <li><a href="/">Home</a></li>
    <li>
      <button
        class="ui-popover-trigger"
        type="button"
        popovertarget="bc-more"
        aria-label="Hidden levels"
      >
        …
      </button>
    </li>
    <li><a href="/data">Data</a></li>
    <li aria-current="page">Exports</li>
  </ol>
  <menu class="ui-popover ui-menu" id="bc-more" popover>
    <li><a class="ui-menu-item" href="/projects">Projects</a></li>
    <li><a class="ui-menu-item" href="/archive">Archive</a></li>
  </menu>
</nav>
```

- Zero JS: open/close/Escape/light dismiss are native popover show steps; items are `ui-menu-item` on `<a>` (navigation).
- The trigger button must have `aria-label` — the visible "…" glyph is not an accessible name.
- `ui-popover-trigger` enables anchor positioning (below the trigger, flips up on overflow); scoping multiple pairs on a page is the host's responsibility (Popover contract).

### Truncating the current item
The current crumb is capped at `--ui-breadcrumbs-max` (default `40ch`) with text-overflow ellipsis; the full name goes into the native `title`:

```html
<li aria-current="page" title="the-full-page-name">the-full-page-name…</li>
```

- The cap sits on the `<li>` (text-overflow does not work on flex containers); `overflow: hidden` resets the flex item's automatic minimum — it is a maximum, not a fixed width.
- `title` on the truncated crumb is part of the truncation contract (hover tooltip; screen readers read the full name).

## Variants and sizes
- No attribute variants (`data-variant`/`data-size` do not exist) — collapsed is not an attribute but a documented composition with Menu.
- Color semantics — overriding local tokens in place: `--ui-breadcrumbs-gap` (default `--ui-space-xs`), `--ui-breadcrumbs-max` (default `40ch`), `--ui-breadcrumbs-separator-color` (default `text-muted`), `--ui-breadcrumbs-toggle-color` (default `text-muted`).

## States
Native only: current — `aria-current="page"`; hover — `:hover` on links (pointer-gated), underline returns on hover.

## Keyboard and accessibility
- Landmark `navigation` with a name ("Breadcrumb") — `aria-label` is mandatory; `list`/`listitem` roles are native.
- Truncated crumb: full name in `title` — the truncated part stays accessible.
- Current page — `aria-current="page"`, announced.
- Separator — generated content with empty alt text, not part of the accessible name.
- Collapsed: trigger with `aria-label`; hidden levels remain full links inside the Menu popover; open/close/Escape/light dismiss are native, Tab reaches items through the top layer.
- Links — native focus and ring from the base layer; underline removed at rest, restored on hover.

## Do not
- Do not add separators in markup (`<li>` with arrows/symbols) — they are drawn by `::before`; duplication breaks the rhythm.
- Do not replace `<nav>`/`<ol>` with `<div>` grids — landmark and list semantics are lost.
- Do not omit `aria-label` on `<nav>` or on the collapsed trigger button.
- Do not hide middle levels with `display: none` without a Menu popover — the levels are lost for navigation.
- Do not style states with classes (`.is-current` etc.) — only `aria-current="page"`.
- Do not set spacing via margin on `<li>` — the rhythm belongs to the component (`--ui-breadcrumbs-gap`).
- Do not reference `--ui-base-*` from host overrides — only semantic `--ui-*`.
