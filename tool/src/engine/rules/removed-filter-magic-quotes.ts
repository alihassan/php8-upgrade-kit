import { constRule, DOC } from './_helpers';

export default constRule({
  id: 'removed-filter-magic-quotes',
  title: 'FILTER_SANITIZE_MAGIC_QUOTES was removed',
  phpVersion: '8.0',
  severity: 'fatal',
  constants: ['FILTER_SANITIZE_MAGIC_QUOTES'],
  explanation:
    'This filter added backslashes to input. PHP 8 removed it, so using it stops the script. FILTER_SANITIZE_ADD_SLASHES does the same thing. For database queries, prepared statements are the safer fix.',
  before: `$name = filter_var($input, FILTER_SANITIZE_MAGIC_QUOTES);`,
  after: `$name = filter_var($input, FILTER_SANITIZE_ADD_SLASHES);\n// better: pass $input to a prepared statement and skip escaping entirely`,
  docUrl: DOC.m80incompat,
});
