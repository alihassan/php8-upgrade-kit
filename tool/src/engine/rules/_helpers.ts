import { callName, constName, nameOf } from '../ast';
import type { Detection, Node, Rule, VisitContext } from '../types';

export const DOC = {
  m70removed: 'https://www.php.net/manual/en/migration70.removed-exts-sapis.php',
  m70incompat: 'https://www.php.net/manual/en/migration70.incompatible.php',
  m80incompat: 'https://www.php.net/manual/en/migration80.incompatible.php',
  m80deprecated: 'https://www.php.net/manual/en/migration80.deprecated.php',
  m81incompat: 'https://www.php.net/manual/en/migration81.incompatible.php',
  m81deprecated: 'https://www.php.net/manual/en/migration81.deprecated.php',
  m82deprecated: 'https://www.php.net/manual/en/migration82.deprecated.php',
  m83deprecated: 'https://www.php.net/manual/en/migration83.deprecated.php',
  m84deprecated: 'https://www.php.net/manual/en/migration84.deprecated.php',
};

type Meta = Omit<Rule, 'visit' | 'checkFile' | 'detection'> & { detection?: Detection; detectionNote?: string };

/**
 * A rule that fires on calls to global functions by name. Calls are skipped
 * when the scanned code defines a function with the same name itself, which
 * is how polyfills for removed functions look.
 */
export function callRule(
  meta: Meta & { names: string[]; when?: (call: Node, ctx: VisitContext) => boolean | string },
): Rule {
  const names = new Set(meta.names.map((n) => n.toLowerCase()));
  const { names: _n, when, ...rest } = meta;
  return {
    detection: 'ast',
    ...rest,
    visit: {
      call(n, ctx) {
        const name = callName(n);
        if (!name || !names.has(name) || ctx.project.functions.has(name)) return;
        const r = when ? when(n, ctx) : true;
        if (r) ctx.report(n, typeof r === 'string' ? r : `${name}()`);
      },
    },
  };
}

/** A rule that fires on references to global constants by name. */
export function constRule(meta: Meta & { constants: string[] }): Rule {
  const set = new Set(meta.constants.map((c) => c.toUpperCase()));
  const { constants: _c, ...rest } = meta;
  return {
    detection: 'ast',
    ...rest,
    visit: {
      name(n, ctx) {
        const c = constName(n, ctx.parent);
        if (c && set.has(c)) ctx.report(n, c);
      },
    },
  };
}

export function args(call: Node): Node[] {
  return call.arguments ?? [];
}

export function isStringLiteral(n: Node): boolean {
  return n?.kind === 'string';
}

const SUPERGLOBALS = new Set(['_GET', '_POST', '_REQUEST', '_COOKIE', '_SERVER', '_FILES', '_SESSION', '_ENV']);

/** `$_GET['x']` and friends: always strings or arrays, and null when the key is missing. */
export function isSuperglobalLookup(n: Node): boolean {
  let cur = n;
  while (cur?.kind === 'offsetlookup') cur = cur.what;
  return cur?.kind === 'variable' && SUPERGLOBALS.has(cur.name);
}

/** PHP 8's idea of a numeric string: optional whitespace, a number, optional whitespace. */
export function isNumericString(s: string): boolean {
  return /^\s*[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?\s*$/.test(s);
}

/** Class, interface, trait or enum names that the given words make illegal. */
export function reservedNameVisitor(words: string[]) {
  const set = new Set(words);
  const check = (n: Node, ctx: VisitContext) => {
    const name = String(nameOf(n.name) ?? '');
    if (set.has(name.toLowerCase())) ctx.report(n, name);
  };
  return { class: check, interface: check, trait: check };
}
