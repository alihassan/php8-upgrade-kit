import { DOC } from './_helpers';
import type { Rule } from '../types';

const rule: Rule = {
  id: 'removed-unset-cast',
  title: 'The (unset) cast was removed',
  phpVersion: '8.0',
  severity: 'fatal',
  detection: 'ast',
  explanation:
    '(unset) turned any value into null. PHP 8 removed it, and a file that contains it will not run. Assign null directly, or call unset() if you want the variable gone.',
  before: `$token = (unset) $token;`,
  after: `$token = null;`,
  docUrl: DOC.m80incompat,
  visit: {
    cast(n, ctx) {
      if (n.type === 'unset' || /^\(\s*unset\s*\)$/i.test(String(n.raw ?? ''))) ctx.report(n);
    },
  },
};
export default rule;
