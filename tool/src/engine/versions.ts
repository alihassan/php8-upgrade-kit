import type { PhpVersion } from './types';

function parts(v: string): number[] {
  return v.split('.').map((x) => parseInt(x, 10) || 0);
}

export function compareVersions(a: string, b: string): number {
  const pa = parts(a);
  const pb = parts(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d < 0 ? -1 : 1;
  }
  return 0;
}

/** True when `v` is the same as or older than `target`. */
export function versionAtMost(v: PhpVersion | string, target: string): boolean {
  return compareVersions(v, target) <= 0;
}
