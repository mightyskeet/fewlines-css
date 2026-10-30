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
  const componentDirs = readdirSync(join(distRoot, 'components'), {
    withFileTypes: true,
  }).filter((e) => e.isDirectory());
  const withCss = componentDirs.filter((dir) =>
    readdirSync(join(distRoot, 'components', dir.name)).some((f) => f.endsWith('.css')),
  );
  if (withCss.length === 0) {
    fail('dist/components/* has no component CSS — "./components/*" export is broken');
  } else {
    pass(`dist/components/* resolves ${withCss.length} component CSS module(s)`);
  }
} catch {
  fail('dist/components missing — "./components/*" export is broken');
}

if (violations > 0) {
  console.error(`${violations} violation(s)`);
  process.exit(1);
}
console.log('Package is pure: CSS only, no runtime JS, no runtime deps');
