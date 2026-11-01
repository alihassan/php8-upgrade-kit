import { DOC } from './_helpers';
import { nameOf } from '../ast';
import type { Rule } from '../types';

const rule: Rule = {
  id: 'serializable-interface',
  title: 'Serializable without __serialize() and __unserialize()',
  phpVersion: '8.1',
  severity: 'deprecated',
  detection: 'ast',
  explanation:
    'The Serializable interface controls how an object is saved (for example into a session or cache). PHP 8.1 replaced it with two simpler methods, __serialize() and __unserialize(). A class that only has the old interface logs a deprecation warning. Add the two new methods; keep the old ones only if you still support PHP 7.3 or older.',
  before: `class Cart implements Serializable {\n    public function serialize() { return json_encode($this->items); }\n    public function unserialize($data) { $this->items = json_decode($data, true); }\n}`,
  after: `class Cart {\n    public function __serialize(): array { return ['items' => $this->items]; }\n    public function __unserialize(array $data): void { $this->items = $data['items']; }\n}`,
  docUrl: DOC.m81deprecated,
  visit: {
    class(n, ctx) {
      const implementsIt = (n.implements ?? []).some((i: unknown) => String(nameOf(i)).replace(/^\\/, '').toLowerCase() === 'serializable');
      if (!implementsIt) return;
      const methods = new Set((n.body ?? []).filter((m: { kind: string }) => m.kind === 'method').map((m: { name: unknown }) => String(nameOf(m.name)).toLowerCase()));
      if (!methods.has('__serialize') || !methods.has('__unserialize')) ctx.report(n, String(nameOf(n.name)));
    },
  },
};
export default rule;
