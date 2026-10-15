# Test harness

Playwright harness for @fewlines/css.

## Layout

- `browser/` — native behavior tests: dialog, popover, forms, theme
- `accessibility/` — axe-core + explicit keyboard/focus tests
- `apca/` — APCA token matrix check (`apca-w3`)
- `purity/` — package purity check: no runtime JS/deps in core

## Политика покрытия

### Статические проверки

- syntax, lint/format;
- invalid nesting, явные specificity problems;
- duplicate/conflicting rules, когда tooling способен их обнаружить;
- package contents (purity check).

### Browser tests

Playwright или эквивалент покрывает реальное native behavior:

- **Dialog** — open/close, modal state, Escape, backdrop, form semantics, focus;
- **Popover** — declarative trigger, open state, light dismiss, Escape, anchor
  positioning, fallback;
- **Forms** — labels, validation, disabled/required/invalid/focus states.

Accessibility: automated axe/browser checks — дополнительный слой; они не
заменяют явные keyboard/focus тесты (accessibility notes).

### Геометрия и визуал

Screenshot-based visual regression удалён (решение 2026-10-15): бейзлайны
зависят от платформы и шрифтов, гейт в CI фактически не работал, поддержка
перевешивала пользу. Геометрию и отступы покрывают code review, демо-страницы и
computed-style проверки в browser tests. Изменение визуального результата не
считать автоматически regression или автоматически приемлемым: определить
причину.

### Package purity

CI проверяет, что опубликованный core package не содержит runtime JS и
неожиданных runtime dependencies (`tests/purity/check.mjs`).

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
