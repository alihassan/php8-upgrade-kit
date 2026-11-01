import { Engine } from 'php-parser';
import type { Node } from './types';

const engines = new Map<string, Engine>();

function engine(version: string): Engine {
  let e = engines.get(version);
  if (!e) {
    e = new Engine({
      parser: { extractDoc: false, suppressErrors: true, version },
      ast: { withPositions: true, withSource: false },
      lexer: { short_tags: true },
    });
    engines.set(version, e);
  }
  return e;
}

export interface Parsed {
  ast: Node;
  errors: { line: number; message: string }[];
}

/**
 * Parse with the newest grammar first. Legacy code sometimes parses more
 * cleanly with the 7.4 grammar, so keep whichever attempt has fewer errors.
 */
export function parse(code: string, path: string): Parsed {
  let best: Parsed | null = null;
  for (const v of ['8.4', '7.4']) {
    let ast: Node;
    try {
      ast = engine(v).parseCode(code, path);
    } catch (e) {
      const err = e as { lineNumber?: number; message: string };
      const p = { ast: { kind: 'program', children: [] }, errors: [{ line: err.lineNumber ?? 1, message: err.message }] };
      if (!best) best = p;
      continue;
    }
    const errors = (ast.errors ?? []).map((er: Node) => ({ line: er.line ?? er.loc?.start?.line ?? 1, message: String(er.message) }));
    const p = { ast, errors };
    if (!best || errors.length < best.errors.length) best = p;
    if (errors.length === 0) break;
  }
  return best!;
}

const SKIP = new Set(['loc', 'leadingComments', 'trailingComments', 'errors', 'comments', 'tokens']);

/** Depth-first walk. The callback returns false to skip a node's children. */
export function walk(node: Node, enter: (n: Node, parent: Node | null) => boolean | void, leave?: (n: Node) => void, parent: Node | null = null): void {
  if (!node || typeof node !== 'object' || typeof node.kind !== 'string') return;
  if (enter(node, parent) === false) return;
  for (const key of Object.keys(node)) {
    if (SKIP.has(key)) continue;
    const v = node[key];
    if (Array.isArray(v)) {
      for (const c of v) if (c && typeof c === 'object') walk(c, enter, leave, node);
    } else if (v && typeof v === 'object' && typeof v.kind === 'string') {
      walk(v, enter, leave, node);
    }
  }
  leave?.(node);
}

/** Name of a node that can carry one: identifiers, names, plain strings. */
export function nameOf(n: Node): string | null {
  if (!n) return null;
  if (typeof n === 'string') return n;
  if (n.kind === 'identifier' || n.kind === 'name') return typeof n.name === 'string' ? n.name : null;
  return null;
}

/** Lower-cased function name of a plain global call like `trim($x)` or `\trim($x)`, else null. */
export function callName(n: Node): string | null {
  if (n?.kind !== 'call' || n.what?.kind !== 'name') return null;
  if (n.what.resolution === 'qn') return null; // Foo\bar(): not the global function
  return String(n.what.name).replace(/^\\/, '').toLowerCase();
}

/** Lower-cased constant name for a bare constant reference like FILTER_SANITIZE_STRING. */
export function constName(n: Node, parent: Node | null): string | null {
  if (n?.kind !== 'name') return null;
  if (parent && (parent.kind === 'call' || parent.kind === 'new') && parent.what === n) return null;
  if (parent && parent.kind === 'staticlookup' && parent.what === n) return null;
  if (parent && (parent.kind === 'class' || parent.kind === 'interface')) return null;
  return String(n.name).replace(/^\\/, '').toUpperCase();
}

export function hasAttribute(n: Node, attr: string): boolean {
  const want = attr.toLowerCase();
  for (const g of n?.attrGroups ?? []) {
    for (const a of g.attrs ?? []) {
      const name = String(a.name ?? '').replace(/^\\/, '').toLowerCase();
      if (name === want) return true;
    }
  }
  return false;
}

export function lineOf(n: Node): number {
  return n?.loc?.start?.line ?? 1;
}

/** First non-whitespace character at or after `offset`. */
export function nextChar(code: string, offset: number): string {
  for (let i = offset; i < code.length; i++) {
    if (!/\s/.test(code[i])) return code[i];
  }
  return '';
}
