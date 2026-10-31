/**
 * Package purity check (tests/README.md).
 *
 * Verifies the published core package contains no runtime JS and no
 * unexpected runtime dependencies.
 *
 * Run: node tests/purity/check.mjs
 * Exit 0 = pure; exit 1 = violations listed.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const testsRoot = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(testsRoot, '..', '..');
const coreRoot = join(repoRoot, 'packages', 'core');
const distRoot = join(coreRoot, 'dist');

let violations = 0;
const fail = (msg) => {
  violations += 1;
  console.error(`FAIL  ${msg}`);
};
const pass = (msg) => console.log(`pass  ${msg}`);

// 1. dist/ must contain only CSS (and no JS of any kind)
const jsExtensions = ['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts', '.jsx', '.tsx'];

function walk(dir, cb) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, cb);
    } else {
      cb(full);
    }
  }
}

let distFiles = 0;
try {
  walk(distRoot, (file) => {
    distFiles += 1;
    const ext = file.slice(file.lastIndexOf('.'));
    if (jsExtensions.includes(ext)) {
      fail(`runtime JS in dist: ${file}`);
    }
  });
  pass(`dist contains ${distFiles} file(s), none are JS`);
} catch {
  fail('dist/ missing — run pnpm build first');
}

// 2. package.json: no runtime dependencies
const pkg = JSON.parse(readFileSync(join(coreRoot, 'package.json'), 'utf8'));
if (pkg.dependencies && Object.keys(pkg.dependencies).length > 0) {
  fail(`runtime dependencies present: ${Object.keys(pkg.dependencies).join(', ')}`);
} else {
  pass('no runtime dependencies');
}

// 3. files field must not include src/ or tooling
const files = pkg.files ?? [];
if (files.includes('src') || files.includes('build.mjs')) {
  fail(`files field exposes tooling: ${files.join(', ')}`);
} else {
  pass(`files field is publish-safe: [${files.join(', ')}]`);
}

// 4. exports must point only at CSS
for (const [key, value] of Object.entries(pkg.exports ?? {})) {
  const target = typeof value === 'string' ? value : value.default;
  if (target && !target.endsWith('.css') && target !== './package.json') {
    // Wildcard targets like "./dist/components/*" are CSS directories —
    // allowed as long as they resolve inside dist/ (CSS-only output).
    const isCssWildcard = target.includes('*') && target.startsWith('./dist/');
    if (!isCssWildcard) {
      fail(`exports["${key}"] points at non-CSS: ${target}`);
    }
  }
}
pass('exports point only at CSS');

// 5. dist CSS must not contain <script> or inline JS
try {
  walk(distRoot, (file) => {
    if (file.endsWith('.css')) {
      const content = readFileSync(file, 'utf8');
      if (/<script/i.test(content)) {
        fail(`script tag in CSS: ${file}`);
      }
    }
  });
  pass('no script tags in dist CSS');
} catch {
  /* dist missing already reported */
}

// 6. Build artifact sanity: the theme system must survive bundling.
// If Lightning CSS downlevels light-dark() (its browser data can lag the
// matrix), it emits @media (prefers-color-scheme: ...) fallback blocks and
// drops the function — which breaks the data-theme override contract
// (theme notes). Both signals are checked.
try {
  const indexCss = readFileSync(join(distRoot, 'index.css'), 'utf8');
  if (indexCss.includes('light-dark(')) {
    pass('light-dark() survives bundling');
  } else {
    fail('light-dark() missing from dist — theme tokens were downleveled');
  }
  if (indexCss.includes('@media (prefers-color-scheme')) {
    fail('prefers-color-scheme media fallback found in dist — light-dark() was downleveled');
  } else {
    pass('no prefers-color-scheme media fallback in dist');
  }
} catch {
  /* dist missing already reported */
}

