import { callRule, DOC } from './_helpers';

export default callRule({
  id: 'removed-magic-quotes',
  title: 'get_magic_quotes_gpc() and get_magic_quotes_runtime() were removed',
  phpVersion: '8.0',
  severity: 'fatal',
  names: ['get_magic_quotes_gpc', 'get_magic_quotes_runtime', 'set_magic_quotes_runtime'],
  explanation:
    '"Magic quotes" was an old PHP feature that added backslashes to form input. It has been off for years, and PHP 8 removed the functions that checked for it. Code that calls them crashes. On modern PHP the check always returned false, so the fix is usually to delete it.',
  before: `if (get_magic_quotes_gpc()) {\n    $name = stripslashes($_POST['name']);\n}`,
  after: `$name = $_POST['name'];`,
  docUrl: DOC.m80incompat,
});
