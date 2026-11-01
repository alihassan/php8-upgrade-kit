import { callRule, DOC } from './_helpers';

export default callRule({
  id: 'lcg-value',
  title: 'lcg_value() is deprecated',
  phpVersion: '8.4',
  severity: 'deprecated',
  names: ['lcg_value'],
  explanation:
    'lcg_value() returns a random decimal between 0 and 1, but its randomness is poor. PHP 8.4 deprecated it. Use the Random\\Randomizer class, which is built in from PHP 8.3.',
  before: `$r = lcg_value();`,
  after: `$r = (new \\Random\\Randomizer())->getFloat(0, 1);`,
  docUrl: DOC.m84deprecated,
});
