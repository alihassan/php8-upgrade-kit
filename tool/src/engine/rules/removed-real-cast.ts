import { DOC } from './_helpers';
import type { Rule } from '../types';

const rule: Rule = {
  id: 'removed-real-cast',
  title: 'The (real) cast was removed',
  phpVersion: '8.0',
  severity: 'fatal',
  detection: 'ast',
  explanation:
    '(real) converted a value to a decimal number. It was just another spelling of (float), and PHP 8 removed it. A file that contains it will not run at all.',
  before: `$price = (real) $_POST['price'];`,
  after: `$price = (float) $_POST['price'];`,
  docUrl: DOC.m80incompat,
  visit: {
    cast(n, ctx) {
      if (/^\(\s*real\s*\)$/i.test(String(n.raw ?? ''))) ctx.report(n);
    },
  },
};
export default rule;
