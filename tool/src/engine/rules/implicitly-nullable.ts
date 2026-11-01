import { DOC } from './_helpers';
import { nameOf } from '../ast';
import type { Node, Rule, VisitContext } from '../types';

function allowsNull(type: Node): boolean {
  if (!type) return true;
  const name = String(nameOf(type) ?? type.name ?? '').toLowerCase();
  if (name === 'mixed' || name === 'null') return true;
  if (type.kind === 'uniontype') return (type.types ?? []).some(allowsNull);
  return false;
}

function check(fn: Node, ctx: VisitContext) {
  for (const p of fn.arguments ?? []) {
    if (!p.type || p.nullable || p.value?.kind !== 'nullkeyword') continue;
    if (allowsNull(p.type)) continue;
    ctx.report(p, `$${nameOf(p.name)}`);
  }
}

const rule: Rule = {
  id: 'implicitly-nullable',
  title: 'Typed parameter with a null default needs a "?"',
  phpVersion: '8.4',
  severity: 'deprecated',
  detection: 'ast',
  explanation:
    'A parameter written as "Customer $c = null" quietly means "a Customer or nothing". PHP 8.4 wants that said out loud and logs a deprecation warning otherwise. Add a question mark before the type.',
  before: `function send(Mailer $mailer = null) { ... }`,
  after: `function send(?Mailer $mailer = null) { ... }`,
  docUrl: DOC.m84deprecated,
  visit: { function: check, method: check, closure: check, arrowfunc: check },
};
export default rule;
