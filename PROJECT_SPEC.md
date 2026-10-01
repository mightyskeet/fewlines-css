# Спецификация проекта — platform-native UI system

## 1. Идея

Создать production-quality UI-библиотеку, которая максимально использует возможности современной веб-платформы: семантический HTML, современные CSS API и нативное браузерное поведение. Главная идея проекта — не изобретать поверх браузера ещё один runtime, а использовать то, что уже умеют HTML и CSS, и поверх этого дать единый визуальный язык, темизацию, accessibility-контракт и предсказуемый API.

Библиотека предназначена для обычного HTML и для приложений, которые разрабатываются coding agents. Поэтому важны не только внешний вид и DX человека, но и минимальная вариативность markup, каноническая структура компонентов, машиночитаемая документация и автоматические quality gates.

## 2. Позиционирование

Проект не должен быть «ещё одним shadcn». На момент начала разработки существует `shadcn-html`, который уже использует semantic HTML, modern CSS, native Web APIs и component skills для AI-ассистентов, но допускает vanilla JavaScript для взаимодействия, когда считает его необходимым. Его следует воспринимать как benchmark и ближайший внешний reference point, а не как шаблон для копирования.

Собственная отличительная зона проекта:

- **HTML/CSS-first**;
- **zero runtime JavaScript в core**;
- native platform API прежде собственной логики;
- единая светлая/тёмная theme system как часть foundation;
- APCA/readability gates на уровне токенов и компонентов;
- controlled regression вместо параллельных legacy/modern/experimental сборок;
- browser, keyboard, accessibility и visual regression как часть контракта компонента;
- документация, специально пригодная для coding agents;
- небольшой и предсказуемый vocabulary вместо огромного количества комбинаций.

Это не попытка доказать, что одна библиотека объективно «лучше» другой. Это другая инженерная стратегия: меньше скрытой логики, больше нативной платформы и более жёстко проверяемый контракт.

## 3. Не является целью

Не делать:

- utility framework уровня Tailwind;
- React-first UI framework;
- JS component runtime;
- коллекцию custom elements, которым для базового поведения нужен JS;
- клон API shadcn/ui, Radix или shadcn-html;
- отдельные `legacy`, `modern`, `experimental` или browser-specific CSS режимы;
- реализацию браузерного поведения в JS только ради единообразия API;
- огромный каталог компонентов до стабилизации foundation.

Framework integration, включая React, может существовать позже отдельным тонким слоем, но core не должен зависеть от framework.

## 4. Главные архитектурные принципы

### 4.1. Native first

Если браузер уже предоставляет нужное поведение, использовать его напрямую.

Предпочитать:

- `<button>` и `<a>`;
- native forms и validation;
- `<input>`, `<select>`, `<textarea>`;
- `<fieldset>` / `<legend>` / `<label>`;
- `<details>` / `<summary>`;
- `<dialog>`;
- Popover API: `popover`, `popovertarget`, `popovertargetaction`;
- `method="dialog"` и связанные form semantics;
- native focus and keyboard behavior.

Не заменять нативный API собственным state machine, если платформа уже решает задачу.

### 4.2. CSS — основной слой presentation и state

Использовать platform states и selectors:

`:hover`, `:focus-visible`, `:active`, `:checked`, `:disabled`, `:required`, `:valid`, `:invalid`, `:placeholder-shown`, `:open`, `:modal`, `:popover-open`, `:has()`, `:is()`, `:where()`, media queries, container queries, `@supports`.

Не требовать от host application классы вроде `.is-open`, `.is-active`, `.has-error`, если состояние уже доступно из native HTML/API.

### 4.3. Zero runtime JS

Core package не должен содержать runtime JavaScript и не должен требовать JS для использования CSS/HTML компонентов.

JavaScript разрешён только для tooling: build, docs, tests, Playwright, visual regression, CI и вспомогательных development scripts.

Если конкретное взаимодействие невозможно реализовать без JS с приемлемой семантикой, keyboard behavior и accessibility, компонент не следует искусственно делать CSS-only. Его нужно либо сузить до native части, либо исключить из core.

### 4.4. One canonical markup shape

У каждого компонента должна быть одна основная каноническая HTML-структура, небольшой набор документированных вариантов и предсказуемые атрибуты.

Не создавать десятки эквивалентных способов выразить один и тот же компонент. Это важно и для людей, и для coding agents: одинаковая задача должна приводить к примерно одинаковой разметке.

## 5. Controlled regression

Должна существовать одна каноническая CSS-реализация. Compatibility fallback выполняется внутри неё через `@supports`, cascade layers, custom properties, selector fallback и семантический HTML.

