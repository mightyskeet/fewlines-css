/**
 * Test preparation: copy the built core CSS into apps/docs so the static
 * server can serve it at /core.css (fixture pages reference that path).
 * Run before Playwright suites: node prepare.mjs
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const testsRoot = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(testsRoot, '..');
const distCss = join(repoRoot, 'packages', 'core', 'dist', 'index.css');
const target = join(repoRoot, 'apps', 'docs', 'core.css');

if (!existsSync(distCss)) {
  console.error('dist/index.css missing — run pnpm build first');
  process.exit(1);
}

mkdirSync(dirname(target), { recursive: true });
copyFileSync(distCss, target);
console.log('Copied core CSS to apps/docs/core.css');
