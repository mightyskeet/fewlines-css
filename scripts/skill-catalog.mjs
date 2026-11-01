// Generates skills/index.json — the OpenCode HTTP skill catalog served via
// raw.githubusercontent.com. Re-run after changing skills/fewlines-css or
// bumping packages/core version (OpenCode refreshes its cache only when
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
console.log(`skills/index.json: fewlines-css v${version}, ${references.length + 1} files`);
