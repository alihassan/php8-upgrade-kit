import { DOC } from './_helpers';
import { nameOf } from '../ast';
import type { Rule } from '../types';

const rule: Rule = {
  id: 'php4-constructor',
  title: 'A method named after its class is no longer a constructor',
  phpVersion: '8.0',
  severity: 'behavior-change',
  detection: 'ast',
  explanation:
    'Very old PHP code set up new objects in a method with the same name as the class. PHP 8 no longer runs that method automatically. There is no error: the object is just left half set up, and things break later in confusing ways. Rename the method to __construct.',
  before: `class Invoice {\n    function Invoice($order) {\n        $this->order = $order;\n    }\n}`,
  after: `class Invoice {\n    public function __construct($order) {\n        $this->order = $order;\n    }\n}`,
  docUrl: DOC.m80incompat,
  visit: {
    class(n, ctx) {
      // Inside a namespace, same-name methods stopped being constructors in PHP 5.3.3.
      if (ctx.scope.namespace) return;
      const cls = String(nameOf(n.name) ?? '').toLowerCase();
      if (!cls) return;
      const methods = (n.body ?? []).filter((m: { kind: string }) => m.kind === 'method');
      if (methods.some((m: { name: unknown }) => String(nameOf(m.name)).toLowerCase() === '__construct')) return;
      const legacy = methods.find((m: { name: unknown }) => String(nameOf(m.name)).toLowerCase() === cls);
      if (legacy) ctx.report(legacy, `${nameOf(n.name)}::${nameOf(legacy.name)}()`);
    },
  },
};
export default rule;
