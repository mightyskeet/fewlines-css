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

const result = spawnSync(
  cli,
  ['--bundle', entry, '--output-dir', distDir, '--minify', '--browserslist'],
  { stdio: 'inherit' },
);

if (result.status !== 0) {
  console.error('Build failed');
  process.exit(result.status ?? 1);
}

console.log('Built dist/index.css');
