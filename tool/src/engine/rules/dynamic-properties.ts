import { DOC } from './_helpers';
import { nameOf, walk } from '../ast';
import type { ClassInfo, Node, Project, Rule } from '../types';

/**
 * Declared properties of a class and all its parents, or null when the
 * answer is unknowable: a parent outside the scanned files, a trait, a
 * __set() method, or an explicit opt-in to dynamic properties.
 */
function declaredProps(project: Project, cls: ClassInfo): Set<string> | null {
  const props = new Set<string>();
  let cur: ClassInfo | undefined = cls;
  for (let i = 0; cur && i < 20; i++) {
    if (cur.allowDynamic || cur.hasMagicSet || cur.usesTraits) return null;
    cur.props.forEach((p) => props.add(p));
    if (!cur.parent) return props;
    if (cur.parent === 'stdclass') return null;
    cur = project.classes.get(cur.parent);
  }
  return null; // parent not in the scanned files
}

/** In the function around `before`, the class last assigned to `$var` with `new`. */
function classOfVar(fn: Node | null, root: Node, varName: string, before: number): string | null {
  let found: string | null = null;
  const body = fn ?? root;
  walk(body, (n) => {
    if (n !== body && ['function', 'method', 'closure', 'arrowfunc', 'class'].includes(n.kind)) return false;
    if (n.kind !== 'assign' || n.left?.kind !== 'variable' || n.left.name !== varName) return;
    if ((n.loc?.start?.offset ?? Infinity) >= before) return;
    found = n.right?.kind === 'new' && n.right.what?.kind === 'name' ? String(n.right.what.name).replace(/^\\/, '').toLowerCase() : null;
  });
  return found;
}

const rule: Rule = {
  id: 'dynamic-properties',
  title: 'Creating properties that the class never declared',
  phpVersion: '8.2',
  severity: 'deprecated',
  detection: 'heuristic',
  detectionNote:
    'A heuristic. It checks $this->name = ... inside a class, and $obj->name = ... where $obj = new SomeClass in the same function. It only knows classes in the scanned files, and it skips classes that use traits, define __set(), or extend a class it cannot see. Names built at runtime ($obj->$key) are not checked.',
  explanation:
    'Older PHP let code attach any new field to an object on the fly, even one the class never listed. PHP 8.2 logs a deprecation warning each time, and PHP 9 is expected to make it an error. List the field in the class (best), or add #[\\AllowDynamicProperties] above the class to keep the old behaviour.',
  before: `class Order {\n    public $id;\n}\n$order = new Order();\n$order->total = 99.50; // "total" was never declared`,
  after: `class Order {\n    public $id;\n    public $total;\n}\n// or, to keep the old behaviour for now:\n#[\\AllowDynamicProperties]\nclass Order { ... }`,
  docUrl: DOC.m82deprecated,
  visit: {
    assign(n, ctx) {
      const left = n.left;
      if (left?.kind !== 'propertylookup' || left.offset?.kind !== 'identifier' || left.what?.kind !== 'variable') return;
      const prop = String(left.offset.name);
      let clsName: string | null;
      if (left.what.name === 'this') {
        clsName = ctx.scope.cls ? String(nameOf(ctx.scope.cls.name) ?? '').toLowerCase() : null;
      } else {
        clsName = classOfVar(ctx.scope.fn, ctx.root, String(left.what.name), n.loc?.start?.offset ?? 0);
      }
      const info = clsName ? ctx.project.classes.get(clsName.split('\\').pop()!) : undefined;
      if (!info) return;
      const props = declaredProps(ctx.project, info);
      if (props && !props.has(prop)) ctx.report(n, `${info.name}::$${prop} is not declared`);
    },
  },
};
export default rule;
