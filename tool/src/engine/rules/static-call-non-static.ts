import { DOC } from './_helpers';
import { nameOf } from '../ast';
import type { Project, Rule } from '../types';

function isSameOrAncestor(project: Project, ancestor: string, cls: string | null): boolean {
  let cur = cls;
  for (let i = 0; cur && i < 20; i++) {
    if (cur === ancestor) return true;
    cur = project.classes.get(cur)?.parent ?? null;
  }
  return false;
}

const rule: Rule = {
  id: 'static-call-non-static',
  title: 'Calling a normal method as if it were static',
  phpVersion: '8.0',
  severity: 'fatal',
  detection: 'heuristic',
  detectionNote:
    'Only checks classes defined in the scanned files. Calls to classes from vendor/ or the framework are not checked. Calls made from inside the same class or a child class are allowed and skipped.',
  explanation:
    'A method written without the word "static" belongs to an object, but older PHP let you call it as ClassName::method() anyway, with only a warning. PHP 8 throws an error instead and the page stops. Either mark the method static (if it doesn\'t use $this) or create an object and call it on that.',
  before: `class Auth {\n    function check() { return isset($_SESSION['user']); }\n}\nif (!Auth::check()) { ... }`,
  after: `class Auth {\n    public static function check(): bool { return isset($_SESSION['user']); }\n}\nif (!Auth::check()) { ... }`,
  docUrl: DOC.m80incompat,
  visit: {
    call(n, ctx) {
      const what = n.what;
      if (what?.kind !== 'staticlookup' || what.what?.kind !== 'name' || what.offset?.kind !== 'identifier') return;
      const cls = String(what.what.name).replace(/^\\/, '').toLowerCase();
      if (['self', 'static', 'parent'].includes(cls)) return;
      const info = ctx.project.classes.get(cls.split('\\').pop()!);
      const method = info?.methods.get(String(what.offset.name).toLowerCase());
      if (!info || !method || method.isStatic) return;
      // Inside an instance method of the same class (or a child), Foo::bar() is a normal call.
      const fn = ctx.scope.fn;
      const here = ctx.scope.cls ? String(nameOf(ctx.scope.cls.name) ?? '').toLowerCase() : null;
      if (fn?.kind === 'method' && !fn.isStatic && isSameOrAncestor(ctx.project, info.lname, here)) return;
      if ((fn?.kind === 'closure' || fn?.kind === 'arrowfunc') && isSameOrAncestor(ctx.project, info.lname, here)) return;
      ctx.report(n, `${info.name}::${what.offset.name}()`);
    },
  },
};
export default rule;
