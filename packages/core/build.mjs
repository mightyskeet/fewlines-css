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
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
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

// The CLI binary name differs per platform: lightningcss.exe on Windows,
// lightningcss elsewhere.
const cliName = process.platform === 'win32' ? 'lightningcss.exe' : 'lightningcss';
const cli = join(pkgRoot, 'node_modules', 'lightningcss-cli', cliName);

if (!existsSync(cli)) {
  console.error(`lightningcss binary not found: ${cli} — run pnpm install`);
  process.exit(1);
}

// Lightning CSS ships its own browser version database which lags behind
// caniuse (probed 2026-10-01, lightningcss-cli 1.33.0: highest accepted
// majors are chrome 141, firefox 143, safari 26 — anything newer panics
// with UnknownBrowserVersion). The matrix floor (Chrome 153+, FF 155+,
// Safari 26.6+ per .browserslistrc / compatibility notes) is newer than
// the tool's data, so targets are pinned to the highest majors the tool
// knows: nothing in use gets downleveled (all features in src are
// introduced at or below these versions) and the artifact is verified by
// the purity check (light-dark() kept, no prefers-color-scheme media
// fallback). Edge is omitted on purpose: it is Chromium, so it inherits
// Chrome behavior, while Lightning CSS's own Edge data is stale (≤130)
// and would silently drag down features added after Chrome 130.
const targets = 'chrome 141,firefox 143,safari 26';

// package.json exports ./tokens and ./components/*, which map to plain files
// (dist/tokens/index.css, dist/components/<name>/*.css) rather than bundles.
// Emitting a separate bundle per entry would be tooling for nothing: instead
// the src tree is copied 1:1 into dist BEFORE the bundle runs (the bundle
// then overwrites dist/index.css). The copied files keep their relative
// @import because the whole tree is copied together; they ship as plain CSS
// and are compiled by the consumer's own pipeline. dist/ stays CSS-only.
cpSync(srcDir, distDir, { recursive: true });

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
