/**
 * Test preparation: copy the built core CSS into apps/docs so the static
 * server can serve it at /core.css (fixture pages reference that path).
 * If the build is stale (a src file is newer than dist), rebuild first —
 * a silently stale dist once made demo/fixture checks validate old CSS.
 * Run before Playwright suites: node prepare.mjs
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const testsRoot = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(testsRoot, '..');
const coreRoot = join(repoRoot, 'packages', 'core');
const distCss = join(coreRoot, 'dist', 'index.css');
const target = join(repoRoot, 'apps', 'docs', 'core.css');

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
console.log('Copied core CSS to apps/docs/core.css');
