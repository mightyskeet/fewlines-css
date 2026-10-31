# Menu

## Purpose
A list of actions in an overlay: contextual operations on an object (rename, duplicate, delete) and navigation lists in panels. A native `<menu>` inside a popover shell — opened, positioned, and closed by the platform, without JS.

## Native basis
- Element — `<menu>`: the platform's unordered list of actions; list and item semantics come with the element (`<li>` items, `<hr>` separator with a native `separator` role).
- Shell — Popover: the menu is itself a popover (`<menu popover>`); surface, elevation, anchor placement, and open/close animation are the single canonical Popover implementation.
- Open — declarative: `popovertarget` on the trigger.
- Close after action — native: Invoker Commands (`command="hide-popover"`, `commandfor`); the click still fires after the command, so hosts add the action with a plain handler. Light dismiss and Escape are native.
- Focus: `autofocus` on the first item — popover show steps move focus into the menu; without it focus stays on the trigger and Tab reaches items through the top layer.

## Canonical markup
```html
<button class="ui-button ui-popover-trigger" type="button" popovertarget="file-menu">
  Actions
</button>

<menu class="ui-popover ui-menu" id="file-menu" popover>
  <li>
    <button class="ui-menu-item" type="button" command="hide-popover" commandfor="file-menu">
      Rename
    </button>
  </li>
  <li>
    <button class="ui-menu-item" type="button" command="hide-popover" commandfor="file-menu">
      Duplicate
    </button>
  </li>
  <li><hr class="ui-divider" /></li>
  <li>
    <button
      class="ui-menu-item"
      type="button"
      data-variant="attention"
      command="hide-popover"
      commandfor="file-menu"
    >
      Delete
    </button>
  </li>
</menu>
```
- `class="ui-popover ui-menu"` — shell (placement `data-block`/`data-inline`, Popover tokens) plus list and items; `popover` is required.
- Item — `<button class="ui-menu-item" type="button">` (action) or `<a class="ui-menu-item" href>` (navigation); one item per `<li>`.
- Separator — `<li><hr class="ui-divider" /></li>`: native `separator` role; Divider's `data-inset` works as is.
- `command="hide-popover" commandfor="<menu id>"` — native close after action; without it the menu stays open (the host closes it itself).
- `autofocus` on the first item — opt-in focus move into the menu on open.
- Multiple trigger+menu pairs on a page: scope anchor names (`anchor-scope: all` on a common ancestor, or a unique name per pair), as with Popover.

## Variants and sizes
One canonical variant; placement and sizing come from Popover (`data-block`/`data-inline`, `max-inline-size`). Local tokens only:

| Token | Default | Meaning |
|---|---|---|
| `--ui-menu-gap` | `--ui-space-2xs` | Rhythm between items. |
| `--ui-menu-min-inline-size` | `12rem` | Minimum menu width (without it a short menu collapses to a sliver). |

Item: `data-variant="attention"` — destructive action (bare attention-family text, `attention-tint` hover fill); other items are neutral text. Density via local tokens; no variant classes.

## States
- Hover — `--ui-color-hover` fill (Button ghost policy), pointer-gated.
- Focus — focus ring from the base layer (`:where(:focus-visible)`), not overridden.
- Disabled — native `:disabled` on `<button>`, `aria-disabled="true"` on `<a>` (opacity 0.5, like Button).
- Open/closed — `:popover-open` on the shell; all Popover behavior applies.

## Keyboard and accessibility
- Semantics — native action list: `<menu>` is a list, items are buttons/links with built-in accessible names, separator is a native `separator`. No `role="menuitem"` overrides — they would promise a menu keyboard model (arrow keys, roving tabindex) that does not exist without JS.
- Keyboard: Tab between items (sequential navigation), Enter/Space activate `<button>`, Enter activates `<a>`; Escape and light dismiss close the shell natively.
- Disabled: `:disabled` removes a button from tab order and activation natively; for links `aria-disabled="true"` + styling only — the host must also neutralize the handler.
- Reduced motion: item transitions are disabled; shell animation is handled by Popover.
- Forced colors: the system recolors buttons natively (`forced-color-adjust: auto`).

## Do not
- Do not emulate the list with `div` + JS state: the action list is `<menu>`; closing is native light dismiss/Escape/`command`.
- Do not override roles (`role="menu"`/`menuitem`/`aria-selected`) — hosts may add the keyboard model in their own JS layer instead.
- Do not place items directly in `<menu>` without `<li>` — the content model allows only `li`.
- Do not open the menu from core JS — `showPopover()` and animations are native.
- Do not rely on `command` for dialog semantics (`close`/`request-close` validate only on `<dialog>`) — for a popover target it is `hide-popover`.
- Do not override the item focus ring — it comes from the base layer.

## Known limitations
- Without JS there is no arrow-key navigation or roving tabindex — an honest model: a list of links/buttons; hosts add it in their own JS layer if needed.
- Menus with checkmarks/submenus/section headings are outside the canonical scope: sections are assembled with host content (`li` + heading text), checkmarks are Choice controls inside items.
- Without `command`/`commandfor` and without host JS, the menu stays open after an action — documented behavior, not a bug.
