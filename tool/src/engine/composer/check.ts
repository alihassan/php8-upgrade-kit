import { allowsMinor, allowsVersion, cmp, parseVersion } from './constraint';
import type { Target } from '../types';

/**
 * Packagist's https://repo.packagist.org/p2/{name}.json endpoint sends no
 * CORS headers (checked 2026-11-01), so browsers block it. The
 * https://packagist.org/packages/{name}.json API does send
 * Access-Control-Allow-Origin: *, so the checker uses that one.
 */
export const PACKAGIST = 'https://packagist.org/packages';

export type Support = 'yes' | 'no' | 'no-limit' | 'unknown';

export interface PackageReport {
  name: string;
  dev: boolean;
  /** Locked version from composer.lock, or the constraint from composer.json. */
  current: string;
  source: 'lock' | 'json';
  /** The version we judged: the locked one, or the newest one the composer.json constraint allows. */
  judged: string | null;
  phpConstraint: string | null;
  supports: Support;
  /** Lowest stable release at or above the current one that supports the target. */
  lowestSupporting: string | null;
  abandoned: string | boolean | null;
  error?: string;
}

export interface ComposerReport {
  target: Target;
  rootPhp: string | null;
  rootAllowsTarget: boolean | null;
  packages: PackageReport[];
}

interface Wanted {
  name: string;
  current: string;
  dev: boolean;
  source: 'lock' | 'json';
}

const PLATFORM = /^(php|php-64bit|hhvm|ext-.+|lib-.+|composer(-plugin|-runtime)?-api|composer)$/i;

function safeJson(text: string | undefined): Record<string, unknown> | null {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Packages to look up: from composer.lock when we have it (exact versions), else composer.json constraints. */
export function wantedPackages(composerJson?: string, composerLock?: string): { rootPhp: string | null; wanted: Wanted[] } {
  const json = safeJson(composerJson) as { require?: Record<string, string>; 'require-dev'?: Record<string, string> } | null;
  const lock = safeJson(composerLock) as { packages?: { name: string; version: string }[]; 'packages-dev'?: { name: string; version: string }[] } | null;
  const rootPhp = json?.require?.php ?? null;
  const wanted: Wanted[] = [];
  if (lock?.packages) {
    for (const p of lock.packages) wanted.push({ name: p.name, current: p.version, dev: false, source: 'lock' });
    for (const p of lock['packages-dev'] ?? []) wanted.push({ name: p.name, current: p.version, dev: true, source: 'lock' });
  } else if (json) {
    for (const [name, c] of Object.entries(json.require ?? {})) if (!PLATFORM.test(name)) wanted.push({ name, current: c, dev: false, source: 'json' });
    for (const [name, c] of Object.entries(json['require-dev'] ?? {})) if (!PLATFORM.test(name)) wanted.push({ name, current: c, dev: true, source: 'json' });
  }
  return { rootPhp, wanted };
}

interface PackagistVersion {
  version: string;
  version_normalized: string;
  require?: Record<string, string>;
}

function isStable(v: PackagistVersion): boolean {
  return !/dev|alpha|beta|rc|patch/i.test(v.version_normalized) && !!parseVersion(v.version_normalized);
}

function supportOf(v: PackagistVersion, target: Target): Support {
  const php = v.require?.php;
  if (!php) return 'no-limit';
  const ok = allowsMinor(php, target);
  return ok === null ? 'unknown' : ok ? 'yes' : 'no';
}

export function judgePackage(
  w: Wanted,
  data: { package: { versions: Record<string, PackagistVersion>; abandoned?: string | boolean } },
  target: Target,
): PackageReport {
  const versions = Object.values(data.package.versions ?? {});
  const stable = versions.filter(isStable).sort((a, b) => cmp(parseVersion(a.version_normalized)!.v, parseVersion(b.version_normalized)!.v));
  let judged: PackagistVersion | undefined;
  if (w.source === 'lock') {
    const strip = (s: string) => s.replace(/^v/i, '');
    judged = versions.find((v) => strip(v.version) === strip(w.current) || v.version_normalized === w.current);
  } else {
    judged = [...stable].reverse().find((v) => allowsVersion(w.current, v.version_normalized));
  }
  const base = judged ? parseVersion(judged.version_normalized)?.v : undefined;
  const supporting = stable.filter((v) => {
    const s = supportOf(v, target);
    return s === 'yes' || s === 'no-limit';
  });
  // Only versions at or above the current one count: an old release with an
  // open-ended "php: >=5.5" is a downgrade, not a fix.
  const lowest = base ? supporting.find((v) => cmp(parseVersion(v.version_normalized)!.v, base) >= 0) : supporting[0];

  return {
    name: w.name,
    dev: w.dev,
    current: w.current,
    source: w.source,
    judged: judged?.version ?? null,
    phpConstraint: judged?.require?.php ?? null,
    supports: judged ? supportOf(judged, target) : 'unknown',
    lowestSupporting: lowest?.version ?? null,
    abandoned: data.package.abandoned ?? null,
    error: judged ? undefined : `version ${w.current} not found on Packagist`,
  };
}

export async function checkComposer(
  opts: { composerJson?: string; composerLock?: string; target: Target },
  fetchFn: typeof fetch = fetch,
  concurrency = 6,
): Promise<ComposerReport> {
  const { rootPhp, wanted } = wantedPackages(opts.composerJson, opts.composerLock);
  const packages: PackageReport[] = new Array(wanted.length);
  let next = 0;
  async function worker() {
    while (next < wanted.length) {
      const i = next++;
      const w = wanted[i];
      try {
        const res = await fetchFn(`${PACKAGIST}/${w.name}.json`);
        if (!res.ok) throw new Error(`Packagist answered ${res.status}`);
        packages[i] = judgePackage(w, await res.json(), opts.target);
      } catch (e) {
        packages[i] = {
          name: w.name, dev: w.dev, current: w.current, source: w.source, judged: null, phpConstraint: null,
          supports: 'unknown', lowestSupporting: null, abandoned: null, error: (e as Error).message,
        };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, wanted.length) }, worker));
  return {
    target: opts.target,
    rootPhp,
    rootAllowsTarget: rootPhp ? allowsMinor(rootPhp, opts.target) : null,
    packages,
  };
}
