# Skeleton

## Purpose
Loading placeholder for content that has not arrived yet: text lines, avatar, card blocks. A single static empty `<span>`; the host sets geometry, motion (shimmer) is on by default, no JS.

## Native basis
- No native placeholder element exists — the component is static (Badge model: `<span>` with no role, no states, no focus).
- Decorative by construction: it conveys nothing; the meaning ("content is loading") belongs to the host, which marks the loading area with `aria-busy="true"` and removes it when real content is inserted.
- WCAG 1.4.11 (non-text contrast) does not apply: the placeholder is not an interface component or information-carrying graphic.

## Canonical markup
```html
<span class="ui-skeleton" style="inline-size: 12rem"></span>
```
- Geometry is the host's job: the placeholder inherits the geometry of the content it replaces (line length, circular avatar, card block).
- Defaults fit the most common case — a text line: `inline-size: 100%` of the container, `block-size: 1em` (follows surrounding font-size, so layout does not jump when real text is inserted).
- Shape is expressed by host geometry and radius, not variants — there is no `data-shape`.
- The host lays out skeleton blocks (usually a stack or grid); the component does not impose gaps.

Avatar (host geometry):
```html
<span
  class="ui-skeleton"
  style="inline-size: 2.5rem; block-size: 2.5rem; --ui-skeleton-radius: var(--ui-radius-full)"
></span>
```

## Variants and sizes
- No `data-variant`, no `data-size` — the placeholder is decorative; color semantics do not apply.
- Customization via local tokens, overridden by the host with semantic tokens (never classes):
  - `--ui-skeleton-surface` — surface color;
  - `--ui-skeleton-highlight` — shimmer highlight color (linked to the shared shimmer slot via `--ui-shimmer-color`);
  - `--ui-skeleton-radius` — corner radius (default `--ui-radius-md`; `--ui-radius-full` for a circular avatar);
  - `--ui-shimmer-duration` — sweep duration (default `1.5s`);
  - `--ui-shimmer-lean` — highlight stripe slant (default `30deg`).
- Stripe width is a contract, not a knob: `max(40%, 2.5rem)`, cap `75%`.

## States
- No states: the placeholder is not interactive and carries no state.
- The only behavior is the shimmer, always on — a motionless placeholder is just a gray block.
- `prefers-reduced-motion`: the stripe layer is removed (`display: none` on `::after`), leaving a calm static surface.
- Forced colors: the stripe layer is removed; the empty box keeps its place in layout.

## Keyboard and accessibility
- Empty element with no text: absent from the accessibility tree; no role, no focus, no states.
- "Content is loading" is the host's duty: `aria-busy="true"` on the loading area, removed when content is inserted.
- Do not attach roles (`status`, `progressbar`) to the placeholder.
- Reduced motion and forced colors degrade gracefully (see States).

## Do not
- Do not replace the empty `<span>` with content imitation (gray text, crosses) — text inside would enter the accessibility tree.
- Do not animate geometry (size pulse) — the only motion is the highlight sweep.
- Do not set geometry with component classes — inline-size/block-size and shape belong to the host.
- Do not attach roles (`status`, `progressbar`) to the placeholder.
- Do not reference `--ui-base-*` in host overrides — only semantic `--ui-*` tokens.
