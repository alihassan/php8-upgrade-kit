import { SEVERITIES, type AnalysisResult, type Finding, type Severity } from '../types';
import type { ComposerReport } from '../composer/check';

export const SEVERITY_LABEL: Record<Severity, string> = {
  fatal: 'Fatal',
  deprecated: 'Deprecated',
  'behavior-change': 'Behavior change',
};

/**
 * A deliberately rough size guide. Points = 3 per fatal, 2 per behavior
 * change, 1 per deprecation. It counts findings, not how hard each fix is.
 */
export const EFFORT = {
  weights: { fatal: 3, 'behavior-change': 2, deprecated: 1 } as Record<Severity, number>,
  smallMax: 25,
  mediumMax: 120,
  formula: 'Points = 3 × fatal + 2 × behavior change + 1 × deprecated. Small: up to 25 points. Medium: 26 to 120. Large: over 120. It counts findings, not how hard each fix is, so treat it as a first guess.',
};

export type EffortBand = 'Small' | 'Medium' | 'Large' | 'None';

export function effort(counts: Record<Severity, number>): { band: EffortBand; points: number } {
  const points = SEVERITIES.reduce((s, k) => s + counts[k] * EFFORT.weights[k], 0);
  const band: EffortBand = points === 0 ? 'None' : points <= EFFORT.smallMax ? 'Small' : points <= EFFORT.mediumMax ? 'Medium' : 'Large';
  return { band, points };
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function summaryLine(r: AnalysisResult): string {
  return `${r.counts.fatal} fatal, ${r.counts.deprecated} deprecated, ${plural(r.counts['behavior-change'], 'behavior change')} for PHP ${r.target}`;
}

export function groupFindings(findings: Finding[]): { severity: Severity; files: { file: string; findings: Finding[] }[] }[] {
  return SEVERITIES.map((severity) => {
    const byFile = new Map<string, Finding[]>();
    for (const f of findings.filter((x) => x.severity === severity)) {
      if (!byFile.has(f.file)) byFile.set(f.file, []);
      byFile.get(f.file)!.push(f);
    }
    const files = [...byFile.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([file, list]) => ({ file, findings: list.sort((a, b) => a.line - b.line) }));
    return { severity, files };
  }).filter((g) => g.files.length);
}

/** Five plain-text lines someone can paste into a job post. */
export function copySummary(r: AnalysisResult, composer?: ComposerReport | null): string {
  const e = effort(r.counts);
  const rules = new Map<string, number>();
  for (const f of r.findings.filter((x) => x.severity === 'fatal')) rules.set(f.title, (rules.get(f.title) ?? 0) + 1);
  const top = [...rules.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t, n]) => `${t} (${n})`);
  const blocked = composer?.packages.filter((p) => p.supports === 'no').length ?? 0;
  return [
    `PHP ${r.target} upgrade check: ${summaryLine(r).replace(/ for PHP .*/, '')} across ${plural(r.files, 'file')}.`,
    `Main blockers: ${top.length ? top.join('; ') : 'no fatal issues found'}.`,
    composer ? `Composer: ${plural(blocked, 'package')} locked to versions that don't support PHP ${r.target}${composer.rootAllowsTarget === false ? `; composer.json allows php ${composer.rootPhp} only` : ''}.` : 'Composer: not checked.',
    `Rough size: ${e.band} (${e.points} points; 3 per fatal, 2 per behavior change, 1 per deprecation).`,
    'Found by an automatic scan (php8-check). It can miss problems that only show up when the code runs.',
  ].join('\n');
}

function mdEscape(s: string): string {
  return s.replace(/\|/g, '\\|');
}

