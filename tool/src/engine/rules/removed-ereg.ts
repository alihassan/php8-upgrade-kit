import { callRule, DOC } from './_helpers';

export default callRule({
  id: 'removed-ereg',
  title: 'ereg functions and split() were removed',
  phpVersion: '7.0',
  severity: 'fatal',
  names: ['ereg', 'eregi', 'ereg_replace', 'eregi_replace', 'split', 'spliti', 'sql_regcase'],
  explanation:
    'These old pattern-matching functions were removed back in PHP 7.0, so they fail on every PHP 8 version too. The preg_* functions do the same work. Patterns need delimiters such as slashes around them.',
  before: `if (ereg('^[0-9]+$', $zip)) { ... }\n$parts = split(',', $csv);`,
  after: `if (preg_match('/^[0-9]+$/', $zip)) { ... }\n$parts = explode(',', $csv); // or preg_split() for patterns`,
  docUrl: DOC.m70removed,
});
