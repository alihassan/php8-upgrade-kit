import { DOC } from './_helpers';
import { callName } from '../ast';
import type { Rule } from '../types';

const rule: Rule = {
  id: 'removed-mysql',
  title: 'The old mysql_* extension was removed',
  phpVersion: '7.0',
  severity: 'fatal',
  detection: 'ast',
  explanation:
    'Functions starting with mysql_ (without the "i") talk to the database through an extension that PHP 7.0 removed. Every page that uses them fails. Moving to PDO or mysqli is the fix, and it is the right time to switch to prepared statements, which also closes SQL injection holes.',
  before: `$res = mysql_query("SELECT * FROM users WHERE id = $id");\n$row = mysql_fetch_assoc($res);`,
  after: `$stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');\n$stmt->execute([$id]);\n$row = $stmt->fetch(PDO::FETCH_ASSOC);`,
  docUrl: DOC.m70removed,
  visit: {
    call(n, ctx) {
      const name = callName(n);
      if (name && name.startsWith('mysql_') && !ctx.project.functions.has(name)) ctx.report(n, `${name}()`);
    },
  },
};
export default rule;
