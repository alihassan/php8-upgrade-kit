import { constRule, DOC } from './_helpers';

export default constRule({
  id: 'e-strict',
  title: 'The E_STRICT constant is deprecated',
  phpVersion: '8.4',
  severity: 'deprecated',
  constants: ['E_STRICT'],
  explanation:
    'E_STRICT was an error level for "strict standards" notices. PHP removed that level long ago, and 8.4 deprecated the constant. Remove it from error_reporting() calls; E_ALL already covers everything.',
  before: `error_reporting(E_ALL | E_STRICT);`,
  after: `error_reporting(E_ALL);`,
  docUrl: DOC.m84deprecated,
});
