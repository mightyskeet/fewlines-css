/**
 * Build script for @fewlines/css.
 *
 * Compiles src/ -> dist/ with Lightning CSS:
 * - minification
 * - browserslist-based targets (see .browserslistrc at repo root)
 * - preserves @layer, custom properties and modern syntax where targets allow
 *
 * Zero runtime JS policy: this script is tooling only; dist/ contains CSS only.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const pkgRoot = dirname(fileURLToPath(import.meta.url));
const srcDir = join(pkgRoot, 'src');
const distDir = join(pkgRoot, 'dist');
const entry = join(srcDir, 'index.css');

if (!existsSync(entry)) {
  console.error('src/index.css not found');
  process.exit(1);
}

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

const cli = join(pkgRoot, 'node_modules', 'lightningcss-cli', 'lightningcss.exe');

// Lightning CSS ships its own browser version database which lags behind
// caniuse. Passing --browserslist with versions it does not know (e.g.
// Chrome 153) makes it silently downlevel modern syntax like light-dark().
// Explicit targets keep the modern baseline intact; the values are the
// floor of the browser matrix (see .browserslistrc / compatibility notes)
// expressed in versions Lightning CSS understands.
const targets = 'chrome 130,firefox 134,safari 18.2,edge 130';

const result = spawnSync(
  cli,
  ['--bundle', entry, '--output-dir', distDir, '--minify', '--targets', targets],
  { stdio: 'inherit' },
);

if (result.status !== 0) {
  console.error('Build failed');
  process.exit(result.status ?? 1);
}

console.log('Built dist/index.css');
