import { describe, expect, it } from 'vitest';
import { analyze } from '../src/engine/analyze';
import { sharePayload } from '../src/engine/report/report';

describe('sharePayload', () => {
  const secret = '<?php\n$apiKey = "sk_live_SECRET";\n$a = each($items);';
  const r = analyze([{ path: 'app/pay.php', code: secret }], '8.3');

  it('sends no source code unless asked', () => {
    const p = sharePayload(r, null, false);
    expect(p.report).not.toContain('each($items)');
    expect(p.report).not.toContain('SECRET');
    expect(JSON.parse(p.report).findings[0]).toEqual({ ruleId: 'removed-each', severity: 'fatal', file: 'app/pay.php', line: 3 });
    expect(p).toMatchObject({ target: '8.3', fatal: 1, effort: 'Small', includes_code: false });
  });

  it('includes only the flagged lines when the visitor ticks the box', () => {
    const p = sharePayload(r, null, true);
    expect(p.report).toContain('each($items)');
    expect(p.report).not.toContain('SECRET');
  });
});
