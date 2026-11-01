/**
 * A small Composer version-constraint reader. It turns a constraint such as
 * "^7.2 || ~8.0.0" into a union of version intervals, which is enough to
 * answer "does this allow any PHP 8.3.x release?".
 *
 * Covers: || and |, AND by comma or space, ^, ~, >=, >, <=, <, !=, =, ==,
 * wildcards (7.*, 7.2.*, *), hyphen ranges (1.0 - 2.0) and stability flags
 * (@dev, -beta), which are ignored.
 */

type V = number[]; // always 4 parts

export interface Bound {
  v: V;
  inclusive: boolean;
}
export interface Interval {
  lo: Bound | null; // null = unbounded
  hi: Bound | null;
}

const INF: Interval = { lo: null, hi: null };

export function parseVersion(s: string): { v: V; parts: number } | null {
  const m = /^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:\.(\d+))?/i.exec(s.trim());
  if (!m) return null;
  const nums = m.slice(1).filter((x) => x !== undefined).map(Number);
  const v = [...nums, 0, 0, 0, 0].slice(0, 4);
  return { v, parts: nums.length };
}

export function cmp(a: V, b: V): number {
  for (let i = 0; i < 4; i++) if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  return 0;
}

function bump(v: V, idx: number): V {
  const out = v.slice(0, idx + 1);
  out[idx] += 1;
  return [...out, 0, 0, 0, 0].slice(0, 4);
}

const ge = (v: V): Bound => ({ v, inclusive: true });
const lt = (v: V): Bound => ({ v, inclusive: false });

function atom(raw: string): Interval[] {
  const s = raw.replace(/@\w+$/, '').replace(/-(dev|alpha|beta|rc|patch|p)\d*$/i, '').trim();
  if (s === '' || s === '*' || /^x$/i.test(s)) return [INF];

  const wild = /^v?(\d+)(?:\.(\d+))?\.[*x]$/i.exec(s);
  if (wild) {
    const p = parseVersion(s.replace(/\.[*x]$/i, ''))!;
    return [{ lo: ge(p.v), hi: lt(bump(p.v, p.parts - 1)) }];
  }

  const op = /^(\^|~|>=|<=|>|<|!=|==|=)?\s*(.+)$/.exec(s);
  if (!op) return [];
  const p = parseVersion(op[2]);
  if (!p) return [];
  const { v, parts } = p;
  switch (op[1]) {
    case '^': {
      // ^1.2.3 -> <2.0.0; ^0.3 -> <0.4.0; ^0.0.3 -> <0.0.4
      let idx = v.findIndex((x) => x !== 0);
      if (idx === -1 || idx >= parts) idx = Math.max(0, parts - 1);
      return [{ lo: ge(v), hi: lt(bump(v, idx)) }];
    }
    case '~':
      // ~1.2.3 -> <1.3.0; ~1.2 -> <2.0.0; ~1 -> <2.0.0
      return [{ lo: ge(v), hi: lt(bump(v, Math.max(0, parts - 2))) }];
    case '>=':
      return [{ lo: ge(v), hi: null }];
    case '>':
      return [{ lo: { v, inclusive: false }, hi: null }];
    case '<=':
      return [{ lo: null, hi: { v, inclusive: true } }];
    case '<':
      return [{ lo: null, hi: lt(v) }];
    case '!=':
      return [
        { lo: null, hi: lt(v) },
        { lo: { v, inclusive: false }, hi: null },
      ];
    default:
      return [{ lo: ge(v), hi: { v, inclusive: true } }];
  }
}

function intersect(a: Interval, b: Interval): Interval | null {
  const lo = !a.lo ? b.lo : !b.lo ? a.lo : cmp(a.lo.v, b.lo.v) > 0 ? a.lo : cmp(a.lo.v, b.lo.v) < 0 ? b.lo : { v: a.lo.v, inclusive: a.lo.inclusive && b.lo.inclusive };
  const hi = !a.hi ? b.hi : !b.hi ? a.hi : cmp(a.hi.v, b.hi.v) < 0 ? a.hi : cmp(a.hi.v, b.hi.v) > 0 ? b.hi : { v: a.hi.v, inclusive: a.hi.inclusive && b.hi.inclusive };
  if (lo && hi) {
    const c = cmp(lo.v, hi.v);
    if (c > 0 || (c === 0 && !(lo.inclusive && hi.inclusive))) return null;
  }
  return { lo, hi };
}

function intersectSets(a: Interval[], b: Interval[]): Interval[] {
  const out: Interval[] = [];
  for (const x of a) for (const y of b) {
    const i = intersect(x, y);
    if (i) out.push(i);
  }
  return out;
}

/** Parse a whole constraint. Returns null when it can't be read, so callers can say "unknown". */
export function parseConstraint(input: string): Interval[] | null {
  const text = input.trim();
  if (!text) return [INF];
  const result: Interval[] = [];
  for (const orPart of text.split(/\s*\|\|?\s*/)) {
    // Hyphen range: "1.0 - 2.0"
    const hyphen = /^(\S+)\s+-\s+(\S+)$/.exec(orPart.trim());
    if (hyphen) {
      const a = parseVersion(hyphen[1]);
      const b = parseVersion(hyphen[2]);
      if (!a || !b) return null;
      const hi = b.parts >= 3 ? { v: b.v, inclusive: true } : lt(bump(b.v, b.parts - 1));
      result.push({ lo: ge(a.v), hi });
      continue;
    }
    const atoms = orPart
      .replace(/(>=|<=|!=|==|>|<|=|\^|~)\s+/g, '$1')
      .split(/\s*,\s*|\s+/)
      .filter(Boolean);
    let set: Interval[] = [INF];
    for (const a of atoms) {
      const parsed = atom(a);
      if (!parsed.length) return null;
      set = intersectSets(set, parsed);
    }
    result.push(...set);
  }
  return result;
}

/** Does the constraint allow at least one release of PHP `minor` (like "8.3")? */
export function allowsMinor(constraint: string, minor: string): boolean | null {
  const set = parseConstraint(constraint);
  if (!set) return null;
  const p = parseVersion(minor)!;
  const range: Interval = { lo: ge(p.v), hi: lt(bump(p.v, 1)) };
  return set.some((i) => intersect(i, range) !== null);
}

/** Does the constraint allow this exact version? */
export function allowsVersion(constraint: string, version: string): boolean | null {
  const set = parseConstraint(constraint);
  const p = parseVersion(version);
  if (!set || !p) return null;
  const point: Interval = { lo: ge(p.v), hi: { v: p.v, inclusive: true } };
  return set.some((i) => intersect(i, point) !== null);
}
