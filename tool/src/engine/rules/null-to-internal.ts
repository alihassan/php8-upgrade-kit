import { DOC, isSuperglobalLookup } from './_helpers';
import { callName, nameOf, walk } from '../ast';
import type { Node, Rule, VisitContext } from '../types';

/** Built-in functions and the 0-based positions of their string parameters that commonly receive null. */
const STRING_PARAMS: Record<string, number[]> = {
  strlen: [0], trim: [0], ltrim: [0], rtrim: [0], strtolower: [0], strtoupper: [0], ucfirst: [0], ucwords: [0],
  lcfirst: [0], htmlspecialchars: [0], htmlentities: [0], html_entity_decode: [0], strip_tags: [0], addslashes: [0],
  stripslashes: [0], nl2br: [0], urlencode: [0], rawurlencode: [0], urldecode: [0], base64_encode: [0],
  base64_decode: [0], md5: [0], sha1: [0], str_pad: [0], str_repeat: [0], strrev: [0], wordwrap: [0],
  substr: [0], strpos: [0, 1], stripos: [0, 1], strrpos: [0, 1], strstr: [0, 1], str_contains: [0, 1],
  str_starts_with: [0, 1], str_ends_with: [0, 1], substr_count: [0, 1], explode: [0, 1], str_replace: [2],
  str_ireplace: [2], preg_match: [1], preg_match_all: [1], preg_replace: [2], preg_split: [1],
  json_decode: [0], mb_strlen: [0], mb_strtolower: [0], mb_strtoupper: [0], mb_substr: [0],
  number_format: [0], strcmp: [0, 1], strcasecmp: [0, 1], ctype_digit: [], parse_str: [0], setcookie: [1],
};

type Why = string | null;

/** Why an expression may be null, or null when it looks safe. */
function maybeNull(expr: Node, vars: Map<string, string>): Why {
  if (!expr) return null;
  if (expr.kind === 'nullkeyword') return 'null';
  if (isSuperglobalLookup(expr)) return 'request input that is null when the field is missing';
  if (callName(expr) === 'filter_input') return 'filter_input(), which returns null when the field is missing';
  if (expr.kind === 'variable' && typeof expr.name === 'string') return vars.get(expr.name) ?? null;
  return null;
}

/**
 * Variables in the enclosing function whose last assignment (above the call)
 * can be null, plus parameters with a null default.
 */
function nullableVars(fn: Node | null, root: Node, before: number): Map<string, string> {
  const vars = new Map<string, string>();
  const body = fn ?? root;
  for (const p of fn?.arguments ?? []) {
    if (p.value?.kind === 'nullkeyword' && !p.type) vars.set(String(nameOf(p.name)), 'a parameter that defaults to null');
  }
  walk(body, (n) => {
    if (n !== body && ['function', 'method', 'closure', 'arrowfunc', 'class'].includes(n.kind)) return false;
    if (n.kind !== 'assign' || n.left?.kind !== 'variable' || typeof n.left.name !== 'string') return;
    if ((n.loc?.start?.offset ?? Infinity) >= before) return;
    let why: Why = null;
    if (n.operator === '=') {
      const r = n.right;
      if (r?.kind === 'bin' && r.type === '??' && r.right?.kind === 'nullkeyword') why = 'a value that falls back to null (?? null)';
      else why = maybeNull(r, new Map());
    }
    if (why) vars.set(n.left.name, why);
    else vars.delete(n.left.name);
  });
  return vars;
}

const rule: Rule = {
  id: 'null-to-internal',
  title: 'Passing null to a built-in function that expects text',
  phpVersion: '8.1',
  severity: 'deprecated',
  detection: 'heuristic',
  detectionNote:
    'Checks about 60 common string functions. It flags a literal null, request input like $_POST["x"] (null when the field is missing), filter_input(), and variables assigned one of those earlier in the same function. It cannot see values from the database, which are a frequent real source; your error log or tests will show those.',
  explanation:
    'Functions like trim() and strlen() expect text. Older PHP quietly treated a missing value (null) as empty text. Since PHP 8.1 each one logs a deprecation warning, and a future version will make it an error. On busy sites the warnings can fill the error log fast. Give the value a default before passing it in.',
  before: `$email = trim($_POST['email']);`,
  after: `$email = trim($_POST['email'] ?? '');`,
  docUrl: DOC.m81deprecated,
  visit: {
    call(n, ctx: VisitContext) {
      const name = callName(n);
      const positions = name ? STRING_PARAMS[name] : undefined;
      if (!positions?.length) return;
      let vars: Map<string, string> | null = null;
      for (const i of positions) {
        const arg = n.arguments?.[i];
        if (!arg) continue;
        if (arg.kind === 'variable') vars ??= nullableVars(ctx.scope.fn, ctx.root, n.loc?.start?.offset ?? 0);
        const why = maybeNull(arg, vars ?? new Map());
        if (why) return ctx.report(n, `${name}() may get ${why}`);
      }
    },
  },
};
export default rule;