Запрещено решать несовместимость созданием второй полноценной реализации одного компонента.

Новая CSS/HTML-возможность должна добавляться только тогда, когда она улучшает компонент при сохранении пригодного результата вне этой возможности. Реализация должна быть проверена на целевой browser matrix.

## 6. Современная веб-платформа

Использовать современные возможности не ради списка технологий, а когда они уменьшают сложность или улучшают качество интерфейса.

### HTML / browser APIs

- `<dialog>`;
- Popover API;
- `<details>` / `<summary>`;
- form validation;
- native control states;
- top-layer behavior.

### CSS

- `@layer`;
- custom properties;
- `:has()`, `:is()`, `:where()`;
- container queries;
- logical properties;
- `color-mix()`;
- `oklch()` и другие современные color spaces;
- relative color syntax;
- `light-dark()`;
- `anchor-name`, `anchor()`, `position-anchor`, `position-area`;
- `@property`;
- `@starting-style`;
- CSS transitions/keyframes;
- `prefers-reduced-motion`;
- `prefers-contrast` и forced colors, где уместно;
- `accent-color`;
- `field-sizing`;
- другие platform features при наличии реального требования.

Список не является KPI. Каждая технология должна иметь конкретную причину присутствовать в коде.

## 7. Theme system

Светлая и тёмная тема — часть foundation, а не отдельный компонент поверх уже готовых компонентов.

### 7.1. Semantic tokens

Компоненты работают через semantic tokens, например:

```css
:root {
  --ui-color-surface: ...;
  --ui-color-surface-raised: ...;
  --ui-color-text: ...;
  --ui-color-text-muted: ...;
  --ui-color-border: ...;
  --ui-color-accent: ...;
  --ui-color-danger: ...;
  --ui-focus-ring: ...;
}
```

Не привязывать компоненты к сырым palette tokens, если компоненту нужна semantic роль.

### 7.2. Светлая/тёмная тема

Предусмотреть:

- системный default через `prefers-color-scheme`;
- `color-scheme` для интеграции с browser UI;
- `light-dark()` там, где это упрощает token definition;
- явный document-level override через `data-theme="light"` / `data-theme="dark"`;
- единый token contract для обеих тем.

Persistence пользовательского выбора не является обязанностью CSS package. Его должен решать host application.

### 7.3. Theme transition

Плавно анимировать визуальные custom properties там, где это надёжно поддерживается browser policy. `color-scheme` не считать анимируемым свойством; он переключает режим дискретно. Для анимируемых цветов допускается `@property` с типом `<color>`.

Обязательно поддержать `prefers-reduced-motion` и иметь regression coverage для обычного и reduced-motion режима.

## 8. Цвет и APCA

APCA использовать как perceptual readability guardrail на этапе разработки.

Важно: APCA не является заменой нормативным WCAG 2.x conformance checks. Для проектов, где требуется соответствие нормативным критериям, выполнять отдельные WCAG 2.x проверки.

### 8.1. Token-level validation

Завести machine-readable реестр допустимых semantic foreground/background пар и ролей.

Проверять минимум:

- text on background;
- text on raised surface;
- muted text;
- accent text/surface;
- destructive text/surface;
- control labels;
- focus indicators;
- dark theme и light theme.

APCA рассчитывать с учётом роли текста, его размера и веса; не использовать один универсальный порог для всей системы.

Рекомендуемая development dependency — `apca-w3`.

### 8.2. Rendered component validation

Playwright/browser tests должны при необходимости получать фактические computed styles и проверять пары цветов для реальных состояний компонентов.

Автоматический APCA расчёт подходит прежде всего для одноцветных непрозрачных foreground/background пар. Градиенты, изображения, прозрачные слои и сложные композиции должны попадать в отдельный ручной accessibility audit, а не получать ложный PASS.

## 9. Accessibility как контракт

Accessibility — не финальная полировка.

Для каждого компонента фиксируются:

- semantic HTML;
- доступное имя и роли;
- keyboard behavior;
- focus-visible behavior;
- disabled/invalid/selected/open states;
- связь labels/descriptions;
- reduced motion;
- forced colors/high contrast, когда релевантно;
- APCA/readability requirements.

Automated axe/browser checks использовать как дополнительный слой; они не заменяют явные keyboard/focus tests и manual review сложных случаев.

## 10. Browser compatibility

Совместимость является частью архитектуры.

### 10.1. Browser policy

Использовать один документированный Browserslist contract. Сначала определить целевую matrix на основе реальных platform features, затем зафиксировать её в репозитории.

Не снижать browser floor только ради удобства реализации отдельной фичи.

