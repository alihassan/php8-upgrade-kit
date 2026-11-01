import { parse, walk, nameOf, hasAttribute, lineOf, type Parsed } from './ast';
import { rules as allRules } from './rules';
import { versionAtMost } from './versions';
import type { AnalysisResult, ClassInfo, Finding, Node, Project, Rule, Scope, SourceFile, Target } from './types';

const FN_KINDS = new Set(['function', 'method', 'closure', 'arrowfunc']);
const CLASS_KINDS = new Set(['class', 'trait', 'interface', 'enum']);

function lname(n: Node): string {
  return String(nameOf(n) ?? '').replace(/^\\/, '').toLowerCase();
}

/**
 * Does this method hand back a fresh instance of its own class? True for
 * `return new self/static/ClassName`, a `: self`/`: static` return type, or
 * `$x = new ...; return $x;`.
 */
function returnsNewSelf(method: Node, cls: string): boolean {
  const isSelf = (n: Node) => {
    const name = lname(n);
    return name === 'self' || name === 'static' || name === cls;
  };
  if (method.type && isSelf(method.type)) return true;
  const created = new Set<string>();
  let found = false;
  walk(method.body, (n) => {
    if (['closure', 'arrowfunc', 'function', 'class'].includes(n.kind)) return false;
    if (n.kind === 'assign' && n.left?.kind === 'variable' && n.right?.kind === 'new' && isSelf(n.right.what)) created.add(n.left.name);
    if (n.kind === 'return' && n.expr) {
      if (n.expr.kind === 'new' && isSelf(n.expr.what)) found = true;
      if (n.expr.kind === 'variable' && created.has(n.expr.name)) found = true;
    }
  });
  return found;
}

/** Pass 1: every class and function declared anywhere in the scanned files. */
export function indexProject(parsed: { file: SourceFile; p: Parsed }[]): Project {
  const project: Project = { classes: new Map(), functions: new Set() };
  for (const { file, p } of parsed) {
    walk(p.ast, (n) => {
      if (n.kind === 'function' && nameOf(n.name)) project.functions.add(lname(n.name));
      if (n.kind !== 'class' || !nameOf(n.name)) return;
      const info: ClassInfo = {
        name: nameOf(n.name)!,
        lname: lname(n.name),
        file: file.path,
        parent: n.extends ? lname(n.extends) : null,
        interfaces: (n.implements ?? []).map(lname),
        props: new Set(),
        methods: new Map(),
        allowDynamic: hasAttribute(n, 'AllowDynamicProperties'),
        hasMagicSet: false,
        usesTraits: false,
      };
      for (const m of n.body ?? []) {
        if (m.kind === 'traituse') info.usesTraits = true;
        else if (m.kind === 'propertystatement') {
          for (const pr of m.properties ?? []) if (nameOf(pr.name)) info.props.add(nameOf(pr.name)!);
        } else if (m.kind === 'method') {
          const mname = lname(m.name);
          info.methods.set(mname, { isStatic: !!m.isStatic, returnsSelf: !!m.isStatic && returnsNewSelf(m, info.lname) });
          if (mname === '__set') info.hasMagicSet = true;
          if (mname === '__construct') {
            // Promoted constructor parameters are declared properties.
            for (const a of m.arguments ?? []) if (a.flags) info.props.add(nameOf(a.name)!);
          }
        }
      }
      project.classes.set(info.lname, info);
    });
  }
  return project;
}

export function applicableRules(target: Target, rules: Rule[] = allRules): Rule[] {
  return rules.filter((r) => versionAtMost(r.phpVersion, target));
}

/** Pass 2: run each rule over each file. */
export function analyze(files: SourceFile[], target: Target, rules: Rule[] = allRules): AnalysisResult {
  const parsed = files.map((file) => ({ file, p: parse(file.code, file.path) }));
  const project = indexProject(parsed);
  const active = applicableRules(target, rules);
  const findings: Finding[] = [];
  const parseProblems: AnalysisResult['parseProblems'] = [];

  for (const { file, p } of parsed) {
    const lines = file.code.split(/\r?\n/);
    const seen = new Set<string>();
    const add = (rule: Rule, line: number, note?: string) => {
      const key = `${rule.id}:${line}:${note ?? ''}`;
      if (seen.has(key)) return;
      seen.add(key);
      findings.push({
        ruleId: rule.id,
        title: rule.title,
        severity: rule.severity,
        phpVersion: rule.phpVersion,
        file: file.path,
        line,
        code: (lines[line - 1] ?? '').trim(),
        note,
        explanation: rule.explanation,
        before: rule.before,
        after: rule.after,
        docUrl: rule.docUrl,
        heuristic: rule.detection === 'heuristic' || rule.detection === 'parse-error',
      });
    };

    const claimed = new Set<number>();
    for (const rule of active) {
      rule.checkFile?.({
        file,
        project,
        parseErrors: p.errors,
        reportLine: (line, note) => {
          claimed.add(line);
          add(rule, line, note);
        },
      });
    }
    for (const e of p.errors) {
      if (!claimed.has(e.line)) parseProblems.push({ file: file.path, line: e.line, message: e.message });
    }

    const visitors = new Map<string, { rule: Rule; fn: (n: Node, c: never) => void }[]>();
    for (const rule of active) {
      for (const [kind, fn] of Object.entries(rule.visit ?? {})) {
        if (!visitors.has(kind)) visitors.set(kind, []);
        visitors.get(kind)!.push({ rule, fn: fn as never });
      }
    }

    const scopes: Scope[] = [{ cls: null, fn: null, namespace: null }];
    walk(
      p.ast,
      (n, parent) => {
        const top = scopes[scopes.length - 1];
        if (n.kind === 'namespace') scopes.push({ ...top, namespace: n.name ?? '' });
        else if (CLASS_KINDS.has(n.kind)) scopes.push({ ...top, cls: n });
        else if (FN_KINDS.has(n.kind)) scopes.push({ ...top, fn: n });
        const scope = scopes[scopes.length - 1];
        for (const { rule, fn } of visitors.get(n.kind) ?? []) {
          fn(n, {
            file,
            project,
            root: p.ast,
            parent,
            scope,
            report: (node: Node, note?: string) => add(rule, lineOf(node), note),
          } as never);
        }
      },
      (n) => {
        if (n.kind === 'namespace' || CLASS_KINDS.has(n.kind) || FN_KINDS.has(n.kind)) scopes.pop();
      },
    );
  }

  findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.ruleId.localeCompare(b.ruleId));
  const counts = { fatal: 0, deprecated: 0, 'behavior-change': 0 };
  for (const f of findings) counts[f.severity]++;
  return { target, files: files.length, findings, parseProblems, counts };
}
