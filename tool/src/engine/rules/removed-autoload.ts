import { DOC } from './_helpers';
import { nameOf } from '../ast';
import type { Rule } from '../types';

const rule: Rule = {
  id: 'removed-autoload',
  title: '__autoload() no longer loads classes',
  phpVersion: '8.0',
  severity: 'fatal',
  detection: 'ast',
  explanation:
    'Old apps defined a function called __autoload() to load class files on demand. PHP 8 ignores it, so classes stop loading and pages fail with "class not found". Register the same function with spl_autoload_register(), or use Composer\'s autoloader.',
  before: `function __autoload($class) {\n    require __DIR__ . "/classes/$class.php";\n}`,
  after: `spl_autoload_register(function ($class) {\n    require __DIR__ . "/classes/$class.php";\n});`,
  docUrl: DOC.m80incompat,
  visit: {
    function(n, ctx) {
      if (String(nameOf(n.name) ?? '').toLowerCase() === '__autoload') ctx.report(n);
    },
  },
};
export default rule;
