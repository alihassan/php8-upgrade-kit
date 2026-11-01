import { DOC } from './_helpers';
import type { Rule } from '../types';

const rule: Rule = {
  id: 'reserved-match',
  title: '"match" is a reserved word',
  phpVersion: '8.0',
  severity: 'fatal',
  detection: 'parse-error',
  detectionNote:
    'The parser always treats "match" as a keyword, so a function, class or constant called match shows up as a parse error mentioning T_MATCH. The rule reports those lines. Methods named match() are still allowed and are not flagged.',
  explanation:
    'PHP 8 added a new "match" expression, so match became a reserved word. A function, class or constant called match no longer works, and the file will not load. Rename it.',
  before: `function match($pattern, $text) { ... }\n$ok = match('/^a/', $name);`,
  after: `function matches($pattern, $text) { ... }\n$ok = matches('/^a/', $name);`,
  docUrl: DOC.m80incompat,
  checkFile(ctx) {
    for (const e of ctx.parseErrors) if (/T_MATCH|'match'/.test(e.message)) ctx.reportLine(e.line);
  },
};
export default rule;
