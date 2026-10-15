# Test harness

Playwright harness for @fewlines/css (PROJECT_SPEC.md, раздел 15).

## Layout

- `browser/` — native behavior tests: dialog, popover, forms, theme (15.2)
- `accessibility/` — axe-core + explicit keyboard/focus tests (раздел 9)
- `apca/` — APCA token matrix check (Phase 4, `apca-w3`)
- `purity/` — package purity check: no runtime JS/deps in core (15.4)

## Commands

```sh
pnpm --filter @fewlines/tests test:prepare   # copy built CSS to apps/docs
pnpm --filter @fewlines/tests test:browser   # browser + accessibility
pnpm --filter @fewlines/tests test:apca      # APCA token matrix
pnpm --filter @fewlines/tests test:purity    # package purity
```

`test:browser` runs `test:prepare` automatically (pretest hook).
The webServer serves `apps/docs` on port 4173; fixture pages load the built
core CSS from `/core.css`.

## Notes

- Chromium serializes computed colors as `oklch(...)` — theme tests parse both
  rgb and oklch forms.
- Dialog focus trap: Chromium's Tab wrap transiently reports `body` between
  the last and first focusable element; the trap test asserts the real
  contract (outside focus attempts are refused) instead of the transient state.
- Manual checks in the VS Code integrated browser (Electron) are not
  representative: the shell consumes Escape, so the native `cancel` event of
  `<dialog>` never fires and Escape-close appears broken. It works in real
  browsers (covered by `browser/dialog.spec.mjs`). For manual verification open
  the docs site in a standalone browser.
