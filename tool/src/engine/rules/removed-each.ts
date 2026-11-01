import { callRule, DOC } from './_helpers';

export default callRule({
  id: 'removed-each',
  title: 'each() was removed',
  phpVersion: '8.0',
  severity: 'fatal',
  names: ['each'],
  explanation:
    'each() stepped through an array one item at a time. PHP 8 deleted it, so any page that calls it stops with a fatal error. A foreach loop does the same job.',
  before: `while (list($key, $value) = each($items)) {\n    echo "$key: $value";\n}`,
  after: `foreach ($items as $key => $value) {\n    echo "$key: $value";\n}`,
  docUrl: DOC.m80incompat,
});
