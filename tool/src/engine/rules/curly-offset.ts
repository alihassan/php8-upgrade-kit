import { DOC } from './_helpers';
import { nextChar } from '../ast';
import type { Rule } from '../types';

const rule: Rule = {
  id: 'curly-offset',
  title: 'Curly braces for string and array offsets were removed',
  phpVersion: '8.0',
  severity: 'fatal',
  detection: 'ast+source',
  detectionNote: 'The parser gives $s{0} and $s[0] the same node, so the rule reads the character after the variable in the source.',
  explanation:
    'Old code sometimes read one character of a string with curly braces, like $name{0}. PHP 8 no longer understands that, and the whole file fails to load. Square brackets do the same thing.',
  before: `$initial = $name{0};`,
  after: `$initial = $name[0];`,
  docUrl: DOC.m80incompat,
  visit: {
    offsetlookup(n, ctx) {
      const end = n.what?.loc?.end?.offset;
      if (typeof end === 'number' && nextChar(ctx.file.code, end) === '{') ctx.report(n);
    },
  },
};
export default rule;
