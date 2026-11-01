export type PhpVersion = '7.0' | '7.4' | '8.0' | '8.1' | '8.2' | '8.3' | '8.4';
export type Target = '8.0' | '8.1' | '8.2' | '8.3' | '8.4';
export type Severity = 'fatal' | 'deprecated' | 'behavior-change';

export const TARGETS: Target[] = ['8.0', '8.1', '8.2', '8.3', '8.4'];
export const SEVERITIES: Severity[] = ['fatal', 'deprecated', 'behavior-change'];

/**
 * How a rule finds things. Most rules walk the AST. Some also read the raw
 * source at a node's offset, because the parser gives `$s{0}` and `$s[0]`
 * the same node. A few depend on parse errors or patterns the AST can't hold.
 */
export type Detection = 'ast' | 'ast+source' | 'parse-error' | 'heuristic';

// php-parser nodes are loosely typed; rules read the fields they need.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Node = any;

export interface SourceFile {
  path: string;
  code: string;
}

export interface ClassInfo {
  name: string;
  lname: string;
  file: string;
  parent: string | null;
  interfaces: string[];
  props: Set<string>;
  methods: Map<string, { isStatic: boolean }>;
  allowDynamic: boolean;
  hasMagicSet: boolean;
  usesTraits: boolean;
}

export interface Project {
  classes: Map<string, ClassInfo>;
  functions: Set<string>;
}

export interface Scope {
  /** Innermost class declaration, if any. */
  cls: Node | null;
  /** Innermost function, method, closure or arrow function. */
  fn: Node | null;
  namespace: string | null;
}

export interface VisitContext {
  file: SourceFile;
  project: Project;
  /** The file's program node. */
  root: Node;
  parent: Node | null;
  scope: Scope;
  report(node: Node, note?: string): void;
}

export interface FileContext {
  file: SourceFile;
  project: Project;
  parseErrors: { line: number; message: string }[];
  reportLine(line: number, note?: string): void;
}

export interface Rule {
  id: string;
  title: string;
  /** First version where this breaks (fatal) or warns (deprecated). */
  phpVersion: PhpVersion;
  severity: Severity;
  /** Plain English, for someone who doesn't write PHP. */
  explanation: string;
  before: string;
  after: string;
  docUrl: string;
  detection: Detection;
  /** Required for heuristic and parse-error rules: what the rule can miss or get wrong. */
  detectionNote?: string;
  /** Node kinds this rule wants to see. */
  visit?: Record<string, (node: Node, ctx: VisitContext) => void>;
  checkFile?: (ctx: FileContext) => void;
}

export interface Finding {
  ruleId: string;
  title: string;
  severity: Severity;
  phpVersion: PhpVersion;
  file: string;
  line: number;
  code: string;
  note?: string;
  explanation: string;
  before: string;
  after: string;
  docUrl: string;
  heuristic: boolean;
}

export interface ParseProblem {
  file: string;
  line: number;
  message: string;
}

export interface AnalysisResult {
  target: Target;
  files: number;
  findings: Finding[];
  parseProblems: ParseProblem[];
  counts: Record<Severity, number>;
}
