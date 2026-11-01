import { DOC, isNumericString, isSuperglobalLookup } from './_helpers';
import type { Node, Rule } from '../types';

const LOOSE = new Set(['==', '!=', '<>']);

function isNumber(n: Node): boolean {
  return n?.kind === 'number';
}

const rule: Rule = {
  id: 'string-number-comparison',
  title: 'Comparing numbers with text works differently',
  phpVersion: '8.0',
  severity: 'behavior-change',
  detection: 'heuristic',
  detectionNote:
    'Flags a loose comparison (== or !=) between a number and either a text value that is not a number, or form/URL input such as $_GET. It cannot follow variables, so it will miss cases where both sides are variables.',
  explanation:
    'Before PHP 8, comparing 0 with a word using == said they were equal: 0 == "abc" was true. PHP 8 compares them as text instead, so the same check is now false. Nothing crashes, but logins, filters and status checks can quietly take a different branch. Use === and compare like with like.',
  before: `if ($_GET['page'] == 0) { show_home(); } // "home" used to equal 0`,
  after: `if ((int) ($_GET['page'] ?? 0) === 0) { show_home(); }`,
  docUrl: DOC.m80incompat,
  visit: {
    bin(n, ctx) {
      if (!LOOSE.has(n.type)) return;
      const pairs = [
        [n.left, n.right],
        [n.right, n.left],
      ];
      for (const [num, other] of pairs) {
        if (!isNumber(num)) continue;
        if (other?.kind === 'string' && !isNumericString(String(other.value))) {
          return ctx.report(n, `${num.value} ${n.type} "${other.value}"`);
        }
        if (isSuperglobalLookup(other)) return ctx.report(n, 'request input compared with a number');
      }
    },
  },
};
export default rule;
