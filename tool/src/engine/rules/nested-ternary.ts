import { DOC } from './_helpers';
import type { Rule } from '../types';

const rule: Rule = {
  id: 'nested-ternary',
  title: 'Nested ternaries need parentheses',
  phpVersion: '8.0',
  severity: 'fatal',
  detection: 'ast',
  explanation:
    'A "ternary" is the short a ? b : c form of an if/else. Chaining two without brackets was confusing, because PHP read it differently from every other language and often gave the wrong answer. PHP 8 refuses to run it. Add brackets to show which part belongs together, and check the result is what you meant.',
  before: `$label = $s == 'paid' ? 'Paid' : $s == 'void' ? 'Void' : 'Open';`,
  after: `$label = $s == 'paid' ? 'Paid' : ($s == 'void' ? 'Void' : 'Open');`,
  docUrl: DOC.m80incompat,
  visit: {
    retif(n, ctx) {
      const inner = n.test;
      if (inner?.kind !== 'retif' || inner.parenthesizedExpression) return;
      // a ?: b ?: c is still allowed: both levels are short ternaries.
      if (!n.trueExpr && !inner.trueExpr) return;
      ctx.report(n);
    },
  },
};
export default rule;
