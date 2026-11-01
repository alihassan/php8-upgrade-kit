import { DOC } from './_helpers';
import { hasAttribute, nameOf } from '../ast';
import type { Rule } from '../types';

/** Built-in interfaces whose methods gained tentative return types in 8.1, with the type each method should declare. */
const INTERFACES: Record<string, Record<string, string>> = {
  iterator: { current: 'mixed', key: 'mixed', next: 'void', rewind: 'void', valid: 'bool' },
  iteratoraggregate: { getiterator: '\\Traversable' },
  arrayaccess: { offsetexists: 'bool', offsetget: 'mixed', offsetset: 'void', offsetunset: 'void' },
  countable: { count: 'int' },
  jsonserializable: { jsonserialize: 'mixed' },
};

const rule: Rule = {
  id: 'tentative-return-types',
  title: 'Methods of built-in interfaces need return types',
  phpVersion: '8.1',
  severity: 'deprecated',
  detection: 'ast',
  detectionNote: 'Checks classes that implement the interface directly. A class that inherits the interface from a parent is not checked.',
  explanation:
    'When a class plugs into PHP\'s own interfaces (for loops, array access, count() or JSON), PHP 8.1 expects each method to say what type it returns. Without it, every request logs a deprecation warning. Add the return type, or, if the code must still run on PHP 7, add #[\\ReturnTypeWillChange] above the method.',
  before: `class OrderList implements Iterator {\n    public function current() { return $this->items[$this->i]; }\n    public function next() { $this->i++; }\n    // ...\n}`,
  after: `class OrderList implements Iterator {\n    public function current(): mixed { return $this->items[$this->i]; }\n    public function next(): void { $this->i++; }\n    // ...\n}\n// Must still run on PHP 7? Use the attribute instead:\n// #[\\ReturnTypeWillChange]\n// public function current() { ... }`,
  docUrl: 'https://wiki.php.net/rfc/internal_method_return_types',
  visit: {
    class(n, ctx) {
      const wanted: Record<string, string> = {};
      for (const i of n.implements ?? []) {
        const iface = String(nameOf(i) ?? '').replace(/^\\/, '').toLowerCase();
        Object.assign(wanted, INTERFACES[iface] ?? {});
      }
      for (const m of n.body ?? []) {
        if (m.kind !== 'method') continue;
        const type = wanted[String(nameOf(m.name)).toLowerCase()];
        if (!type || m.type || hasAttribute(m, 'ReturnTypeWillChange')) continue;
        ctx.report(m, `${nameOf(n.name)}::${nameOf(m.name)}() should return ${type}`);
      }
    },
  },
};
export default rule;
