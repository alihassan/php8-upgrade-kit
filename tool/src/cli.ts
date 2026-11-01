// Command-line runner for the same engine the web tool uses.
//   npx tsx src/cli.ts <folder> [--target 8.3] [--format md|json] [--out file] [--composer] [--title "..."]
import fs from 'node:fs';
import path from 'node:path';
import { analyze } from './engine/analyze';
import { addFile, emptyCollected } from './engine/files';
import { checkComposer, type ComposerReport } from './engine/composer/check';
import { summaryLine, toJson, toMarkdown } from './engine/report/report';
import { TARGETS, type Target } from './engine/types';

const argv = process.argv.slice(2);
const flag = (name: string, fallback?: string) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : fallback;
};
const dir = argv.find((a, i) => !a.startsWith('--') && !argv[i - 1]?.startsWith('--')) ?? '.';
const target = flag('target', '8.3') as Target;
if (!TARGETS.includes(target)) throw new Error(`--target must be one of ${TARGETS.join(', ')}`);

const c = emptyCollected();
const walk = (d: string) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const p = path.join(d, e.name);
    const rel = path.relative(dir, p).replace(/\\/g, '/');
    if (e.isDirectory()) {
      if (!['vendor', 'node_modules', '.git'].includes(e.name)) walk(p);
    } else addFile(c, rel, fs.readFileSync(p, 'utf8'));
  }
};
walk(dir);

const result = analyze(c.php, target);
let composer: ComposerReport | null = null;
if (argv.includes('--composer') && (c.composerJson || c.composerLock)) {
  composer = await checkComposer({ composerJson: c.composerJson, composerLock: c.composerLock, target });
}
const format = flag('format', 'md');
const out = format === 'json' ? toJson(result, composer) : toMarkdown(result, composer, flag('title', 'PHP upgrade report'));
const file = flag('out');
if (file) {
  fs.writeFileSync(file, out + '\n');
  console.error(`${summaryLine(result)} (${c.php.length} files) -> ${file}`);
} else {
  process.stdout.write(out + '\n');
}
