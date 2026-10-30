// In-page hue-sweep driver for the color derivation (shared by
// tests/theming/derive.spec.mjs — the CI abbreviated grid — and
// tests/theming/sweep.mjs — the full 360-point run).
//
// The sweep overrides the seed hue per family per theme, recomputes the
// palette widget's live tables (the same measurement the Colors page gives
// hosts — the widget parses and gamut-maps like the browser paints, unlike
// a canvas fillStyle) and collects the failing registry pairs plus the
// minimum |Lc| per pair across the sweep.
//
// step — the hue grid step in degrees (30 = the CI grid, 1 = the full sweep).

export function runHueSweep(step = 30) {
  const root = document.documentElement;
  const tables = [...document.querySelectorAll('site-palette-table')];
  const failures = [];
  const min = {};
  for (const theme of ['light', 'dark']) {
    root.setAttribute('data-theme', theme);
    for (const family of ['n', 'brand', 'attention', 'link']) {
      for (let h = 0; h < 360; h += step) {
        root.style.setProperty(`--ui-base-${family}-${theme}-h`, String(h));
        tables[0].refresh(); // one refresh recomputes every registered table
        for (const table of tables) {
          for (const row of table.querySelectorAll('.palette-table tbody tr')) {
            const pair = row.querySelector('code').textContent;
            const pill = row.querySelector('.palette-pill');
            const lc = Number(row.children[3].textContent);
            if (pill.dataset.status !== 'pass') {
              failures.push({ theme, family, hue: h, pair, status: pill.dataset.status, lc });
            }
            if (!(pair in min) || lc < min[pair].lc) {
              min[pair] = { lc, at: `${theme} ${family} h ${h}` };
            }
          }
        }
        root.style.removeProperty(`--ui-base-${family}-${theme}-h`);
      }
    }
  }
  root.removeAttribute('data-theme');
  return { failures, min };
}