export function toMarkdown(r: AnalysisResult, composer?: ComposerReport | null, title = 'PHP upgrade report'): string {
  const e = effort(r.counts);
  const out: string[] = [];
  out.push(`# ${title}`, '');
  out.push(`**${summaryLine(r)}** across ${plural(r.files, 'file')}.`, '');
  out.push(`Rough effort: **${e.band}** (${e.points} points). ${EFFORT.formula}`, '');
  out.push('Findings marked *(heuristic)* come from a best guess and can be wrong. Check them by hand.', '');

  if (composer) {
    out.push(`## Composer packages`, '');
    if (composer.rootPhp) out.push(`composer.json requires \`php: ${composer.rootPhp}\`, which ${composer.rootAllowsTarget ? 'allows' : 'does **not** allow'} PHP ${r.target}.`, '');
    if (composer.packages.length) {
      out.push(`| Package | Current | PHP constraint | Supports ${r.target}? | Lowest version that does | Abandoned |`, '|---|---|---|---|---|---|');
      for (const p of composer.packages) {
        out.push(`| ${p.name}${p.dev ? ' (dev)' : ''} | ${mdEscape(p.current)} | ${p.phpConstraint ? `\`${mdEscape(p.phpConstraint)}\`` : 'none'} | ${supportLabel(p.supports)} | ${p.lowestSupporting ?? 'none found'} | ${p.abandoned ? (typeof p.abandoned === 'string' ? `yes, use ${p.abandoned}` : 'yes') : 'no'} |`);
      }
      out.push('');
    }
  }

  for (const g of groupFindings(r.findings)) {
    out.push(`## ${SEVERITY_LABEL[g.severity]} (${g.files.reduce((s, f) => s + f.findings.length, 0)})`, '');
    for (const { file, findings } of g.files) {
      out.push(`### ${file}`, '');
      for (const f of findings) {
        out.push(`- **Line ${f.line}: ${f.title}**${f.heuristic ? ' *(heuristic)*' : ''}${f.note ? `. ${f.note}` : ''}`);
        out.push(`  \`${f.code.replace(/`/g, "'").slice(0, 160)}\``);
        out.push(`  [PHP docs](${f.docUrl}) · rule \`${f.ruleId}\``);
      }
      out.push('');
    }
  }

  if (r.parseProblems.length) {
    out.push('## Could not fully read', '');
    for (const p of r.parseProblems) out.push(`- ${p.file}:${p.line}: ${p.message}`);
    out.push('');
  }

  const seen = new Map<string, Finding>();
  for (const f of r.findings) if (!seen.has(f.ruleId)) seen.set(f.ruleId, f);
  if (seen.size) {
    out.push('## How to fix each one', '');
    for (const f of seen.values()) {
      out.push(`### ${f.title}`, '', f.explanation, '', 'Before:', '', '```php', f.before, '```', '', 'After:', '', '```php', f.after, '```', '', `Docs: ${f.docUrl}`, '');
    }
  }
  return out.join('\n');
}

export function supportLabel(s: string): string {
  return s === 'yes' ? 'yes' : s === 'no' ? '**no**' : s === 'no-limit' ? 'no PHP limit declared' : 'unknown';
}

/**
 * What "Send this report" posts. Without includeCode it carries rule ids,
 * file paths, line numbers and counts only: no source code at all.
 */
export function sharePayload(r: AnalysisResult, composer: ComposerReport | null | undefined, includeCode: boolean) {
  const e = effort(r.counts);
  const report = {
    tool: 'php8-check',
    target: r.target,
    counts: r.counts,
    files: r.files,
    findings: r.findings.map((f) => ({ ruleId: f.ruleId, severity: f.severity, file: f.file, line: f.line, ...(includeCode ? { code: f.code, note: f.note } : {}) })),
    parseProblems: r.parseProblems.map((p) => ({ file: p.file, line: p.line })),
    composer: composer
      ? { rootPhp: composer.rootPhp, packages: composer.packages.map((p) => ({ name: p.name, current: p.current, supports: p.supports, lowestSupporting: p.lowestSupporting })) }
      : null,
  };
  return {
    target: r.target,
    fatal: r.counts.fatal,
    deprecated: r.counts.deprecated,
    behavior_change: r.counts['behavior-change'],
    files: r.files,
    effort: e.band,
    includes_code: includeCode,
    report: JSON.stringify(report),
  };
}

export function toJson(r: AnalysisResult, composer?: ComposerReport | null): string {
  return JSON.stringify({ tool: 'php8-check', target: r.target, summary: summaryLine(r), effort: effort(r.counts), counts: r.counts, files: r.files, findings: r.findings, parseProblems: r.parseProblems, composer: composer ?? null }, null, 2);
}
