import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyze } from '../src/engine/analyze';
import { rules } from '../src/engine/rules';

const FIXTURES = path.join(__dirname, 'fixtures');
const read = (id: string, kind: 'match' | 'ok') => fs.readFileSync(path.join(FIXTURES, id, `${kind}.php`), 'utf8');

describe('rule metadata', () => {
  it('has at least 30 rules with unique ids', () => {
    expect(rules.length).toBeGreaterThanOrEqual(30);
    expect(new Set(rules.map((r) => r.id)).size).toBe(rules.length);
  });

  for (const r of rules) {
    it(`${r.id}: metadata is complete`, () => {
      expect(r.title).toBeTruthy();
      expect(r.explanation.length).toBeGreaterThan(40);
      expect(r.before).toBeTruthy();
      expect(r.after).toBeTruthy();
      expect(r.docUrl).toMatch(/^https:\/\/(www\.php\.net\/manual\/en\/migration\d\d\.|wiki\.php\.net\/rfc\/)/);
      if (r.detection === 'heuristic' || r.detection === 'parse-error' || r.detection === 'ast+source') {
        expect(r.detectionNote, 'non-AST rules must say how they detect').toBeTruthy();
      }
      // Writing style: no em dashes in anything a visitor reads.
      expect(`${r.title} ${r.explanation} ${r.detectionNote ?? ''}`).not.toMatch(/—/);
    });
  }
});

describe('rule fixtures', () => {
  for (const r of rules) {
    it(`${r.id}: has a match.php and an ok.php fixture`, () => {
      expect(fs.existsSync(path.join(FIXTURES, r.id, 'match.php'))).toBe(true);
      expect(fs.existsSync(path.join(FIXTURES, r.id, 'ok.php'))).toBe(true);
    });

    it(`${r.id}: fires on match.php`, () => {
      const res = analyze([{ path: 'match.php', code: read(r.id, 'match') }], '8.4', [r]);
      expect(res.findings.filter((f) => f.ruleId === r.id).length).toBeGreaterThan(0);
    });

    it(`${r.id}: stays quiet on ok.php`, () => {
      const res = analyze([{ path: 'ok.php', code: read(r.id, 'ok') }], '8.4', [r]);
      expect(res.findings.filter((f) => f.ruleId === r.id)).toEqual([]);
    });
  }

  it('no fixture folder is orphaned', () => {
    const ids = new Set(rules.map((r) => r.id));
    for (const d of fs.readdirSync(FIXTURES)) expect(ids.has(d), `fixture folder ${d} has no rule`).toBe(true);
  });
});

describe('target filtering', () => {
  it('hides 8.2 deprecations when targeting 8.1', () => {
    const code = '<?php\n$n = utf8_encode($x);\n$a = each($b);';
    const ids81 = analyze([{ path: 'a.php', code }], '8.1').findings.map((f) => f.ruleId);
    const ids82 = analyze([{ path: 'a.php', code }], '8.2').findings.map((f) => f.ruleId);
    expect(ids81).toContain('removed-each');
    expect(ids81).not.toContain('utf8-encode-decode');
    expect(ids82).toContain('utf8-encode-decode');
  });

  it('skips removed functions the project defines itself (polyfills)', () => {
    const code = "<?php\nif (!function_exists('each')) { function each(&$a) { return false; } }\neach($x);";
    expect(analyze([{ path: 'a.php', code }], '8.3').findings.map((f) => f.ruleId)).not.toContain('removed-each');
  });

  it('resolves classes across files', () => {
    const files = [
      { path: 'Auth.php', code: '<?php\nclass Auth { function check() {} }' },
      { path: 'index.php', code: '<?php\nAuth::check();' },
    ];
    const f = analyze(files, '8.0').findings.find((x) => x.ruleId === 'static-call-non-static');
    expect(f?.file).toBe('index.php');
  });
});
