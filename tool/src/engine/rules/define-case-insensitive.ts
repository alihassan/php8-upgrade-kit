import { args, callRule, DOC } from './_helpers';

export default callRule({
  id: 'define-case-insensitive',
  title: 'Case-insensitive constants were removed',
  phpVersion: '8.0',
  severity: 'behavior-change',
  names: ['define'],
  when: (call) => {
    const third = args(call)[2];
    return third?.kind === 'boolean' && third.value === true;
  },
  explanation:
    'define() used to take a third "true" argument so that SITE_NAME and site_name meant the same thing. PHP 8 drops that option: it warns and the constant becomes case-sensitive. Code that used a different spelling of the name will then get an error.',
  before: `define('SITE_NAME', 'Acme', true);\necho site_name;`,
  after: `define('SITE_NAME', 'Acme');\necho SITE_NAME;`,
  docUrl: DOC.m80incompat,
});