// 7. Raw-token encapsulation: only src/tokens may define or reference
// --ui-base-* (host-facing derivation seeds) and --ui-pl-* (derivation
// intermediates); components and base consume semantic --ui-color-* tokens
// only (theme notes).
try {
  let rawRefs = 0;
  for (const layerDir of ['base', 'components']) {
    walk(join(coreRoot, 'src', layerDir), (file) => {
      if (file.endsWith('.css') && /--ui-(base|pl)-/.test(readFileSync(file, 'utf8'))) {
        rawRefs += 1;
        fail(`raw token reference: ${file}`);
      }
    });
  }
  if (rawRefs === 0) pass('components/base consume only semantic tokens');
} catch {
  /* core src missing — reported by other checks */
}

console.log('');

// 8. Exported entry points must actually exist in dist. The "./components/*"
// wildcard in package.json is otherwise skipped by the export check above
// without ever being resolved (audit 2026-10-15).
try {
  readFileSync(join(distRoot, 'tokens', 'index.css'));
  pass('dist/tokens/index.css exists ("./tokens" entry)');
} catch {
  fail('dist/tokens/index.css missing — "./tokens" export is broken');
}

try {
  const componentEntries = readdirSync(join(distRoot, 'components'), {
    withFileTypes: true,
  });
  // Flat layout: one css file per component (components/badge.css).
  const withCss = componentEntries.filter((e) => e.isFile() && e.name.endsWith('.css'));
  if (withCss.length === 0) {
    fail('dist/components/* has no component CSS — "./components/*" export is broken');
  } else {
    pass(`dist/components/* resolves ${withCss.length} component CSS module(s)`);
  }
} catch {
  fail('dist/components missing — "./components/*" export is broken');
}

// 9. Canonical markup sync: three copies of the component API must not
// drift apart — the styled classes in dist must be exercised by the test
// fixture and documented in the public skill references; the fixture may
// only use classes the bundle styles or the canonical markup comments in
// src document (e.g. unstyled semantic hooks like ui-switch-label).
// Anti-examples in the references' "Do not" sections are not checked in
// the reverse direction on purpose.
try {
  const cssCls = (s) => new Set([...s.matchAll(/\.ui-[a-z0-9-]+/g)].map((m) => m[0].slice(1)));
  const docCls = (s) => new Set([...s.matchAll(/(?<![\w-])ui-[a-z0-9-]+/g)].map((m) => m[0]));

  let dist = new Set();
  walk(join(distRoot, 'components'), (file) => {
    if (file.endsWith('.css')) dist = new Set([...dist, ...cssCls(readFileSync(file, 'utf8'))]);
  });

  let src = new Set();
  walk(join(coreRoot, 'src'), (file) => {
    if (file.endsWith('.css')) src = new Set([...src, ...docCls(readFileSync(file, 'utf8'))]);
  });

  const fixture = docCls(readFileSync(join(testsRoot, '..', 'fixtures', 'fixture.html'), 'utf8'));

  const skillsRoot = join(repoRoot, 'skills', 'fewlines-css');
  let refs = new Set();
  walk(skillsRoot, (file) => {
    if (file.endsWith('.md')) refs = new Set([...refs, ...docCls(readFileSync(file, 'utf8'))]);
  });

  const missing = (need, have) => [...need].filter((c) => !have.has(c)).sort();

  const notInFixture = missing(dist, fixture);
  if (notInFixture.length)
    fail(`classes styled in dist but absent from fixture: ${notInFixture.join(', ')}`);
  else pass(`all ${dist.size} dist classes exercised by the fixture`);

  const notInRefs = missing(dist, refs);
  if (notInRefs.length)
    fail(`classes styled in dist but absent from skill references: ${notInRefs.join(', ')}`);
  else pass(`all ${dist.size} dist classes documented in skill references`);

  const stale = missing(fixture, new Set([...dist, ...src]));
  if (stale.length)
    fail(`fixture uses classes neither styled in dist nor documented in src: ${stale.join(', ')}`);
  else pass('fixture uses only classes from the bundle or canonical markup');
} catch (e) {
  fail(`canonical markup sync check could not run: ${e.message}`);
}

if (violations > 0) {
  console.error(`${violations} violation(s)`);
  process.exit(1);
}
console.log('Package is pure: CSS only, no runtime JS, no runtime deps');
