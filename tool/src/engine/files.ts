import { unzipSync, strFromU8 } from 'fflate';
import type { SourceFile } from './types';

export const MAX_FILES = 2000;
const SKIP_DIR = /(^|\/)(vendor|node_modules|\.git)\//;

export interface Collected {
  php: SourceFile[];
  composerJson?: string;
  composerLock?: string;
  skipped: number;
  truncated: boolean;
}

export function emptyCollected(): Collected {
  return { php: [], skipped: 0, truncated: false };
}

/** Add one file by name. Keeps the shortest-path composer.json/lock (the project root). */
export function addFile(c: Collected, path: string, text: string): void {
  const p = path.replace(/\\/g, '/').replace(/^\.\//, '');
  if (SKIP_DIR.test(p)) {
    c.skipped++;
    return;
  }
  const base = p.split('/').pop()!;
  if (base === 'composer.json' && (!c.composerJson || p.split('/').length <= 2)) c.composerJson = text;
  else if (base === 'composer.lock' && (!c.composerLock || p.split('/').length <= 2)) c.composerLock = text;
  else if (/\.(php|phtml|inc)$/i.test(base)) {
    if (c.php.length >= MAX_FILES) {
      c.truncated = true;
      return;
    }
    c.php.push({ path: p, code: text });
  }
}

export function addZip(c: Collected, bytes: Uint8Array): void {
  const entries = unzipSync(bytes, {
    filter: (f) => !SKIP_DIR.test(f.name) && /(\.(php|phtml|inc)|composer\.(json|lock))$/i.test(f.name),
  });
  const names = Object.keys(entries).sort();
  // Strip a shared top folder (my-app/...) so paths read naturally.
  const top = names.length && names.every((n) => n.split('/')[0] === names[0].split('/')[0] && n.includes('/')) ? names[0].split('/')[0] + '/' : '';
  for (const n of names) addFile(c, n.slice(top.length), strFromU8(entries[n]));
}
