# @fewlines/css

Platform-native UI system: semantic HTML, modern CSS, **zero runtime JavaScript**.

Библиотека не изобретает runtime поверх браузера — она использует то, что уже
умеют HTML и CSS, и добавляет единый визуальный язык, темизацию,
accessibility-контракт и предсказуемый API. Предназначена для обычного HTML и
для приложений, которые разрабатывают coding agents.

## Принципы

- **Native first** — `<button>`, `<dialog>`, Popover API, нативные формы и
  валидация; никаких собственных state machine.
- **Zero runtime JS** — core содержит только CSS (проверяется автоматически).
- **One canonical markup** — одна каноническая структура на компонент.
- **Controlled regression** — одна реализация, fallback через `@supports`.
- **Проверяемое качество** — browser, accessibility, APCA тесты
  тесты как часть контракта компонента.

## Установка и подключение

```sh
pnpm add @fewlines/css
```

```css
/* Vite / bundler: весь пакет */
@import '@fewlines/css';

/* или только токены */
@import '@fewlines/css/tokens';
```

Тема: по умолчанию следует системной (`light-dark()` + `color-scheme`); явный
override — `data-theme="light|dark"` на корневом элементе. Подробнее:
`theme notes`.

## Компоненты

| Компонент | Basis                            | Классы                                                                            |
| --------- | -------------------------------- | --------------------------------------------------------------------------------- |
| Button    | `<button>`, `<a>`                | `ui-button`, `data-variant`, `data-size`                                          |
| Field     | `<input>/<textarea>/<select>`    | `ui-field`, `ui-input`, `ui-textarea`, `ui-select`, `ui-field-error`, `data-size` |
| Dialog    | `<dialog>` (top-layer)           | `ui-dialog`                                                                       |
| Popover   | Popover API + anchor positioning | `ui-popover`, `ui-popover-trigger`                                                |
| Drawer    | Popover API (панель от края)     | `ui-drawer`, `popover`, `data-variant`                                            |
| Accordion | `<details>/<summary>`            | `ui-accordion`, `ui-accordion-summary`                                            |
| Alert     | статический контейнер сообщений  | `ui-alert`, `data-variant`, `ui-alert-title/body`                                 |
| Badge     | статический inline статус-лейбл  | `ui-badge`, `data-variant`                                                        |
| Switch    | `<input type="checkbox" switch>` | `ui-switch`, `ui-switch-field`, `ui-switch-label`                                 |
| Table     | `<table>` + `<caption>`          | `ui-table`, `ui-table-wrap`, `data-zebra`, `data-sticky`, `data-align`            |

Помимо компонентов base layer оформляет семантические текстовые элементы без
классов: `code`/`kbd`/`samp`, `pre`, `mark`, `abbr`, ссылки, `blockquote`,

typography»).


`packages/core/src/components/*/[name].md`. Живые примеры: `apps/docs/`.

## Разработка

```sh
pnpm install
pnpm build          # Lightning CSS → packages/core/dist
pnpm lint           # stylelint
pnpm format:check   # prettier
```

Тесты (Playwright, APCA, purity): см. `tests/README.md`.

## Документация

- `PROJECT_SPEC.md` — спецификация (source of truth);
- `architecture notes` — принципы и структура;
- `workflow notes` — порядок работы агента;

- `compatibility notes` — browser policy и решения;
- `accessibility notes` — APCA-политика;
- `theme notes` — токены и тема.

## License

MIT
