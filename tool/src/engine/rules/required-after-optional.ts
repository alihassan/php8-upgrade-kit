import { DOC } from './_helpers';
import { nameOf } from '../ast';
import type { Node, Rule, VisitContext } from '../types';

function check(fn: Node, ctx: VisitContext) {
  const params: Node[] = fn.arguments ?? [];
  let lastRequired = -1;
  params.forEach((p, i) => {
    if (!p.value && !p.variadic) lastRequired = i;
  });
  for (let i = 0; i < lastRequired; i++) {
    const p = params[i];
    if (!p.value) continue;
    // "Type $x = null" before a required parameter was still allowed in 8.0 (it means "nullable").
    if (p.type && p.value.kind === 'nullkeyword') continue;
    ctx.report(p, `$${nameOf(p.name)} has a default but a required parameter follows it`);
  }
}

const rule: Rule = {
  id: 'required-after-optional',
  title: 'Optional parameter before a required one',
  phpVersion: '8.0',
  severity: 'deprecated',
  detection: 'ast',
  explanation:
    'A function that gives a parameter a default value and then lists a required one after it never really used that default, because callers always had to pass it. PHP 8 warns about this. Remove the default, or move the parameter to the end of the list.',
  before: `function price($amount, $currency = 'USD', $decimals) { ... }`,
  after: `function price($amount, $currency, $decimals) { ... }\n// or\nfunction price($amount, $decimals, $currency = 'USD') { ... }`,
  docUrl: DOC.m80deprecated,
  visit: { function: check, method: check, closure: check, arrowfunc: check },
};
export default rule;
