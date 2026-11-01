import { DOC } from './_helpers';
import type { Rule } from '../types';

const rule: Rule = {
  id: 'php-errormsg',
  title: '$php_errormsg no longer exists',
  phpVersion: '8.0',
  severity: 'behavior-change',
  detection: 'ast',
  explanation:
    'PHP used to put the last error message in a variable called $php_errormsg. PHP 8 removed that, so the variable is always empty and error messages your code shows or logs go missing. error_get_last() returns the same information.',
  before: `$data = @file_get_contents($url);\nif ($data === false) log_error($php_errormsg);`,
  after: `$data = @file_get_contents($url);\nif ($data === false) log_error(error_get_last()['message'] ?? 'unknown error');`,
  docUrl: DOC.m80incompat,
  visit: {
    variable(n, ctx) {
      if (n.name === 'php_errormsg') ctx.report(n);
    },
  },
};
export default rule;
