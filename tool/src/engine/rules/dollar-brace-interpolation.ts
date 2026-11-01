import { DOC } from './_helpers';
import type { Rule } from '../types';

const rule: Rule = {
  id: 'dollar-brace-interpolation',
  title: '"${var}" inside strings is deprecated',
  phpVersion: '8.2',
  severity: 'deprecated',
  detection: 'ast+source',
  detectionNote: 'The parser marks both "${x}" and "{$x}" as curly, so the rule reads the two characters at the start of each part.',
  explanation:
    'PHP has several ways to put a variable inside quoted text. The "${name}" form is deprecated since PHP 8.2 and logs a warning. Write "{$name}" (dollar sign inside the braces) or just "$name".',
  before: `echo "Invoice \${number} for \${customer['name']}";`,
  after: `echo "Invoice {$number} for {$customer['name']}";`,
  docUrl: DOC.m82deprecated,
  visit: {
    encapsedpart(n, ctx) {
      const start = n.loc?.start?.offset;
      if (typeof start === 'number' && ctx.file.code.slice(start, start + 2) === '${') ctx.report(n);
    },
  },
};
export default rule;
