# Test harness

Playwright harness for @fewlines/css.

## Layout

- `browser/` — native behavior tests: dialog, popover, forms, theme
- `accessibility/` — axe-core + explicit keyboard/focus tests
- `apca/` — APCA token matrix check (`apca-w3`) — Node, derived defaults
- `theming/` — derivation tests: the seed + formulas layer in the real
  engine (CI abbreviated hue grid, step 30°) + the full 360-point sweep
- `purity/` — package purity check: no runtime JS/deps in core

## Coverage policy

### Static checks

- syntax, lint/format;
- invalid nesting, explicit specificity problems;
- duplicate/conflicting rules, where tooling can detect them;
- package contents (purity check).

### Browser tests

Playwright or an equivalent covers real native behavior:

- **Dialog** — open/close, modal state, Escape, backdrop, form semantics, focus;
- **Popover** — declarative trigger, open state, light dismiss, Escape, anchor
  positioning, fallback;
- **Forms** — labels, validation, disabled/required/invalid/focus states.

Known divergence (2026-10-24): WebKit does not return focus to the trigger
when closing a `<dialog>` (the spec expects the return; it reproduces with an
older CSS build — not our regression). The `dialog focus … returns to trigger
on close` test is marked `test.fail()` for webkit — once WebKit is fixed, the
test "flips" and this is visible. WebKit is worth rechecking every few
releases.

Accessibility: automated axe/browser checks are an additional layer; they do
not replace explicit keyboard/focus tests.

### Geometry and visuals

Screenshot-based visual regression was removed (decision 2026-10-15):
baselines are platform- and font-dependent, the CI gate effectively did not
work, and maintenance outweighed the benefit. Geometry and spacing are covered
by code review, the demo pages and computed-style assertions in browser
tests. A change in the visual result is not automatically a regression and
not automatically acceptable: determine the cause.

### Package purity

CI verifies that the published core package contains no runtime JS and no
unexpected runtime dependencies (`tests/purity/check.mjs`).

## Commands

```sh
pnpm --filter @fewlines/tests test:prepare   # copy built CSS to apps/docs
pnpm --filter @fewlines/tests test:browser   # browser + accessibility + theming (CI grid)
pnpm --filter @fewlines/tests test:apca      # APCA token matrix
pnpm --filter @fewlines/tests test:theming   # full 360-point hue sweep (manual run)
pnpm --filter @fewlines/tests test:purity    # package purity
```

`test:browser` runs `test:prepare` automatically (pretest hook).
The webServer serves `apps/docs` on port 4173; fixture pages load the built
core CSS from `/core.css`.

`test:theming` (the full 360-point derivation sweep) is a standalone script:
it needs the static server running first (`npx -y serve -l 4173 ../apps/docs`)
and sweeps the seed hue grid in chromium + firefox — a manual run, not part
of the CI gate.

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