### 10.2. Can I Use MCP

Для каждой существенной platform feature обязательно проверять совместимость через Can I Use MCP.

Минимальный workflow:

1. Определить точное имя/feature key.
2. Вызвать `caniuse_feature`.
3. При необходимости вызвать `browserslist_compatibility_check`.
4. Проверить partial support и implementation notes.
5. Сопоставить результат с реальным браузерным тестом.
6. Зафиксировать решение: direct use, progressive enhancement, изменение дизайна или исключение feature.

Не утверждать совместимость по памяти.

Предполагается community MCP `caniuse-mcp` с инструментами `caniuse_feature` и `browserslist_compatibility_check`. OpenCode может подключить его как local MCP, например:

```json
{
  "mcp": {
    "caniuse": {
      "type": "local",
      "command": ["npx", "-y", "caniuse-mcp"],
      "enabled": true
    }
  }
}
```

Если MCP недоступен во время compatibility-sensitive работы, агент не должен заменять проверку догадкой.

## 11. Positioning и overlays

Для floating UI применять следующий приоритет:

1. native top-layer primitive (`dialog` / `popover`);
2. CSS Anchor Positioning, когда оно улучшает placement;
3. обычное CSS positioning как fallback;
4. никакого positioning runtime в core.

При anchor positioning явно документировать anchor contract, fallback positions и ограничения collision handling.

## 12. Motion

Использовать motion tokens, например:

```css
--ui-duration-fast: 120ms;
--ui-duration-normal: 180ms;
--ui-duration-slow: 260ms;
```

Предпочитать transitions и native lifecycle states там, где они подходят. Не заставлять все компоненты использовать одну и ту же анимационную схему.

## 13. Документация

Документация должна одновременно работать для человека и coding agent.

Для каждого компонента обязательно:

- назначение;
- native basis;
- canonical markup;
- variants;
- states;
- keyboard behavior;
- accessibility;
- compatibility;
- ограничения;
- CSS customization points;
- используемые Web APIs.

### 13.1. Agent-facing contract

Помимо обычной документации иметь короткий machine-oriented индекс и/или agent skills. Агент должен быстро получить ответы на четыре вопроса:

1. Какой компонент нужен для задачи?
2. Как выглядит канонический HTML?
3. Какие атрибуты и варианты допустимы?
4. Какие platform features, accessibility rules и ограничения нужно учитывать?

Для каждого компонента желательно иметь компактный документ формата:

```text
Purpose
Native basis
Markup
Variants
States
Accessibility
Compatibility
Do not
```

Компонентный contract является source of truth. Агент не должен выводить API из случайного примера или соседнего компонента.

## 14. Component contract

Каждый компонент должен иметь однозначно определённый contract и проходить одинаковый lifecycle:

```text
semantic design
→ platform feature audit
→ implementation
→ docs
→ browser tests
→ accessibility checks
→ APCA checks
→ visual regression
→ package purity check
```

Рекомендуемая структура:

```text
component/
├── component.css
├── example.html
├── component.md
├── component.spec.ts
└── component.visual.spec.ts
```

Названия могут измениться вместе с выбранной toolchain, но разделение contract/implementation/tests должно сохраняться.

## 15. Testing

### 15.1. Статические проверки

Проверять:

- syntax;
- lint/format;
- invalid nesting;
- явные specificity problems;
- duplicate/conflicting rules, когда tooling способен их обнаружить;
- package contents.

### 15.2. Browser tests

Использовать Playwright или эквивалент.

Покрывать реальное native behavior:

**Dialog** — open/close, modal state, Escape, backdrop, form semantics, focus.

**Popover** — declarative trigger, open state, light dismiss, Escape, anchor positioning, fallback.

**Forms** — labels, validation, disabled/required/invalid/focus states.

### 15.3. Visual regression

Для representative компонентов и состояний иметь screenshot fixtures:

- default;
- hover;
- focus-visible;
- active;
- disabled;
- invalid;
- open/closed overlays;
- light/dark;
- reduced motion, где визуальный результат отличается;
- узкий/широкий container, где используется container query.

Не считать изменение браузера автоматически regression или автоматически приемлемым изменением: определить причину.

### 15.4. Package purity

CI должен проверять, что опубликованный core package не содержит runtime JS и неожиданных runtime dependencies.

## 16. Project structure

Предпочтительная форма:

```text
packages/
  core/
    tokens/
    components/
    layouts/
    patterns/
  react/            # позднее, при необходимости; thin bindings
apps/
  docs/
tests/
  browser/
  visual/
  accessibility/


```

