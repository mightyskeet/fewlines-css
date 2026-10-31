/**
 * Test preparation: copy the built core CSS into apps/docs so the static
 * server can serve it at /core.css (fixture pages reference that path).
 * If the build is stale (a src file is newer than dist), rebuild first —
 * a silently stale dist once made demo/fixture checks validate old CSS.
 * Run before Playwright suites: node prepare.mjs
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const testsRoot = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(testsRoot, '..');
const coreRoot = join(repoRoot, 'packages', 'core');
const distCss = join(coreRoot, 'dist', 'index.css');
const target = join(repoRoot, 'apps', 'docs', 'css', 'core.css');

function newestMtime(dir) {
  let newest = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    const mtime = entry.isDirectory()
      ? newestMtime(full)
      : entry.name.endsWith('.css')
        ? statSync(full).mtimeMs
        : 0;
    if (mtime > newest) newest = mtime;
  }
  return newest;
}

const distMissing = !existsSync(distCss);
const stale = !distMissing && newestMtime(join(coreRoot, 'src')) > statSync(distCss).mtimeMs;
if (distMissing || stale) {
  console.log(
    distMissing ? 'dist/index.css missing — building…' : 'dist/index.css is stale — rebuilding…',
  );
  execSync('node build.mjs', { cwd: coreRoot, stdio: 'inherit' });
}

mkdirSync(dirname(target), { recursive: true });
copyFileSync(distCss, target);

// The palette widget imports the token-pair registry straight from the
// test registry source (tests/apca/token-pairs.mjs) at bundle time, and
// the apca-w3 contrast math is copied from npm — so the widget's APCA
// numbers always match the CI gate (tests/apca/check.mjs).
copyFileSync(
  join(repoRoot, 'node_modules', 'apca-w3', 'src', 'apca-w3.js'),
  join(repoRoot, 'apps', 'docs', 'vendor', 'apca-w3.mjs'),
);
// apca-w3 imports colorparsley by bare specifier (needed only by its
// calcAPCA shortcut) — rewrite the import to the vendored sibling copy.
{
  const target = join(repoRoot, 'apps', 'docs', 'vendor', 'apca-w3.mjs');
  writeFileSync(
    target,
    readFileSync(target, 'utf8').replaceAll(
      /import\s*{\s*colorParsley\s*}\s*from\s*'colorparsley'/g,
      "import { colorParsley } from './colorparsley.mjs'",
    ),
  );
}
// Resolve colorparsley through apca-w3's real (pnpm-store) location.
const apcaReal = realpathSync(join(repoRoot, 'node_modules', 'apca-w3'));
copyFileSync(
  join(dirname(apcaReal), 'colorparsley', 'src', 'colorparsley.js'),
  join(repoRoot, 'apps', 'docs', 'vendor', 'colorparsley.mjs'),
);
console.log('Copied core CSS to apps/docs/css/core.css');

// The browser specs load /fixture.html from the served site root, but the
// fixture itself is test scaffolding: it lives in tests/fixtures/ and is
// copied in (gitignored) so the committed site folder has no test files.
copyFileSync(
  join(testsRoot, 'fixtures', 'fixture.html'),
  join(repoRoot, 'apps', 'docs', 'fixture.html'),
);
console.log('Copied fixture to apps/docs/fixture.html');

// Bundle the palette widget into a plain (non-module) script: colors.html
// loads js/palette.js with a regular <script>, which works from file:// —
// ESM imports do not. The bundle imports the registry from tests/ at
// build time, so it is rebuilt whenever prepare runs.
execSync('pnpm --filter @fewlines/docs build', {
  cwd: repoRoot,
  stdio: 'inherit',
});
