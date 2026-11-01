import { describe, expect, it } from 'vitest';
import { allowsMinor, allowsVersion } from '../src/engine/composer/constraint';
import { checkComposer } from '../src/engine/composer/check';

describe('constraint reader', () => {
  const cases: [string, string, boolean][] = [
    ['^7.2', '8.0', false],
    ['^7.2', '7.4', true],
    ['^5.6 || ^7.0', '8.3', false],
    ['^7.4 || ~8.0.0 || ~8.1.0 || ~8.2.0', '8.2', true],
    ['^7.4 || ~8.0.0 || ~8.1.0 || ~8.2.0', '8.3', false],
    ['~8.1.0 || ~8.2.0 || ~8.3.0', '8.3', true],
    ['>=7.1', '8.4', true],
    ['>=7.1 <8.0', '8.0', false],
    ['>= 7.1, < 8.1', '8.0', true],
    ['>=8.3.5', '8.3', true],
    ['7.*', '8.0', false],
    ['8.*', '8.2', true],
    ['*', '8.4', true],
    ['^8.0', '8.4', true],
    ['~7', '8.0', false],
    ['~7.3', '7.4', true],
    ['7.2 - 8.1', '8.1', true],
    ['7.2 - 8.1', '8.2', false],
    ['>=7.2 !=8.0.3', '8.0', true],
  ];
  for (const [c, minor, want] of cases) {
    it(`"${c}" allows PHP ${minor}: ${want}`, () => expect(allowsMinor(c, minor)).toBe(want));
  }

  it('matches exact versions', () => {
    expect(allowsVersion('^2.6', '2.6.1.0')).toBe(true);
    expect(allowsVersion('^2.6', '3.0.0.0')).toBe(false);
    expect(allowsVersion('2.6.1', '2.6.1.0')).toBe(true);
  });

  it('returns null for constraints it cannot read', () => {
    expect(allowsMinor('banana', '8.0')).toBeNull();
  });
});

function fakeFetch(db: Record<string, unknown>): typeof fetch {
  return (async (url: string) => {
    const name = String(url).replace(/^.*\/packages\//, '').replace(/\.json$/, '');
    if (!(name in db)) return { ok: false, status: 404, json: async () => ({}) };
    return { ok: true, status: 200, json: async () => db[name] };
  }) as unknown as typeof fetch;
}

const escaper = {
  package: {
    abandoned: 'laminas/laminas-escaper',
    versions: {
      '2.6.1': { version: '2.6.1', version_normalized: '2.6.1.0', require: { php: '^5.6 || ^7.0' } },
      '2.6.0': { version: '2.6.0', version_normalized: '2.6.0.0', require: { php: '^5.6 || ^7.0' } },
      // Older and open-ended: "supports" 8.3 on paper, but it's a downgrade, so it must not be suggested.
      '2.5.2': { version: '2.5.2', version_normalized: '2.5.2.0', require: { php: '>=5.5' } },
      'dev-master': { version: 'dev-master', version_normalized: 'dev-master', require: { php: '^8.0' } },
    },
  },
};
const laminas = {
  package: {
    versions: {
      '2.12.0': { version: '2.12.0', version_normalized: '2.12.0.0', require: { php: '^7.4 || ~8.0.0 || ~8.1.0 || ~8.2.0' } },
      '2.13.0': { version: '2.13.0', version_normalized: '2.13.0.0', require: { php: '~8.1.0 || ~8.2.0 || ~8.3.0' } },
      '2.14.0': { version: '2.14.0', version_normalized: '2.14.0.0', require: { php: '~8.1.0 || ~8.2.0 || ~8.3.0 || ~8.4.0' } },
    },
  },
};

describe('composer check', () => {
  it('reads composer.lock and judges each locked version', async () => {
    const lock = JSON.stringify({ packages: [{ name: 'zendframework/zend-escaper', version: '2.6.1' }, { name: 'laminas/laminas-escaper', version: '2.12.0' }] });
    const json = JSON.stringify({ require: { php: '^7.2' } });
    const r = await checkComposer({ composerJson: json, composerLock: lock, target: '8.3' }, fakeFetch({ 'zendframework/zend-escaper': escaper, 'laminas/laminas-escaper': laminas }));
    expect(r.rootAllowsTarget).toBe(false);
    const [z, l] = r.packages;
    expect(z.supports).toBe('no');
    expect(z.lowestSupporting).toBeNull();
    expect(z.abandoned).toBe('laminas/laminas-escaper');
    expect(l.supports).toBe('no');
    expect(l.lowestSupporting).toBe('2.13.0');
  });

  it('falls back to composer.json constraints without a lock file', async () => {
    const json = JSON.stringify({ require: { php: '>=8.1', 'ext-json': '*', 'laminas/laminas-escaper': '^2.12' } });
    const r = await checkComposer({ composerJson: json, target: '8.4' }, fakeFetch({ 'laminas/laminas-escaper': laminas }));
    expect(r.packages).toHaveLength(1);
    expect(r.packages[0].judged).toBe('2.14.0');
    expect(r.packages[0].supports).toBe('yes');
  });

  it('marks failed lookups as unknown instead of guessing', async () => {
    const lock = JSON.stringify({ packages: [{ name: 'acme/missing', version: '1.0.0' }] });
    const r = await checkComposer({ composerLock: lock, target: '8.3' }, fakeFetch({}));
    expect(r.packages[0].supports).toBe('unknown');
    expect(r.packages[0].error).toMatch(/404/);
  });
});
