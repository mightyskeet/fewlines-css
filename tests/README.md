# Test harness layout

Playwright harness is configured in Phase 6 (steps 21–26 of the plan).

- `browser/` — native behavior tests: dialog, popover, forms (PROJECT_SPEC.md, 15.2)
- `visual/` — screenshot fixtures for representative states (15.3)
- `accessibility/` — axe-core + explicit keyboard/focus tests (раздел 9)
- APCA token matrix checks live here too (Phase 4, `apca-w3`)