Названия могут измениться, но архитектурное правило остаётся: **core не зависит от React**.

## 17. Workflow агента

Перед изменениями агент должен:


2. Прочитать `PROJECT_SPEC.md` и применимые instruction files.
3. Изучить существующую architecture/toolchain.
4. Определить semantic HTML.
5. Выписать platform features.
6. Проверить их через Can I Use MCP.
7. Реализовать минимальное связное изменение.
8. Обновить component contract и документацию.
9. Добавить/обновить browser, accessibility, APCA и visual regression.
10. Проверить package purity.
11. Запустить focused checks и затем полный относящийся к задаче suite.
12. Проверить diff на случайный JS, рост specificity, duplicate tokens и unrelated cleanup.

## 18. Definition of done

Компонент завершён, только если:

- semantic HTML contract документирован;
- canonical markup существует;
- native behavior используется там, где возможно;
- runtime JS отсутствует;
- существенные platform features проверены через Can I Use MCP;
- compatibility decision документировано;
- keyboard/focus/reduced-motion покрыты;
- APCA-проверки для релевантных token pairs проходят;
- browser tests проходят;
- visual regression representative states проходят;
- документация для человека и agent contract обновлены;
- package purity check проходит.

## 19. Полноценность библиотеки и планка качества

Библиотека должна быть полноценной general-purpose UI library для production-интерфейсов. Наличие аналога компонента в других библиотеках не является причиной не реализовывать его. В roadmap должны постепенно появляться все типовые категории UI, которые реально нужны приложениям: формы, feedback, overlays, navigation, content, layout и более сложные composite-компоненты. При этом foundation и quality gates должны стабилизироваться раньше массового расширения каталога.

Ценность проекта определяется на уровне всей системы, а не уникальностью каждого компонента. Компоненты могут быть обычными по назначению; они должны быть единообразными по HTML/CSS API, теме, accessibility, compatibility policy, тестированию и agent contract.

Современная CSS-фича сама по себе не является достижением, если она приводит к:

- плохой семантике;
- broken keyboard interaction;
- accessibility regression;
- fragile specificity;
- undocumented browser divergence;
- сложному theme model;
- дублированной реализации;
- необъяснимым magic numbers;
- увеличению agent ambiguity.

## 20. Первый milestone

Сначала стабилизировать фундамент на небольшом vertical slice:

1. package/toolchain bootstrap;
2. Browserslist и compatibility infrastructure;
3. Can I Use MCP integration;
4. semantic design tokens;
5. light/dark theme;
6. system preference + explicit `data-theme` override;
7. theme transition + reduced motion;
8. APCA token matrix и automated checks;
9. focus foundations;
10. Button;
11. Field/Input;
12. Dialog;
13. Popover;
14. Anchor-positioned popover enhancement;
15. browser + visual + accessibility regression harness;
16. human docs + agent-facing component contracts;
17. package purity check.

Не расширять каталог, пока этот slice не закрепит архитектурные правила и не будет стабильно проходить все quality gates.

## 21. Критерий ценности компонента

Перед добавлением крупного компонента или subsystem проверять не его уникальность, а соответствие общей архитектуре проекта: platform-native HTML/CSS, единая theme system, accessibility и APCA gates, compatibility contract, controlled regression и agent-friendly API.

Если компонент является типовой production-потребностью, его следует реализовать даже при наличии множества аналогов. Отличия от существующих библиотек должны проявляться прежде всего в системном качестве и проверяемости, а не в искусственной попытке сделать каждый компонент уникальным.

## 22. Применимость в React/Vite и AI chat applications

Библиотека должна хорошо использоваться в React-приложениях, собираемых через Vite, без переноса React-зависимости в core. Vite должен подключать CSS библиотеки как обычный package stylesheet; React-интеграция при необходимости предоставляется отдельным thin layer.

AI chat не является обязанностью core. Библиотека отвечает за визуальный и семантический слой, а assistant-ui, AI SDK или другой AI runtime — за streaming, thread state, tool calls, message state и другое поведение. Особенно важна совместимость с unstyled primitives: стили должны легко навешиваться через `className`, `data-*` states и `asChild`, не ломая runtime-контракт. Для assistant-ui допустим отдельный optional adapter/package, который предоставляет канонические styled bindings или recipes, но не делает assistant-ui зависимостью core.

Следует отдельно документировать AI-chat recipes для типовых поверхностей: chat layout, message bubble/content, composer, attachments, action bar, tool UI, empty state, loading/streaming state, command/popover controls и responsive sidebar/thread list. Это позволяет использовать библиотеку для AI-приложений без превращения core в chat framework.
