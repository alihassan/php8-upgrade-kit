import { callRule, DOC } from './_helpers';

export default callRule({
  id: 'assert-options',
  title: 'assert_options() is deprecated',
  phpVersion: '8.3',
  severity: 'deprecated',
  names: ['assert_options'],
  explanation:
    'assert_options() changed how assert() behaves while the code runs. PHP 8.3 deprecated it. Set zend.assertions in php.ini instead, and let failed assertions throw exceptions.',
  before: `assert_options(ASSERT_ACTIVE, 1);`,
  after: `; php.ini (development)\nzend.assertions = 1`,
  docUrl: DOC.m83deprecated,
});
