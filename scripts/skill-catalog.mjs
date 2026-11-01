// Generates two committed release artifacts from the core package version:
// skills/index.json — the OpenCode HTTP skill catalog served via
// raw.githubusercontent.com — and apps/docs/js/site-version.js, the version
// badge source for the docs site. Re-run after changing skills/fewlines-css
// or bumping packages/core version (OpenCode refreshes its cache only when
// the catalog version changes).
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const skillDir = 'skills/fewlines-css';
const { version } = JSON.parse(await readFile('packages/core/package.json', 'utf8'));
const references = (await readdir(join(skillDir, 'references')))
  .sort()
  .map((f) => `references/${f}`);

const catalog = {
  skills: [{ name: 'fewlines-css', version, files: ['SKILL.md', ...references] }],
};

await writeFile('skills/index.json', JSON.stringify(catalog, null, 2) + '\n');
await writeFile('apps/docs/js/site-version.js', `const SITE_VERSION = '${version}';\n`);
console.log(
  `skills/index.json + apps/docs/js/site-version.js: v${version}, ${references.length + 1} files`,
);
