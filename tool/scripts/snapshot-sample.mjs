// Writes src/sample/legacy-app.json from the walkthrough's starting tag, so
// "Load a legacy example" always shows the original, un-upgraded app.
//   npm run sample
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const TAG = 'v0-php72-original';
const ROOT = 'walkthrough/legacy-app/';
const top = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const git = (...args) => execFileSync('git', args, { cwd: top, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

const paths = git('ls-tree', '-r', '--name-only', TAG, ROOT).split('\n').filter(Boolean);
const show = (p) => git('show', `${TAG}:${p}`);

const files = paths
  .filter((p) => p.endsWith('.php') && !p.startsWith(`${ROOT}vendor/`))
  .map((p) => ({ path: p.slice(ROOT.length), code: show(p) }));

const sample = {
  source: `git tag ${TAG}`,
  files,
  composerJson: show(`${ROOT}composer.json`),
  composerLock: show(`${ROOT}composer.lock`),
};
fs.writeFileSync(new URL('../src/sample/legacy-app.json', import.meta.url), JSON.stringify(sample, null, 1) + '\n');
console.log(`Wrote ${files.length} PHP files from ${TAG}.`);
