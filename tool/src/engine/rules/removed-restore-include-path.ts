import { callRule, DOC } from './_helpers';

export default callRule({
  id: 'removed-restore-include-path',
  title: 'restore_include_path() was removed',
  phpVersion: '8.0',
  severity: 'fatal',
  names: ['restore_include_path'],
  explanation:
    'restore_include_path() reset the list of folders PHP searches for included files. PHP 8 removed it. Save the old value and put it back with set_include_path() instead.',
  before: `set_include_path('/app/lib');\n// ...\nrestore_include_path();`,
  after: `$old = set_include_path('/app/lib');\n// ...\nset_include_path($old);`,
  docUrl: DOC.m80incompat,
});
